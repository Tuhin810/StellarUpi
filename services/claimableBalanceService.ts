
import {
    Keypair,
    Asset,
    Operation,
    TransactionBuilder,
    Networks,
    Horizon,
    BASE_FEE,
    Claimant
} from '@stellar/stellar-sdk';
import { getNetworkConfig } from '../context/NetworkContext';

const getServer = () => {
    const config = getNetworkConfig();
    return new Horizon.Server(config.horizonUrl);
};

const getNetworkPassphrase = () => {
    const config = getNetworkConfig();
    return config.networkPassphrase;
};

/**
 * Creates a viral payment link.
 * 1. Generates a temporary keypair.
 * 2. Creates a claimable balance for that temporary keypair.
 * 3. Returns the claimable balance ID and the temporary secret key (to be put in a link).
 */
export const createViralPayment = async (
    senderSecret: string,
    amount: string,
    asset: Asset = Asset.native()
) => {
    const server = getServer();
    const sourceKeypair = Keypair.fromSecret(senderSecret);
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

    // 1. Generate a temporary keypair for the recipient
    const tempKeypair = Keypair.random();
    const tempPublicKey = tempKeypair.publicKey();

    // 2. Define the claimant (the temporary account)
    // We use a simple predicate: unconditional
    const claimants = [
        new Claimant(tempPublicKey, Claimant.predicateUnconditional())
    ];

    // 3. Create the claimable balance
    const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: getNetworkPassphrase(),
    })
        .addOperation(
            Operation.createClaimableBalance({
                asset,
                amount,
                claimants
            })
        )
        .setTimeout(180)
        .build();

    transaction.sign(sourceKeypair);
    const result = await server.submitTransaction(transaction);

    // Extraction of Claimable Balance ID from result
    const txResponse = await server.transactions().transaction(result.hash).call();

    // For simplicity, we return the hash and the secret. The claimer can find the ID by looking at the TX.

    return {
        txHash: result.hash,
        tempSecret: tempKeypair.secret(),
        tempPublicKey: tempPublicKey,
        amount,
        asset: asset.isNative() ? 'XLM' : asset.getCode()
    };
};

/**
 * Claims a viral payment into a target wallet.
 * @param claimableBalanceId The ID of the claimable balance
 * @param tempSecret The temporary secret key that has the right to claim
 * @param targetPublicKey The account that will actually receive the funds
 */
export const claimViralPayment = async (
    claimableBalanceId: string,
    tempSecret: string,
    targetPublicKey: string
) => {
    const server = getServer();
    const tempKeypair = Keypair.fromSecret(tempSecret);

    // We need an account to pay for the transaction fee. 
    // Usually, the recipient's new/existing account pays the fee.
    // If the recipient account doesn't exist yet, this is the "Cold Start" problem.
    // For the hackathon, we can assume the app (or a service) pays the fee, or the recipient already has 1 XLM.
    // OR we can use the tempKeypair itself if it was funded (not the case here).

    // BETTER: The target account pays the fee.
    const targetAccount = await server.loadAccount(targetPublicKey);

    const transaction = new TransactionBuilder(targetAccount, {
        fee: BASE_FEE,
        networkPassphrase: getNetworkPassphrase(),
    })
        .addOperation(
            Operation.claimClaimableBalance({
                balanceId: claimableBalanceId
            })
        )
        .setTimeout(180)
        .build();

    // The transaction must be signed by:
    // 1. The source (targetAccount) to pay fees.
    // 2. The claimant (tempKeypair) to authorize the claim.
    transaction.sign(tempKeypair);
    // Note: The caller should also sign with the targetSecret if it's the fee payer, 
    // but usually, this service would be used in a context where we have the target's secret.

    return transaction;
};

/**
 * Finds claimable balances for a specific public key.
 */
export const getClaimableBalances = async (publicKey: string) => {
    const server = getServer();
    const response = await server.claimableBalances().claimant(publicKey).call();
    return response.records;
};
