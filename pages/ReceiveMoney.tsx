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
    IndianRupee,
    X,
    Radio
} from 'lucide-react';
import { getAvatarUrl } from '../services/avatars';

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

    if (!profile) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(profile.stellarId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getPaymentLink = () => {
        // Get absolute base URL (e.g., https://site.com/ or https://site.com/app/)
        const currentUrl = window.location.href;
        const base = currentUrl.split('#')[0].split('?')[0];
        const normalizedBase = base.endsWith('/') ? base : base + '/';

        // Construct the hash route
        let link = `${normalizedBase}#/pay/${profile.stellarId}`;

        // Add query parameters after the hash route
        const params = new URLSearchParams();
        if (linkAmount) params.append('amount', linkAmount);
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

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=stellar:pay?to=${profile.stellarId}&color=1A1A1A&bgcolor=E5D5B3`;
    const avatarUrl = getAvatarUrl(profile.avatarSeed || profile.stellarId);

    return (
        <div className="min-h-screen bg-[#1A1A1A] text-white relative overflow-hidden flex flex-col pb-32">
            {/* Background Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-[#E5D5B3]/5 rounded-full blur-[120px]"></div>

            {/* Header */}
            <div className="pt-5 px-3 flex items-center justify-between relative z-10 mb-8">
                <button
                    onClick={() => navigate("/")}
                    className="p-3 bg-zinc-900/80 backdrop-blur-md rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-black tracking-tight">Receive Money</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 px-2 flex flex-col items-center justify-center relative z-10 pb-20">
                {/* Main QR Card */}
                <div className="w-full max-w-sm bg-[#E5D5B3] rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
                    <div className="w-full flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-black/5 p-1 border border-black/10 overflow-hidden">
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-black font-black text-sm truncate uppercase tracking-tight">
                                {profile.displayName || profile.stellarId.split('@')[0]}
                            </p>
                            <p className="text-black/40 text-[10px] font-black uppercase tracking-widest truncate">
                                {profile.stellarId}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center text-black/60">
                            <QrCode size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-inner mb-8 border-4 border-black/5">
                        <img src={qrUrl} alt="QR Code" className="w-60 h-60 grayscale" />
                    </div>

                    <p className="text-center font-bold text-black/60 text-[11px] px-4 leading-relaxed uppercase tracking-widest mb-2">
                        Scan this QR code to pay
                    </p>
                    <p className="text-center font-black text-black text-lg mb-8 tracking-tighter">
                        {profile.stellarId}
                    </p>

                    <div className="w-full flex gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex-1 py-4 bg-black text-[#E5D5B3] rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy ID'}
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-4 bg-white/20 text-black rounded-2xl font-black active:scale-95 transition-all shadow-xl backdrop-blur-sm"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Payment Link Button */}
                <button
                    onClick={() => setShowLinkModal(true)}
                    className="mt-8 flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all w-full max-w-sm justify-center"
                >
                    <Link2 size={18} className="text-[#E5D5B3]" />
                    Create Payment Link
                </button>

                <button
                    onClick={() => navigate("/sonic?mode=send")}
                    className="mt-4 flex items-center gap-3 px-6 py-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 font-bold hover:bg-green-500/20 transition-all w-full max-w-sm justify-center"
                >
                    <Radio size={18} className="animate-pulse" />
                    Sonic Pulse (Offline)
                </button>

                <p className="mt-12 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[200px] leading-loose">
                    Secure Instant Payment <br /> via Stellar Vault
                </p>
            </div>

            {/* Payment Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLinkModal(false)}></div>
                    <div className="relative w-full max-w-md bg-zinc-900 rounded-t-[3rem] p-8 border-t border-white/10 animate-in slide-in-from-bottom duration-300">
                        {/* Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full" />

                        {/* Close Button */}
                        <button
                            onClick={() => setShowLinkModal(false)}
                            className="absolute top-6 right-6 p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-xl font-black mb-2 mt-4">Payment Link</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">Generate a shareable payment link</p>

                        {/* Amount Input */}
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

                        {/* Note Input */}
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

                        {/* Preview Link */}
                        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 mb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Your Payment Link</p>
                            <p className="text-[#E5D5B3] text-sm font-mono break-all">
                                {getPaymentLink()}
                            </p>
                        </div>

                        {/* Action Buttons */}
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
                                className="flex-1 py-4 gold-gradient text-black rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <Share2 size={16} />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiveMoney;
