import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Copy,
    Check,
    Share2,
    QrCode,
    Link2,
    X,
    Radio,
    Wallet,
    Loader2,
    CheckCircle2,
    Shield
} from 'lucide-react';
import { getAvatarUrl } from '../services/avatars';
import UniversalQR from '../components/UniversalQR';
import { WalletConnectService } from '../services/walletConnectService';
import { recordTransaction } from '../services/db';
import { NotificationService } from '../services/notification';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    profile: UserProfile | null;
}

const ReceiveMoney: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkAmount, setLinkAmount] = useState('');
    const [linkNote, setLinkNote] = useState('');

    // Freighter WalletConnect state
    const [wcUri, setWcUri] = useState<string | null>(null);
    const [wcStatus, setWcStatus] = useState<'idle' | 'pairing' | 'connected' | 'requesting' | 'done' | 'error'>('idle');
    const [wcSender, setWcSender] = useState('');
    const [wcAmount, setWcAmount] = useState('');
    const [wcError, setWcError] = useState('');
    const [showFreighterModal, setShowFreighterModal] = useState(false);

    if (!profile) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(profile.stellarId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getPaymentLink = () => {
        const base = `${window.location.origin}/pay`;
        let link = `${base}/${profile.stellarId}`;

        const params = new URLSearchParams();
        if (linkAmount) params.append('amt', linkAmount);
        if (linkNote) params.append('note', linkNote);

        const queryString = params.toString();
        if (queryString) {
            link += `?${queryString}`;
        }

        return link;
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(getPaymentLink());
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleShareLink = () => {
        const link = getPaymentLink();
        if (navigator.share) {
            navigator.share({
                title: 'Pay me on Ching Pay',
                text: `Pay ${profile.displayName || profile.stellarId}${linkAmount ? ` - ${linkAmount} XLM` : ''}`,
                url: link,
            });
        } else {
            handleCopyLink();
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Pay me on Ching Pay',
                text: `Send money to my Stellar UPI ID: ${profile.stellarId}`,
                url: window.location.href,
            });
        }
    };

    const handleStartFreighterFlow = async () => {
        setShowFreighterModal(true);
        setWcStatus('pairing');
        setWcError('');
        setWcAmount('');

        try {
            const { uri, approval } = await WalletConnectService.createPairing();
            setWcUri(uri);

            const senderAddress = await WalletConnectService.waitForSession(approval);
            setWcSender(senderAddress);
            setWcStatus('connected');
        } catch (e: any) {
            console.error('WC pairing error:', e);
            setWcError(e.message || 'Failed to connect');
            setWcStatus('error');
        }
    };

    const handleFreighterPay = async () => {
        if (!wcAmount || !profile) return;
        setWcStatus('requesting');
        setWcError('');

        try {
            const txHash = await WalletConnectService.requestPayment({
                recipientPublicKey: profile.publicKey,
                amount: wcAmount,
                memo: `Pay ${profile.displayName || profile.stellarId.split('@')[0]}`
            });

            await recordTransaction({
                fromId: wcSender.substring(0, 10) + '@stellar',
                toId: profile.stellarId,
                fromName: 'Freighter Wallet',
                toName: profile.displayName || profile.stellarId,
                amount: parseFloat(wcAmount),
                currency: 'XLM',
                status: 'SUCCESS',
                txHash,
                isFamilySpend: false
            });

            NotificationService.sendInAppNotification(
                profile.stellarId,
                'Freighter Payment Received',
                `Received ${wcAmount} XLM from Freighter wallet`,
                'payment'
            );

            setWcStatus('done');

            setTimeout(() => {
                WalletConnectService.disconnect();
            }, 3000);
        } catch (e: any) {
            console.error('WC payment error:', e);
            setWcError(e.message || 'Payment request failed');
            setWcStatus('error');
        }
    };

    const closeFreighterModal = () => {
        setShowFreighterModal(false);
        setWcUri(null);
        setWcStatus('idle');
        setWcSender('');
        setWcAmount('');
        setWcError('');
        WalletConnectService.disconnect();
    };

    const avatarUrl = getAvatarUrl(profile.avatarSeed || profile.stellarId);

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col pb-44">
            {/* Background Aesthetics */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

            {/* Header */}
            <div className="pt-6 px-6 flex items-center justify-between relative z-10 mb-2">
                <button
                    onClick={() => navigate("/")}
                    className="w-10 h-10 flex items-center justify-center bg-zinc-900/50 backdrop-blur-xl rounded-xl text-zinc-400 border border-white/5 active:scale-90"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-center">
                    <h2 className="text-base font-black tracking-tight text-white/90">Receive Money</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-0.5">Stellar UPI Network</p>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex flex-col items-center px-6 pt-4 relative z-10 overflow-y-auto no-scrollbar">


                {/* 2. CENTRAL QR with SCANNING FRAME */}
                <div className="relative group">
                    {/* Corner Markers */}
                    {/* <div className="absolute -top-4 -left-4 w-10 h-10 border-t-2 border-l-2 border-[#E5D5B3] rounded-tl-2xl opacity-40"></div>
                    <div className="absolute -top-4 -right-4 w-10 h-10 border-t-2 border-r-2 border-[#E5D5B3] rounded-tr-2xl opacity-40"></div>
                    <div className="absolute -bottom-4 -left-4 w-10 h-10 border-b-2 border-l-2 border-[#E5D5B3] rounded-bl-2xl opacity-40"></div>
                    <div className="absolute -bottom-4 -right-4 w-10 h-10 border-b-2 border-r-2 border-[#E5D5B3] rounded-br-2xl opacity-40"></div> */}

                    <div className="relative   shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">


                        <div className="relative bg-white/40 rounded-[2rem] p-">
                            <UniversalQR
                                stellarId={profile.stellarId}
                                publicKey={profile.publicKey}
                                avatarUrl={avatarUrl}
                                amount={linkAmount}
                                note={linkNote}
                                size={270}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. USER ID INFO */}
                <div className="mt-12 text-center">
                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-3">Stellar UPI ID</p>
                    <div className="flex items-center gap-3 justify-center">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                        <h3 className="text-2xl font-black text-white tracking-tighter">{profile.stellarId}</h3>
                    </div>
                </div>

                {/* 4. FLOATING ACTION BAR */}
                <div className="mt-14 w-full max-w-[280px] bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-2 flex items-center justify-between shadow-2xl">
                    <button
                        onClick={handleCopy}
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 text-zinc-400 hover:text-[#E5D5B3] hover:bg-white/10 transition-all active:scale-90"
                        title="Copy ID"
                    >
                        {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                    </button>
                    <button
                        onClick={() => setShowLinkModal(true)}
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 text-zinc-400 hover:text-[#E5D5B3] hover:bg-white/10 transition-all active:scale-90"
                        title="Payment Link"
                    >
                        <Link2 size={20} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 text-zinc-400 hover:text-[#E5D5B3] hover:bg-white/10 transition-all active:scale-90"
                        title="Share"
                    >
                        <Share2 size={20} />
                    </button>
                    <button
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 text-zinc-400 hover:text-[#E5D5B3] hover:bg-white/10 transition-all active:scale-90"
                        title="QR Settings"
                    >
                        <QrCode size={20} />
                    </button>
                </div>

                {/* Extra Features */}
                <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
                    <button
                        onClick={() => navigate("/sonic?mode=send")}
                        className="flex flex-col items-center justify-center gap-2 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl group active:scale-95 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="10" cy="6.75" r="4" fill="currentColor" /><ellipse cx="10" cy="17.75" fill="currentColor" opacity=".5" rx="7" ry="4" /><path fill="currentColor" fill-rule="evenodd" d="M18.357 2.364a.75.75 0 0 1 1.029-.257L19 2.75l.386-.643h.001l.002.002l.004.002l.01.006l.113.076c.07.049.166.12.277.212c.222.185.512.462.802.838c.582.758 1.155 1.914 1.155 3.507s-.573 2.75-1.155 3.507c-.29.376-.58.653-.802.838a4 4 0 0 1-.363.27l-.028.018l-.01.006l-.003.002l-.002.001s-.001.001-.387-.642l.386.643a.75.75 0 0 1-.776-1.283l.005-.004l.041-.027q.06-.042.177-.136c.152-.128.362-.326.573-.6c.417-.542.844-1.386.844-2.593s-.427-2.05-.844-2.593a3.8 3.8 0 0 0-.573-.6a3 3 0 0 0-.218-.163l-.005-.003a.75.75 0 0 1-.253-1.027" clip-rule="evenodd" /><path fill="currentColor" fill-rule="evenodd" d="M16.33 4.415a.75.75 0 0 1 1.006-.336L17 4.75l.336-.67h.001l.002.001l.004.002l.008.004l.022.012a2 2 0 0 1 .233.153c.136.102.31.254.48.467c.349.436.664 1.099.664 2.031s-.316 1.595-.664 2.031a2.7 2.7 0 0 1-.654.586l-.06.034l-.02.012l-.01.004l-.003.002l-.002.001l-.33-.657l.329.658a.75.75 0 0 1-.685-1.335l.003-.001l.052-.036c.052-.04.13-.106.209-.205c.15-.189.335-.526.335-1.094s-.184-.905-.335-1.094a1.2 1.2 0 0 0-.261-.24l-.003-.002a.75.75 0 0 1-.322-1" clip-rule="evenodd" /></svg>
                        <span className="text-[9px] text-white/80 font-black uppercase tracking-[0.1em]">Pulse Send</span>
                    </button>
                    <button
                        onClick={handleStartFreighterFlow}
                        className="flex flex-col items-center justify-center gap-2 p-5 bg-purple-500/5 border border-purple-500/10 rounded-3xl group active:scale-95 transition-all"
                    >
                        <img className='h-6 rounded-sm' src="https://imgs.search.brave.com/rpIBLNJse6zTyYvYEzAeoC_hZ8f9Guz5jNU8dq2SU8I/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGF5/LWxoLmdvb2dsZXVz/ZXJjb250ZW50LmNv/bS95ZFBvYzJwQTVo/bUNQb2tIdml6TW4w/RS1xdzNTdkxOdExS/M0haSW5Fb1YzUDJY/VDVNRnFwWG5nODQz/REhJQWdFUEE9dzI0/MC1oNDgwLXJ3" alt="" />
                        <span className="text-[9px] text-white/80 font-black uppercase tracking-[0.1em]">Freighter</span>
                    </button>
                </div>


            </div>

            {/* Payment Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLinkModal(false)}></div>
                    <div className="relative w-full max-w-md bg-zinc-900 rounded-t-[3rem] p-8 border-t border-white/10 animate-in slide-in-from-bottom duration-300">
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full" />

                        <button
                            onClick={() => setShowLinkModal(false)}
                            className="absolute top-6 right-6 p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-xl font-black mb-2 mt-4">Payment Link</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">Generate a shareable payment link</p>

                        <div className="mb-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Amount (Optional)</label>
                            <div className="relative mb-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={linkAmount}
                                    onChange={(e) => setLinkAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                    className="w-full px-4 py-4 bg-black/40 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-[#E5D5B3]/20"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">XLM</span>
                            </div>
                            {linkAmount && (
                                <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest ml-1">
                                    ≈ ₹{(parseFloat(linkAmount) * 8.42).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Note (Optional)</label>
                            <input
                                type="text"
                                placeholder="What's this for?"
                                value={linkNote}
                                onChange={(e) => setLinkNote(e.target.value)}
                                className="w-full px-4 py-4 bg-black/40 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-[#E5D5B3]/20"
                            />
                        </div>

                        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 mb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Your Payment Link</p>
                            <p className="text-[#E5D5B3] text-sm font-mono break-all">
                                {getPaymentLink()}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCopyLink}
                                className="flex-1 py-4 bg-white/10 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                                {linkCopied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                                onClick={handleShareLink}
                                className="flex-1 py-4 bg-[#E5D5B3] text-black rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <Share2 size={16} />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Freighter WalletConnect Modal */}
            {showFreighterModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeFreighterModal}></div>
                    <div className="relative w-full max-w-md bg-zinc-900 rounded-t-[3rem] p-8 border-t border-purple-500/20 animate-in slide-in-from-bottom duration-300">
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full" />

                        <button
                            onClick={closeFreighterModal}
                            className="absolute top-6 right-6 p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-6 mt-4">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                <Wallet size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black">Freighter Pay</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">WalletConnect · Stellar</p>
                            </div>
                        </div>

                        {wcStatus === 'pairing' && wcUri && (
                            <div className="flex flex-col items-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Scan with Freighter App</p>
                                <div className="bg-white p-4 rounded-2xl mb-4">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(wcUri)}&color=1A1A1A&bgcolor=FFFFFF`}
                                        alt="WalletConnect QR"
                                        className="w-56 h-56"
                                    />
                                </div>
                                <p className="text-zinc-500 text-xs text-center">Open Freighter → Scan QR → Approve connection</p>
                                <div className="mt-4 flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin text-purple-400" />
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Waiting for Freighter...</span>
                                </div>
                            </div>
                        )}

                        {wcStatus === 'pairing' && !wcUri && (
                            <div className="flex flex-col items-center py-8">
                                <Loader2 size={32} className="animate-spin text-purple-400 mb-4" />
                                <p className="text-zinc-500 text-sm">Initializing WalletConnect...</p>
                            </div>
                        )}

                        {wcStatus === 'connected' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                                    <CheckCircle2 size={20} className="text-emerald-400" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-400">Freighter Connected</p>
                                        <p className="text-[9px] font-mono text-zinc-500">{wcSender.substring(0, 8)}...{wcSender.slice(-4)}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Amount (XLM)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={wcAmount}
                                        onChange={(e) => setWcAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                        className="w-full px-4 py-4 bg-black/40 border border-white/5 rounded-2xl font-black text-2xl text-center outline-none focus:border-purple-500/30 text-white"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={handleFreighterPay}
                                    disabled={!wcAmount || parseFloat(wcAmount) <= 0}
                                    className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-30"
                                >
                                    Request {wcAmount || '0'} XLM from Freighter
                                </button>
                            </div>
                        )}

                        {wcStatus === 'requesting' && (
                            <div className="flex flex-col items-center py-8">
                                <Loader2 size={32} className="animate-spin text-purple-400 mb-4" />
                                <p className="text-sm font-bold text-white mb-1">Approve in Freighter</p>
                                <p className="text-zinc-500 text-xs">Check the Freighter app for the transaction approval</p>
                            </div>
                        )}

                        {wcStatus === 'done' && (
                            <div className="flex flex-col items-center py-8">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={32} className="text-emerald-400" />
                                </div>
                                <h4 className="text-xl font-black text-white mb-2">Payment Received!</h4>
                                <p className="text-zinc-400 text-sm">{wcAmount} XLM from Freighter</p>
                                <button
                                    onClick={closeFreighterModal}
                                    className="mt-6 px-8 py-3 bg-white/10 rounded-xl font-bold text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        )}

                        {wcStatus === 'error' && (
                            <div className="flex flex-col items-center py-8">
                                <p className="text-rose-400 font-bold text-sm mb-4">{wcError}</p>
                                <button
                                    onClick={handleStartFreighterFlow}
                                    className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl font-bold text-sm"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiveMoney;
