
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, User, Loader2, AlertCircle, CheckCircle2, Zap, Shield, Sparkles, Download, Copy, Check, Info } from 'lucide-react';
import { getAvatarUrl } from '../services/avatars';
import { getProfileByStellarId } from '../services/db';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { sendPayment } from '../services/stellar';
import { recordTransaction } from '../services/db';
import { decryptSecret } from '../services/encryption';
import { NotificationService } from '../services/notification';
import { KYCService } from '../services/kycService';
import { ZKProofService, PaymentProof } from '../services/zkProofService';
import { Smartphone, ExternalLink, Mail, ArrowUpRight } from 'lucide-react';
import { getLivePrice } from '../services/priceService';
import { getCurrencySymbol, formatFiat } from '../utils/currency';
import {
    isConnected as freighterIsConnected,
    getAddress as freighterGetAddress,
    signTransaction as freighterSignTransaction
} from '@stellar/freighter-api';
import {
    TransactionBuilder,
    Networks,
    Horizon,
    BASE_FEE,
    Operation,
    Asset,
    Memo
} from '@stellar/stellar-sdk';
import { getNetworkConfig } from '../context/NetworkContext';

const PaymentLink: React.FC = () => {
    const { stellarId } = useParams<{ stellarId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, profile: senderProfile } = useAuth();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const [recipient, setRecipient] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [amount, setAmount] = useState(searchParams.get('amt') || searchParams.get('amount') || '');
    const [note, setNote] = useState(searchParams.get('note') || '');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [zkProof, setZkProof] = useState<PaymentProof | null>(null);
    const [generatingProof, setGeneratingProof] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [freighterAvailable, setFreighterAvailable] = useState(false);
    const [freighterSending, setFreighterSending] = useState(false);
    const [xlmRate, setXlmRate] = useState<number>(15.02);
    const currency = recipient?.preferredCurrency || 'INR';
    const symbol = getCurrencySymbol(currency);

    useEffect(() => {
        if (recipient) {
            getLivePrice('stellar', currency).then(setXlmRate);
        }
    }, [recipient, currency]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    // Detect Freighter extension
    useEffect(() => {
        const checkFreighter = async () => {
            try {
                const result = await freighterIsConnected();
                setFreighterAvailable(result.isConnected === true);
            } catch {
                setFreighterAvailable(false);
            }
        };
        checkFreighter();
    }, []);

    useEffect(() => {
        const loadRecipient = async () => {
            if (!stellarId) {
                setError('Invalid payment link');
                setLoading(false);
                return;
            }

            try {
                const profile = await getProfileByStellarId(stellarId.toLowerCase());
                if (profile) {
                    setRecipient(profile);
                } else {
                    setError('Recipient not found');
                }
            } catch (a) {
                setError('Failed to load recipient');
            }
            setLoading(false);
        };

        loadRecipient();
    }, [stellarId]);



    const handlePayWithMetaMask = () => {
        if (!recipient?.ethAddress) return;
        const ethVal = amount ? amount : '0';
        // EIP-681 standard
        const uri = `ethereum:${recipient.ethAddress}?value=${ethVal}`;
        window.location.href = uri;
    };

    const handlePayWithFreighter = async () => {
        if (!recipient?.publicKey || !amount) return;
        setFreighterSending(true);
        setError(null);

        try {
            // 1. Get sender's address from Freighter
            const { address: senderPubKey, error: addrErr } = await freighterGetAddress();
            if (addrErr || !senderPubKey) {
                throw new Error('Freighter: Could not get wallet address. Please unlock Freighter and try again.');
            }

            // 2. Build an unsigned transaction
            const networkConfig = getNetworkConfig();
            const server = new Horizon.Server(networkConfig.horizonUrl);
            const senderAccount = await server.loadAccount(senderPubKey);

            const txBuilder = new TransactionBuilder(senderAccount, {
                fee: BASE_FEE,
                networkPassphrase: networkConfig.networkPassphrase,
            });

            txBuilder.addOperation(
                Operation.payment({
                    destination: recipient.publicKey,
                    asset: Asset.native(),
                    amount: parseFloat(amount).toFixed(7),
                })
            );

            if (note) {
                txBuilder.addMemo(Memo.text(note.substring(0, 28)));
            }

            txBuilder.setTimeout(120);
            const tx = txBuilder.build();
            const xdr = tx.toXDR();

            // 3. Send to Freighter for signing
            const { signedTxXdr, error: signErr } = await freighterSignTransaction(xdr, {
                networkPassphrase: networkConfig.networkPassphrase,
            });

            if (signErr || !signedTxXdr) {
                throw new Error('Transaction was rejected or signing failed.');
            }

            // 4. Submit the signed transaction to Horizon
            const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkConfig.networkPassphrase);
            const result = await server.submitTransaction(signedTx);
            const txHash = (result as any).hash || (result as any).id || '';

            // 5. Record in our DB
            await recordTransaction({
                fromId: senderPubKey.substring(0, 10) + '@stellar',
                toId: recipient.stellarId,
                fromName: 'Freighter Wallet',
                toName: recipient.displayName || recipient.stellarId,
                amount: parseFloat(amount),
                currency: currency,
                status: 'SUCCESS',
                memo: note || 'Freighter Payment',
                txHash,
                isFamilySpend: false
            });

            NotificationService.sendInAppNotification(
                recipient.stellarId,
                'Freighter Payment Received',
                `Received ${amount} XLM from a Freighter wallet`,
                'payment'
            );

            setSuccess(true);
        } catch (e: any) {
            console.error('Freighter pay error:', e);
            setError(e.message || 'Freighter payment failed');
        } finally {
            setFreighterSending(false);
        }
    };

    const handlePay = async () => {
        if (!senderProfile || !recipient || !amount) return;

        setSending(true);
        try {
            const phone = localStorage.getItem('ching_phone') || '';
            const currentPin = senderProfile.pin || '0000';

            // Smart Decryption Strategy
            let password = KYCService.deriveEncryptionKey(phone, currentPin);
            let secret = decryptSecret(senderProfile.encryptedSecret, password);

            // Legacy Fallback (handles old PIN-sync bug)
            if ((!secret || !secret.startsWith('S')) && currentPin !== '0000') {
                const fallbackPassword = KYCService.deriveEncryptionKey(phone, '0000');
                secret = decryptSecret(senderProfile.encryptedSecret, fallbackPassword);
            }

            if (!secret || !secret.startsWith('S')) {
                setError('Your Stellar Vault is locked. Try logging out and back in once to sync your keys.');
                setSending(false);
                return;
            }

            const txHash = await sendPayment(secret, recipient.publicKey, amount, note || 'Payment Link');

            // Generate ZK Proof of Payment
            setGeneratingProof(true);
            const proof = await ZKProofService.generateProofOfPayment(
                secret,
                txHash,
                amount,
                recipient.stellarId
            );

            // Send Proof to SDK to trigger UPI payout
            await ZKProofService.triggerUPIPayout(proof);

            setZkProof(proof);
            setGeneratingProof(false);

            await recordTransaction({
                fromId: senderProfile.stellarId,
                toId: recipient.stellarId,
                fromName: senderProfile.displayName || senderProfile.stellarId,
                toName: recipient.displayName || recipient.stellarId,
                amount: parseFloat(amount),
                currency: currency,
                status: 'SUCCESS',
                memo: note || 'Payment Link',
                txHash,
                isFamilySpend: false
            });

            NotificationService.sendInAppNotification(
                recipient.stellarId,
                "Payment Link Received",
                `Received ${amount} XLM from ${senderProfile.displayName || senderProfile.stellarId.split('@')[0]}`,
                'payment'
            );

            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Payment failed');
        }
        setSending(false);
        setGeneratingProof(false);
    };

    const avatarUrl = recipient
        ? getAvatarUrl(recipient.avatarSeed || recipient.stellarId)
        : '';

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex items-center justify-center">
                <Loader2 size={40} className="text-[#E5D5B3] animate-spin" />
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col items-center justify-center px-6">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                </div>
                <h1 className="text-2xl font-black mb-2">Payment Sent!</h1>
                <p className="text-zinc-400 text-center mb-8">
                    {amount} XLM sent to {recipient?.displayName || stellarId}
                </p>

                {zkProof && (
                    <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3">
                            <Sparkles size={16} className="text-[#E5D5B3] opacity-50" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#E5D5B3] mb-4">zk-SNARK Verification</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-zinc-500">Proof Status</span>
                                <span className="text-emerald-400 font-bold">VERIFIED</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">Proof String (Compressed)</span>
                                <code className="text-[10px] text-zinc-300 bg-black/40 p-2 rounded-lg break-all font-mono">
                                    {zkProof.proof}
                                </code>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500">Public Signals</span>
                                <span className="text-zinc-400 font-mono">[{zkProof.publicSignals.join(', ')}]</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Payout Triggered via UPI Bridge</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-8 py-4 gold-gradient text-black font-black rounded-2xl shadow-xl w-full max-w-md"
                >
                    Done
                </button>
            </div>
        );
    }

    // Main payment form (Directly accessible to everyone)
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white px-6 py-10 flex flex-col items-center">
            {/* Receiver Identity - Refined */}
            <div className="w-full max-w-md mb-10 text-center flex flex-col items-center">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-[#E5D5B3]/20 rounded-full blur-2xl animate-pulse" />
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-24 h-24 rounded-[2.5rem] bg-zinc-800 border-4 border-white/5 relative z-10"
                    />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-1">{recipient?.displayName || stellarId?.split('@')[0]}</h2>
                <div className="flex items-center gap-2 justify-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{stellarId}</span>
                </div>
            </div>

            {/* Main Selection Hub - Reorganized for Freighter Priority */}
            <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* 1. Freighter / Stellar Wallet (Primary for this app) */}
                <div className="relative group p-1 bg-gradient-to-br from-purple-500/20 to-transparent rounded-[2.5rem]">
                    <div className="bg-[#0d1210] border border-purple-500/20 rounded-[2.4rem] p-6 flex flex-col items-center text-center h-full">
                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 relative">
                            <Wallet size={28} className="text-purple-400" />
                            {freighterAvailable && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d1210]" />
                            )}
                        </div>
                        <h3 className="text-lg font-black mb-2">Freighter</h3>
                        <p className="text-zinc-500 text-[9px] leading-relaxed mb-6 px-2 font-medium uppercase tracking-widest opacity-60 flex-grow">
                            {freighterAvailable ? (
                                <>Extension Detected<br /><span className="text-emerald-400 font-black">Ready to Pay</span></>
                            ) : (
                                <>Install Freighter Extension<br /><span className="text-purple-400 font-black">Stellar Wallet</span></>
                            )}
                        </p>

                        <button
                            onClick={freighterAvailable ? handlePayWithFreighter : () => window.open('https://www.freighter.app/', '_blank')}
                            disabled={freighterAvailable ? (!recipient?.publicKey || !amount || freighterSending) : false}
                            className="w-full py-4 bg-purple-600 text-white font-black rounded-xl text-[9px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-lg hover:bg-purple-500 disabled:opacity-30"
                        >
                            {freighterSending ? <Loader2 className="animate-spin mx-auto" size={14} /> : freighterAvailable ? 'Pay with Freighter' : 'Get Freighter'}
                        </button>
                    </div>
                </div>

                {/* 2. Ching Pay Native Option */}
                <div className="relative group p-1 bg-gradient-to-br from-[#E5D5B3]/20 to-transparent rounded-[2.5rem]">
                    <div className="bg-[#0d1210] border border-[#E5D5B3]/20 rounded-[2.4rem] p-6 flex flex-col items-center text-center h-full scale-[1.05] shadow-2xl relative z-10">
                        <div className="w-14 h-14 bg-[#E5D5B3]/10 rounded-2xl flex items-center justify-center mb-4">
                            <Zap size={28} className="text-[#E5D5B3]" />
                        </div>
                        <h3 className="text-lg font-black mb-2 text-[#E5D5B3]">Native</h3>
                        <p className="text-zinc-500 text-[9px] leading-relaxed mb-6 px-2 font-medium uppercase tracking-widest opacity-60 flex-grow">
                            Web3 Checkout <br />
                            <span className="text-[#E5D5B3] font-black">Vault Powered</span>
                        </p>

                        <button
                            onClick={isAuthenticated ? handlePay : () => navigate('/login', { state: { from: `/pay/${stellarId}${searchParams.toString() ? '?' + searchParams.toString() : ''}` } })}
                            disabled={!amount || sending}
                            className="w-full py-4 gold-gradient text-black font-black rounded-xl text-[9px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-xl disabled:opacity-30"
                        >
                            {sending ? <Loader2 className="animate-spin" size={14} /> : 'Pay Native'}
                        </button>
                    </div>
                </div>

                {/* 3. MetaMask Option */}
                <div className="relative group p-1 bg-gradient-to-br from-orange-500/20 to-transparent rounded-[2.5rem]">
                    <div className="bg-[#0d1210] border border-orange-500/20 rounded-[2.4rem] p-6 flex flex-col items-center text-center h-full">
                        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Mirror_Logo.svg" className="w-8 h-8" alt="MetaMask" />
                        </div>
                        <h3 className="text-lg font-black mb-2">MetaMask</h3>
                        <p className="text-zinc-500 text-[9px] leading-relaxed mb-6 px-2 font-medium uppercase tracking-widest opacity-60 flex-grow">
                            Pay with ETH/WXL <br />
                            <span className="text-orange-400 font-black">Cross-Chain</span>
                        </p>

                        <button
                            onClick={handlePayWithMetaMask}
                            disabled={!recipient?.ethAddress}
                            className="w-full py-4 bg-orange-600 text-white font-black rounded-xl text-[9px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-lg hover:bg-orange-500 disabled:opacity-30"
                        >
                            Pay with ETH
                        </button>
                    </div>
                </div>
            </div>

            {/* Amount Input */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 mb-6 text-center w-full max-w-md relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E5D5B3]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 relative z-10">Amount</p>
                <div className="flex items-baseline justify-center gap-2 mb-2 relative z-10">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="0"
                        className="bg-transparent text-5xl font-black text-center w-full max-w-[200px] outline-none placeholder-zinc-800 text-[#E5D5B3]"
                        autoFocus
                    />
                    <span className="text-zinc-500 font-bold">XLM</span>
                </div>
                {amount && (
                    <p className="text-emerald-500/60 font-black text-xs uppercase tracking-widest relative z-10">
                        ≈ {symbol}{formatFiat(parseFloat(amount) * xlmRate, currency)}
                    </p>
                )}
            </div>

            {/* Note */}
            {note && (
                <div className="bg-white/5 rounded-2xl p-4 mb-8 text-center w-full max-w-md">
                    <p className="text-zinc-400 text-sm">"{note}"</p>
                </div>
            )}

            {/* Receiver's Wallet Preview */}
            <div className="w-full max-w-md space-y-4 mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 text-center mb-2">Recipient's Wallets</p>

                <div className="w-full py-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between px-6">
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Mirror_Logo.svg" className="w-6 h-6" alt="MetaMask" />
                        </div>
                        <div>
                            <p className="font-black text-sm text-white">Ethereum Address</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                {recipient?.ethAddress ? `${recipient.ethAddress.slice(0, 6)}...${recipient.ethAddress.slice(-4)}` : 'Not Set'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full py-4 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-2xl flex items-center justify-between px-6">
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-[#7C3AED]" />
                        </div>
                        <div>
                            <p className="font-black text-sm text-white">Stellar Public Key</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                {recipient?.publicKey ? `${recipient.publicKey.slice(0, 6)}...${recipient.publicKey.slice(-4)}` : 'Not Set'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Onboarding Section - "New to Ching Pay?" (Only show for Guests) */}
            {!isAuthenticated && (
                <div className="w-full max-w-md mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#E5D5B3]">
                                <Download size={24} />
                            </div>
                            <h3 className="text-xl font-black mb-3">Install Ching Pay</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed mb-8 px-4">
                                The ultimate Web3 UPI toolkit. Send money instantly using your phone number with near-zero gas fees.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    Get Started Free
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-2"
                                >
                                    {linkCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    {linkCopied ? 'Link Copied' : 'Share this payment link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trust Footer */}
            <div className="w-full max-w-sm text-center pb-12">
                <div className="flex items-center justify-center gap-6 mb-6 opacity-30 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Stellar_Symbol.svg" className="h-5" alt="Stellar" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Mirror_Logo.svg" className="h-5" alt="MetaMask" />
                    <Shield size={20} className="text-white" />
                </div>
                <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.3em] leading-loose">
                    De-Fi Powered Gateway <br />
                    <span className="text-zinc-800">Verified by zk-SNARK Protocol v2.5</span>
                </p>
            </div>
        </div>
    );
};

export default PaymentLink;
