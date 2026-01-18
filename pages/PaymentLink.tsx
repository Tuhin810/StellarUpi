
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, User, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { getProfileByStellarId } from '../services/db';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { sendPayment } from '../services/stellar';
import { recordTransaction } from '../services/db';
import { decryptSecret } from '../services/encryption';

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

    useEffect(() => {
        const loadRecipient = async () => {
            if (!stellarId) {
                setError('Invalid payment link');
                setLoading(false);
                return;
            }

            try {
                const profile = await getProfileByStellarId(stellarId);
                if (profile) {
                    setRecipient(profile);
                } else {
                    setError('Recipient not found');
                }
            } catch (e) {
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
            const password = sessionStorage.getItem('temp_vault_key');
            if (!password) {
                setError('Vault locked. Please login again.');
                setSending(false);
                return;
            }
            const secret = decryptSecret(senderProfile.encryptedSecret, password);
            const txHash = await sendPayment(secret, recipient.publicKey, amount, note || 'Payment Link');

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

            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Payment failed');
        }
        setSending(false);
    };

    const avatarUrl = recipient
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${recipient.avatarSeed || recipient.stellarId}`
        : '';

    // Not logged in - show login prompt
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col items-center justify-center px-6">
                <div className="w-20 h-20 gold-gradient rounded-3xl flex items-center justify-center text-black mb-6 shadow-xl shadow-[#E5D5B3]/20">
                    <Wallet size={32} />
                </div>
                <h1 className="text-2xl font-black mb-2 text-center">Payment Request</h1>
                <p className="text-zinc-400 text-center mb-8">
                    {stellarId && `Pay ${stellarId}`}
                    {amount && ` - ${amount} XLM`}
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="w-full max-w-xs py-4 gold-gradient text-black font-black rounded-2xl shadow-xl"
                >
                    Login to Pay
                </button>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex items-center justify-center">
                <Loader2 size={40} className="text-[#E5D5B3] animate-spin" />
            </div>
        );
    }

    // Error state
    if (error && !success) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col items-center justify-center px-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-red-400" />
                </div>
                <h1 className="text-xl font-black mb-2">{error}</h1>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-8 py-3 bg-white/10 rounded-2xl font-bold"
                >
                    Go Home
                </button>
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
                <p className="text-zinc-400 text-center mb-2">
                    {amount} XLM sent to {recipient?.displayName || stellarId}
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-8 px-8 py-4 gold-gradient text-black font-black rounded-2xl shadow-xl"
                >
                    Done
                </button>
            </div>
        );
    }

    // Main payment form
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white px-6 py-10">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles size={16} className="text-[#E5D5B3]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payment Link</span>
                </div>
                <h1 className="text-2xl font-black">Send Payment</h1>
            </div>

            {/* Recipient Card */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Paying To</p>
                <div className="flex items-center gap-4">
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-14 h-14 rounded-2xl bg-zinc-800"
                    />
                    <div>
                        <p className="font-black text-lg">{recipient?.displayName || stellarId?.split('@')[0]}</p>
                        <p className="text-zinc-500 text-sm">{stellarId}</p>
                    </div>
                </div>
            </div>

            {/* Amount Input */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 text-center">Amount</p>
                <div className="flex items-baseline justify-center gap-2">
                    <span className={`text-4xl font-black ${amount ? 'text-[#E5D5B3]' : 'text-zinc-700'}`}>₹</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="0"
                        className="bg-transparent text-5xl font-black text-center w-full max-w-[200px] outline-none placeholder-zinc-800"
                        autoFocus
                    />
                    <span className="text-zinc-500 font-bold">XLM</span>
                </div>
            </div>

            {/* Note */}
            {note && (
                <div className="bg-white/5 rounded-2xl p-4 mb-8 text-center">
                    <p className="text-zinc-400 text-sm">"{note}"</p>
                </div>
            )}

            {/* Pay Button */}
            <button
                onClick={handlePay}
                disabled={!amount || sending}
                className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${amount && !sending
                    ? 'gold-gradient text-black shadow-xl shadow-[#E5D5B3]/20 active:scale-[0.98]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
            >
                {sending ? (
                    <Loader2 size={22} className="animate-spin" />
                ) : (
                    <>
                        <ArrowRight size={22} />
                        Pay Now
                    </>
                )}
            </button>

            {/* Security note */}
            <p className="text-center text-zinc-600 text-xs mt-6">
                Secured by Stellar Blockchain
            </p>
        </div>
    );
};

export default PaymentLink;
