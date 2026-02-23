
import SignClient from '@walletconnect/sign-client';
import {
    TransactionBuilder,
    Networks,
    Horizon,
    BASE_FEE,
    Operation,
    Asset,
    Memo,
    Account
} from '@stellar/stellar-sdk';
import { getNetworkConfig } from '../context/NetworkContext';

// Get a free Project ID from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = 'd55dafd4256f6823dc6f70e29e78b0da';

export interface WCPaymentRequest {
    recipientPublicKey: string;
    amount: string; // XLM amount
    memo?: string;
}

export class WalletConnectService {
    private static client: SignClient | null = null;
    private static session: any = null;
    private static initPromise: Promise<SignClient> | null = null;

    /**
     * Initialize the WalletConnect SignClient.
     */
    static async init(): Promise<SignClient> {
        if (this.client) return this.client;
        if (this.initPromise) return this.initPromise;

        this.initPromise = SignClient.init({
            projectId: WALLETCONNECT_PROJECT_ID,
            metadata: {
                name: 'Ching Pay',
                description: 'Web3 UPI — Instant Stellar Payments',
                url: window.location.origin,
                icons: [`${window.location.origin}/logo192.png`]
            }
        });

        this.client = await this.initPromise;

        // Listen for session events
        this.client.on('session_event', (event) => {
            console.log('📡 WC session_event:', event);
        });

        this.client.on('session_delete', () => {
            console.log('🔌 WC session deleted');
            this.session = null;
        });

        return this.client;
    }

    /**
     * Create a pairing URI for the QR code.
     * Returns the `wc:...` URI that Freighter can scan.
     */
    static async createPairing(): Promise<{ uri: string; approval: () => Promise<any> }> {
        const client = await this.init();

        const networkConfig = getNetworkConfig();
        const isMainnet = networkConfig.networkPassphrase === Networks.PUBLIC;
        const chainId = isMainnet ? 'stellar:pubnet' : 'stellar:testnet';

        const { uri, approval } = await client.connect({
            optionalNamespaces: {
                stellar: {
                    methods: ['stellar_signAndSubmitXDR', 'stellar_signXDR'],
                    chains: [chainId],
                    events: []
                }
            }
        });

        return { uri: uri!, approval };
    }

    /**
     * Wait for Freighter to approve the pairing, then store the session.
     */
    static async waitForSession(approval: () => Promise<any>): Promise<string> {
        const session = await approval();
        this.session = session;

        // Extract the connected Stellar address
        const accounts = session.namespaces?.stellar?.accounts || [];
        // Format: "stellar:pubnet:GXXX..." or "stellar:testnet:GXXX..."
        const firstAccount = accounts[0] || '';
        const senderAddress = firstAccount.split(':').pop() || '';

        console.log('✅ WC Session established! Sender:', senderAddress);
        return senderAddress;
    }

    /**
     * Build a payment XDR and request Freighter to sign+submit it.
     */
    static async requestPayment(request: WCPaymentRequest): Promise<string> {
        if (!this.session || !this.client) {
            throw new Error('No active WalletConnect session');
        }

        const networkConfig = getNetworkConfig();
        const isMainnet = networkConfig.networkPassphrase === Networks.PUBLIC;
        const chainId = isMainnet ? 'stellar:pubnet' : 'stellar:testnet';

        // Get sender from session
        const accounts = this.session.namespaces?.stellar?.accounts || [];
        const firstAccount = accounts[0] || '';
        const senderPubKey = firstAccount.split(':').pop() || '';

        if (!senderPubKey) {
            throw new Error('No Stellar address in WalletConnect session');
        }

        // Load sender account from Horizon
        const server = new Horizon.Server(networkConfig.horizonUrl);
        const senderAccount = await server.loadAccount(senderPubKey);

        // Build the payment transaction
        const txBuilder = new TransactionBuilder(senderAccount, {
            fee: BASE_FEE,
            networkPassphrase: networkConfig.networkPassphrase,
        });

        txBuilder.addOperation(
            Operation.payment({
                destination: request.recipientPublicKey,
                asset: Asset.native(),
                amount: parseFloat(request.amount).toFixed(7),
            })
        );

        if (request.memo) {
            txBuilder.addMemo(Memo.text(request.memo.substring(0, 28)));
        }

        txBuilder.setTimeout(120);
        const tx = txBuilder.build();
        const xdr = tx.toXDR();

        // Request Freighter to sign and submit
        const result = await this.client.request({
            topic: this.session.topic,
            chainId,
            request: {
                method: 'stellar_signAndSubmitXDR',
                params: { xdr }
            }
        });

        console.log('✅ WC Payment result:', result);

        // Result usually contains the tx hash or signed XDR
        if (typeof result === 'string') return result;
        if (result && (result as any).hash) return (result as any).hash;
        if (result && (result as any).id) return (result as any).id;

        return 'wc-tx-submitted';
    }

    /**
     * Disconnect the current session.
     */
    static async disconnect() {
        if (this.client && this.session) {
            try {
                await this.client.disconnect({
                    topic: this.session.topic,
                    reason: { code: 6000, message: 'Payment complete' }
                });
            } catch (e) {
                console.warn('WC disconnect error:', e);
            }
            this.session = null;
        }
    }
}
