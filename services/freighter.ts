import {
    isConnected,
    isAllowed,
    setAllowed,
    getAddress,
    signTransaction,
    signMessage
} from "@stellar/freighter-api";

const withTimeout = <T>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Freighter request timed out. Please check if the extension is locked or popups are blocked.")), ms)
        )
    ]);
};

export const isFreighterInstalled = async () => {
    try {
        const result = await isConnected();
        return !!result.isConnected;
    } catch (e) {
        return false;
    }
};

export const connectFreighter = async () => {
    console.log("Freighter: connectFreighter called");
    if (!await isFreighterInstalled()) {
        throw new Error("Freighter not installed");
    }

    console.log("Freighter: Requesting permission...");
    const { isAllowed: allowed, error } = await withTimeout(setAllowed());
    if (error) throw new Error(error);
    if (!allowed) throw new Error("Connection rejected");

    console.log("Freighter: Fetching address...");
    const { address, error: addrError } = await withTimeout(getAddress());
    if (addrError) throw new Error(addrError);
    if (!address) throw new Error("No address returned");

    return address;
};

export const freighterSignMessage = async (message: string) => {
    const result = await withTimeout(signMessage(message), 30000); // 30s for signature
    if (result.error) {
        throw new Error(result.error);
    }
    if (!result.signedMessage) {
        throw new Error("Failed to sign message");
    }

    // In v6, signedMessage can be string or Buffer
    if (typeof result.signedMessage === 'string') {
        return result.signedMessage;
    }
    return result.signedMessage.toString('base64');
};

export const freighterSignTransaction = async (xdr: string, networkPassphrase: string) => {
    const result = await signTransaction(xdr, { networkPassphrase });
    if (result.error) {
        throw new Error(result.error);
    }
    return result.signedTxXdr;
};
