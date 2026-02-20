
import {
  Keypair,
  Asset,
  Operation,
  TransactionBuilder,
  Networks,
  Horizon,
  BASE_FEE,
  Memo
} from '@stellar/stellar-sdk';
import { getNetworkConfig } from '../context/NetworkContext';

// Get dynamic server based on current network
const getServer = () => {
  const config = getNetworkConfig();
  return new Horizon.Server(config.horizonUrl);
};

// Get network passphrase based on current network
const getNetworkPassphrase = () => {
  const config = getNetworkConfig();
  return config.networkPassphrase;
};

// Check if we're on mainnet
const isMainnet = () => {
  const config = getNetworkConfig();
  return config.name === 'Mainnet';
};

export const createWallet = async () => {
  const pair = Keypair.random();
  const publicKey = pair.publicKey();
  const secret = pair.secret();

  // Only fund on Testnet using Friendbot
  if (!isMainnet()) {
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (!response.ok) {
        console.warn("Friendbot response not OK", await response.text());
      }
    } catch (e) {
      console.error("Friendbot funding failed", e);
    }
  }

  return { publicKey, secret };
};

export const getBalance = async (publicKey: string): Promise<string> => {
  try {
    const server = getServer();
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    return nativeBalance ? nativeBalance.balance : '0.00';
  } catch (e: any) {
    if (e?.response?.status === 404) return '0.00';
    console.error("GetBalance error:", e);
    return '0.00';
  }
};

export const getDetailedBalance = async (publicKey: string) => {
  try {
    const server = getServer();
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    const total = parseFloat(nativeBalance?.balance || '0');

    // Calculate reserve: 2 base reserves (1 XLM) + 0.5 XLM for each subentry
    const subentryCount = account.subentry_count || 0;
    const reserve = (2 + subentryCount) * 0.5;
    const spendable = Math.max(0, total - reserve - 0.01); // 0.01 buffer for fees

    return {
      total: total.toFixed(7),
      spendable: spendable.toFixed(7),
      reserve: reserve.toFixed(2)
    };
  } catch (e: any) {
    if (e?.response?.status === 404) {
      return { total: '0.00', spendable: '0.00', reserve: '1.00' };
    }
    return { total: '0.00', spendable: '0.00', reserve: '1.00' };
  }
};

export const sendPayment = async (
  senderSecret: string,
  recipientPublicKey: string,
  amount: string,
  memoText: string = "Sent via Ching Pay"
): Promise<string> => {
  const server = getServer();
  const sourceKeypair = Keypair.fromSecret(senderSecret);
  let sourceAccount;
  try {
    sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
  } catch (e: any) {
    if (e?.response?.status === 404) {
      throw new Error(`Your wallet (${sourceKeypair.publicKey().substring(0, 8)}...) is not activated. You need to fund it with at least 1 XLM to start sending payments.`);
    }
    throw e;
  }

  // Check if destination account exists to decide between payment and createAccount
  let destinationExists = true;
  try {
    await server.loadAccount(recipientPublicKey);
  } catch (e: any) {
    if (e?.response?.status === 404) {
      destinationExists = false;
    } else {
      throw e;
    }
  }

  const transactionBuilder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  });

  if (destinationExists) {
    transactionBuilder.addOperation(
      Operation.payment({
        destination: recipientPublicKey,
        asset: Asset.native(),
        amount: amount,
      })
    );
  } else {
    // If account doesn't exist, we must use createAccount to fund/activate it
    // Note: amount must be at least 1 XLM for mainnet activation
    transactionBuilder.addOperation(
      Operation.createAccount({
        destination: recipientPublicKey,
        startingBalance: amount,
      })
    );
  }

  const transaction = transactionBuilder
    .addMemo(Memo.text(memoText.substring(0, 28)))
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);
  try {
    const result = await server.submitTransaction(transaction);
    return result.hash;
  } catch (error: any) {
    const resultCodes = error.response?.data?.extras?.result_codes;
    if (resultCodes) {
      if (resultCodes.operations?.includes('op_underfunded')) {
        throw new Error('Insufficient funds. Ensure you have enough XLM to cover the amount and fees (0.00001 XLM). On Mainnet, your balance must also stay above the 1 XLM reserve.');
      }
      if (resultCodes.operations?.includes('op_low_reserve')) {
        throw new Error('Transaction would drop balance below the required network reserve (1 XLM).');
      }
    }
    throw error;
  }
};
/**
 * Atomic Transaction with "Chillar" Savings
 * Sends a main payment to the recipient and a round-up amount to the user's Gullak vault.
 */
export const sendChillarPayment = async (
  senderSecret: string,
  recipientPublicKey: string,
  gullakPublicKey: string,
  mainAmountXlm: string,
  chillarAmountXlm: string,
  memoText: string = "Ching Pay + Chillar"
): Promise<string> => {
  const server = getServer();
  const sourceKeypair = Keypair.fromSecret(senderSecret);
  const sourcePublicKey = sourceKeypair.publicKey();

  const sourceAccount = await server.loadAccount(sourcePublicKey);

  // Check if destination accounts exist
  let destinationExists = true;
  try {
    await server.loadAccount(recipientPublicKey);
  } catch (e: any) {
    if (e?.response?.status === 404) destinationExists = false;
  }

  let gullakExists = true;
  try {
    await server.loadAccount(gullakPublicKey);
  } catch (e: any) {
    if (e?.response?.status === 404) gullakExists = false;
  }

  // Build transaction with two operations
  const transactionBuilder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  });

  // 1. Operation: Payment or Create Account for recipient
  if (destinationExists) {
    transactionBuilder.addOperation(
      Operation.payment({
        destination: recipientPublicKey,
        asset: Asset.native(),
        amount: mainAmountXlm,
      })
    );
  } else {
    transactionBuilder.addOperation(
      Operation.createAccount({
        destination: recipientPublicKey,
        startingBalance: mainAmountXlm,
      })
    );
  }

  // 2. Operation: Payment or Create Account for Gullak (Savings)
  if (gullakExists) {
    transactionBuilder.addOperation(
      Operation.payment({
        destination: gullakPublicKey,
        asset: Asset.native(),
        amount: chillarAmountXlm,
      })
    );
  } else {
    transactionBuilder.addOperation(
      Operation.createAccount({
        destination: gullakPublicKey,
        startingBalance: chillarAmountXlm,
      })
    );
  }

  const transaction = transactionBuilder
    .addMemo(Memo.text(memoText.substring(0, 28)))
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);

  try {
    const result = await server.submitTransaction(transaction);
    return result.hash;
  } catch (error: any) {
    console.error("Chillar Transacton Error:", error.response?.data?.extras?.result_codes);
    throw error;
  }
};

// Check if account exists and is funded
export const isAccountFunded = async (publicKey: string): Promise<boolean> => {
  try {
    const server = getServer();
    await server.loadAccount(publicKey);
    return true;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      return false;
    }
    throw e;
  }
};
