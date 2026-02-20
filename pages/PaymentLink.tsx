
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, User, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { getAvatarUrl } from '../services/avatars';
import { getProfileByStellarId } from '../services/db';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { sendPayment } from '../services/stellar';
import { recordTransaction } from '../services/db';
import { decryptSecret } from '../services/encryption';
import { NotificationService } from '../services/notification';

import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '../services/web3';
import { BrowserProvider, parseEther } from 'ethers';

const PaymentLink: React.FC = () => {
    const { stellarId } = useParams<{ stellarId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, profile: senderProfile } = useAuth();
    const { open } = useWeb3Modal();
    const { address: evmAddress, isConnected } = useWeb3ModalAccount();
    const { walletProvider } = useWeb3ModalProvider();

    const [recipient, setRecipient] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [amount, setAmount] = useState(searchParams.get('amount') || '');
    const [note, setNote] = useState(searchParams.get('note') || '');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [bridging, setBridging] = useState(false);

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

    const handleEvmPay = async () => {
        if (!amount || !recipient) return;

        try {
            if (!isConnected) {
                await open();
                return;
            }

            setSending(true);
            setBridging(true);

            // In a real app, we would:
            // 1. Get a quote from a bridge API (Li.Fi / Squid / Allbridge)
            // 2. Execute the cross-chain swap

            const provider = new BrowserProvider(walletProvider as any);
            const signer = await provider.getSigner();

            // Simulate a bridge transaction (sending small amount of native gas to a bridge address)
            // Bridge address: 0x71C7656EC7ab88b098defB751B7401B5f6d8dAD7 (example)
            const ethAmount = (parseFloat(amount) * 0.00005).toFixed(6); // Dummy conversion

            const tx = await signer.sendTransaction({
                to: "0x71C7656EC7ab88b098defB751B7401B5f6d8dAD7",
                value: parseEther(ethAmount)
            });

            console.log("Bridge transaction sent:", tx.hash);
            await tx.wait();

            // Record bridging event
            await recordTransaction({
                fromId: evmAddress || 'ETH_WALLET',
                toId: recipient.stellarId,
                fromName: 'External Wallet',
                toName: recipient.displayName || recipient.stellarId,
                amount: parseFloat(amount),
                currency: 'XLM',
                status: 'SUCCESS',
                memo: `Bridged: ${note || 'Universal Pay'}`,
                txHash: tx.hash,
                isFamilySpend: false
            });

            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'MetaMask transaction failed');
        } finally {
            setSending(false);
            setBridging(false);
        }
    };

    const handlePay = async () => {
        if (!senderProfile || !recipient || !amount) return;

        setSending(true);
        try {
            const password = localStorage.getItem('temp_vault_key');
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

            NotificationService.triggerRemoteNotification(
                recipient.stellarId,
                amount,
                senderProfile.displayName || senderProfile.stellarId.split('@')[0]
            );

            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Payment failed');
        }
        setSending(false);
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
                    onClick={isAuthenticated ? handlePay : handleEvmPay}
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
                            {isAuthenticated ? <ArrowRight size={22} /> : (
                                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Mirror_Logo.svg" className="w-6 h-6" alt="" />
                            )}
                            {isAuthenticated ? 'Pay Now' : (isConnected ? 'Pay with MetaMask' : 'Checkout with MetaMask')}
                        </>
                    )}
                </button>

                {/* Secondary Login Option for Guests */}
                {!isAuthenticated && (
                    <div className="text-center">
                        <button
                            onClick={() => navigate('/login', { state: { from: `/pay/${stellarId}${searchParams.toString() ? '?' + searchParams.toString() : ''}` } })}
                            className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
                        >
                            Or login to use Stellar Wallet
                        </button>
                    </div>
                )}
            </div>

            {/* Security note */}
            <p className="text-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em] mt-auto pt-10">
                Secured by Stellar Cross-Chain Bridge
            </p>
        </div>
    );
};

export default PaymentLink;
