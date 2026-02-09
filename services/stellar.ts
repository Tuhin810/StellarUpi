
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
    // Account not found (not activated on mainnet)
    if (e?.response?.status === 404) {
      return '0.00';
    }
    console.error("GetBalance error:", e);
    return '0.00';
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
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      Operation.payment({
        destination: recipientPublicKey,
        asset: Asset.native(),
        amount: amount,
      })
    )
    .addMemo(Memo.text(memoText.substring(0, 28)))
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);
  const result = await server.submitTransaction(transaction);
  return result.hash;
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
