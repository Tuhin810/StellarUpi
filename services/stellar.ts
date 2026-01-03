
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

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

export const createWallet = async () => {
  const pair = Keypair.random();
  const publicKey = pair.publicKey();
  const secret = pair.secret();

  // Fund the account on Testnet using Friendbot
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    if (!response.ok) {
      console.warn("Friendbot response not OK", await response.text());
    }
  } catch (e) {
    console.error("Friendbot funding failed", e);
  }

  return { publicKey, secret };
};

export const getBalance = async (publicKey: string): Promise<string> => {
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    return nativeBalance ? nativeBalance.balance : '0.00';
  } catch (e) {
    console.error("GetBalance error:", e);
    return '0.00';
  }
};

export const sendPayment = async (
  senderSecret: string, 
  recipientPublicKey: string, 
  amount: string,
  memoText: string = "Sent via StellarPay"
): Promise<string> => {
  const sourceKeypair = Keypair.fromSecret(senderSecret);
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
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
