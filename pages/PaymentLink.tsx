
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, User, Loader2, AlertCircle, CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react';
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

const PaymentLink: React.FC = () => {
    const { stellarId } = useParams<{ stellarId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, profile: senderProfile } = useAuth();

    const [recipient, setRecipient] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [amount, setAmount] = useState(searchParams.get('amount') || '');
    const [note, setNote] = useState(searchParams.get('note') || '');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [zkProof, setZkProof] = useState<PaymentProof | null>(null);
    const [generatingProof, setGeneratingProof] = useState(false);

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



    const handlePay = async () => {
        if (!senderProfile || !recipient || !amount) return;

        setSending(true);
        try {
            const password = KYCService.deriveEncryptionKey(localStorage.getItem('ching_phone') || '', senderProfile.pin || '0000');
            if (!password) {
                setError('Vault locked. Please login again.');
                setSending(false);
                return;
            }
            const secret = decryptSecret(senderProfile.encryptedSecret, password);
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
                currency: 'XLM',
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
            {/* Header */}
            <div className="text-center mb-10 w-full">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Zap size={16} className="text-[#E5D5B3]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Universal Checkout</span>
                </div>
                <h1 className="text-2xl font-black">Send Payment</h1>
            </div>

            {/* Recipient Card */}

            {/* x */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 mb-8 w-full max-w-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Paying To</p>
                <div className="flex items-center gap-4">
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-14 h-14 rounded-2xl bg-zinc-800"
                    />
                    <div>
                        <p className="font-black text-lg truncate max-w-[200px]">{recipient?.displayName || stellarId?.split('@')[0]}</p>
                        <p className="text-zinc-500 text-sm">{stellarId}</p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="w-full max-w-md mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                    <AlertCircle size={18} />
                    <p className="text-xs font-bold">{error}</p>
                </div>
            )}

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
                        ≈ ₹{(parseFloat(amount) * 8.42).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                )}
            </div>

            {/* Note */}
            {note && (
                <div className="bg-white/5 rounded-2xl p-4 mb-8 text-center w-full max-w-md">
                    <p className="text-zinc-400 text-sm">"{note}"</p>
                </div>
            )}

            {/* Pay Button */}
            <div className="w-full max-w-md space-y-6">
                <button
                    onClick={isAuthenticated ? handlePay : () => navigate('/login', { state: { from: `/pay/${stellarId}${searchParams.toString() ? '?' + searchParams.toString() : ''}` } })}
                    disabled={!amount || sending}
                    className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${amount && !sending
                        ? 'gold-gradient text-black shadow-xl shadow-[#E5D5B3]/20 active:scale-[0.98]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                >
                    {sending ? (
                        <div className="flex items-center gap-2">
                            {generatingProof ? <Shield size={20} className="text-[#E5D5B3] animate-pulse" /> : <Loader2 size={22} className="animate-spin" />}
                            <span className="text-sm uppercase tracking-widest">{generatingProof ? 'Generating ZK Proof...' : 'Processing...'}</span>
                        </div>
                    ) : (
                        <>
                            <ArrowRight size={22} />
                            {isAuthenticated ? 'Pay Now' : 'Login to Pay'}
                        </>
                    )}
                </button>

                {/* Secondary Login Option for Guests */}

            </div>

            {/* Security note */}
            <p className="text-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em] mt-auto pt-10">
                Secured by Stellar Cross-Chain Bridge
            </p>
        </div>
    );
};

export default PaymentLink;
