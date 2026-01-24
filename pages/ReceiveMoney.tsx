
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import {
    ArrowLeft,
    Copy,
    Check,
    Share2,
    QrCode,
    Link2,
    IndianRupee,
    X,
    Radio,
    Sparkles,
    Shield,
    Zap,
    Navigation2,
    Info
} from 'lucide-react';
=======
import { ArrowLeft, Copy, Check, Share2, QrCode, Link2, IndianRupee, X, Radio } from 'lucide-react';
>>>>>>> Stashed changes
import { getAvatarUrl } from '../services/avatars';
import { NFCService } from '../services/nfc';
import { updateAuraPresence } from '../services/db';

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
    const [nfcStatus, setNfcStatus] = useState<'idle' | 'beaming' | 'success' | 'error'>('idle');

    React.useEffect(() => {
        return () => {
            if (profile) updateAuraPresence(profile.stellarId, profile, { lat: 0, lng: 0 }, false);
        };
    }, [profile]);

    if (!profile) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(profile.stellarId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getPaymentLink = () => {
        const baseUrl = window.location.origin;
        let link = `${baseUrl}/pay/${profile.stellarId}`;
        const params = new URLSearchParams();
        if (linkAmount) params.append('amount', linkAmount);
        if (linkNote) params.append('note', linkNote);
        if (params.toString()) link += `?${params.toString()}`;
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
                title: 'Pay me on StellarPay',
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
                title: 'Pay me on StellarPay',
                text: `Send money to my Stellar UPI ID: ${profile.stellarId}`,
                url: window.location.href,
            });
        }
    };

    const handleActivateAura = async () => {
        try {
            setNfcStatus('beaming');

            // Start Aura Discovery Broadcast (GPS Matching)
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    await updateAuraPresence(profile.stellarId, profile, {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    }, true);
                    setNfcStatus('success');

                    // Keep active for 30s then auto-cleanup
                    setTimeout(async () => {
                        setNfcStatus('idle');
                        await updateAuraPresence(profile.stellarId, profile, { lat: 0, lng: 0 }, false);
                    }, 30000);
                }, (err) => {
                    console.error("Location error", err);
                    setNfcStatus('error');
                    setTimeout(() => setNfcStatus('idle'), 3000);
                }, { enableHighAccuracy: true });
            } else {
                alert("Location services required for Stellar Aura.");
                setNfcStatus('idle');
            }
        } catch (err) {
            console.error(err);
            setNfcStatus('error');
            setTimeout(() => setNfcStatus('idle'), 3000);
        }
    };

    const handleWriteToTag = async () => {
        if (!NFCService.isSupported()) {
            alert("NFC is not supported on this device/browser.");
            return;
        }
        try {
            alert("Ready! Hold your phone against a physical NFC tag/sticker to write your ID.");
            await NFCService.writeText(profile.stellarId);
            alert("Success! Your ID has been written to the tag.");
        } catch (err) {
            console.error("NFC Write failed", err);
        }
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=stellar:pay?to=${profile.stellarId}&color=1A1A1A&bgcolor=E5D5B3`;
    const avatarUrl = getAvatarUrl(profile.avatarSeed || profile.stellarId);

    return (
        <div className="min-h-screen bg-[#080808] text-white relative flex flex-col pb-32 overflow-x-hidden">
            {/* Immersive Background Layers */}
            <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-[#E5D5B3]/5 to-transparent pointer-events-none" />
            <div className="absolute top-20 right-[-10%] w-[80%] h-[40%] bg-[#E5D5B3]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute top-40 left-[-10%] w-[60%] h-[30%] bg-[#E5D5B3]/3 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-50 px-6 pt-8 pb-4 bg-[#080808]/80 backdrop-blur-2xl flex items-center justify-between">
                <button
                    onClick={() => navigate("/")}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all active:scale-90"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-0.5">Deposit</span>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Receive Money</h2>
                </div>
                <button
                    onClick={handleShare}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-[#E5D5B3] transition-all active:scale-90"
                >
                    <Share2 size={20} />
                </button>
            </header>

            <main className="flex-1 px-6 pt-6 flex flex-col items-center relative z-10">
                {/* Main QR Card - Ultra Premium */}
                <div className="w-full max-w-sm relative group">
                    {/* Shadow/Glow Background */}
                    <div className="absolute inset-0 bg-black rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]" />

                    {/* Subtle outer ring */}
                    <div className="absolute -inset-[1px] bg-gradient-to-tr from-[#E5D5B3]/20 via-white/5 to-[#E5D5B3]/30 rounded-[3.5rem] opacity-50" />

                    <div className="relative bg-[#E5D5B3] rounded-[3.5rem] p-4 flex flex-col items-center">
                        {/* Status Bar */}
                        <div className="w-full flex items-center justify-between px-6 py-4 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-black/5 p-0.5 border border-black/10 overflow-hidden shadow-sm">
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-black font-black text-[13px] leading-tight truncate max-w-[120px]">
                                        {profile.displayName || profile.stellarId.split('@')[0]}
                                    </span>
                                    <span className="text-black/40 text-[9px] font-black uppercase tracking-widest">Verified Merchant</span>
                                </div>
                            </div>
                            <div className="w-9 h-9 bg-black/5 rounded-xl flex items-center justify-center text-black/40">
                                <QrCode size={18} />
                            </div>
                        </div>

                        {/* QR Code Window */}
                        <div className="bg-white p-7 rounded-[3rem] shadow-[inset_0_2px_15px_rgba(0,0,0,0.05)] mb-6 relative">
                            <img src={qrUrl} alt="QR Code" className="w-64 h-64 mix-blend-multiply" />
                            {/* Decorative Corners */}
                            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-black opacity-5 rounded-tl-xl" />
                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-black opacity-5 rounded-tr-xl" />
                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-black opacity-5 rounded-bl-xl" />
                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-black opacity-5 rounded-br-xl" />
                        </div>

                        {/* ID Badge */}
                        <button
                            onClick={handleCopy}
                            className="w-full bg-black/5 rounded-[2.5rem] p-5 mb-4 flex items-center justify-between group/id active:scale-[0.98] transition-all"
                        >
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em] mb-0.5 ml-1">Stellar UPI ID</span>
                                <span className="text-black font-black text-lg tracking-tight ml-1">{profile.stellarId}</span>
                            </div>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-black text-[#E5D5B3] group-hover/id:scale-110'}`}>
                                {copied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} />}
                            </div>
                        </button>

                        <p className="text-black/40 font-black text-[9px] uppercase tracking-[0.2em] mb-4">
                            Secured by Stellar Blockchain
                        </p>
                    </div>
                </div>

<<<<<<< Updated upstream
                {/* Discovery & Aura Section */}
                <div className="w-full max-w-sm mt-12 space-y-4">
                    <div className="flex items-center gap-3 px-1 mb-2">
                        <Zap size={14} className="text-[#E5D5B3]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Proximity Features</span>
                    </div>

                    <button
                        onClick={handleActivateAura}
                        disabled={nfcStatus === 'beaming' || nfcStatus === 'success'}
                        className={`w-full group relative overflow-hidden flex items-center gap-5 p-6 rounded-[2.5rem] border transition-all duration-500 ${nfcStatus === 'beaming'
                            ? 'bg-zinc-800 border-white/10 scale-[1.02]'
                            : nfcStatus === 'success'
                                ? 'bg-emerald-500 border-emerald-500 shadow-[0_20px_40px_-5px_rgba(16,185,129,0.3)]'
                                : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-900/80 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]'
                            }`}
                    >
                        {/* Aura Pulse Effect */}
                        {nfcStatus === 'success' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-full h-full bg-black/10 rounded-full animate-ping" />
                            </div>
                        )}

                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${nfcStatus === 'success' ? 'bg-black text-[#E5D5B3]' : 'bg-[#E5D5B3]/10 text-[#E5D5B3]'
                            }`}>
                            {nfcStatus === 'success' ? <Check size={26} strokeWidth={3} /> : <Sparkles size={26} className={nfcStatus === 'beaming' ? 'animate-pulse' : ''} />}
                        </div>

                        <div className="text-left relative z-10 flex-1">
                            <h3 className={`text-[13px] font-black uppercase tracking-[0.1em] mb-0.5 ${nfcStatus === 'success' ? 'text-black' : 'text-white'
                                }`}>
                                {nfcStatus === 'beaming' ? 'Pinpointing...' : nfcStatus === 'success' ? 'Aura Broadcasting' : 'Stellar Aura (Touchless)'}
                            </h3>
                            <p className={`text-[10px] font-bold tracking-tight ${nfcStatus === 'success' ? 'text-black/60' : 'text-zinc-500'
                                }`}>
                                {nfcStatus === 'beaming' ? 'Securing location' : nfcStatus === 'success' ? 'Nearby phones can find you' : 'Best for phone-to-phone Pay'}
                            </p>
                        </div>
                    </button>

                    {/* Secondary NFC Option for physical tags */}
                    <div className="mt-6 p-4 rounded-3xl bg-zinc-900/40 border border-white/5">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 flex-shrink-0 mt-1">
                                <Info size={16} />
                            </div>
                            <p className="text-[10px] font-medium text-zinc-500 leading-relaxed uppercase tracking-widest">
                                Pro Tip: Aura uses GPS proximity to avoid Alipay/WeChat interference on some phones.
                            </p>
                        </div>
                        <button
                            onClick={handleWriteToTag}
                            className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <Radio size={14} /> Sync to physical NFC Tag
                        </button>
                    </div>

                    <button
                        onClick={() => setShowLinkModal(true)}
                        className="w-full flex items-center gap-5 p-6 rounded-[2.5rem] bg-zinc-900/60 border border-white/5 hover:bg-zinc-900/80 transition-all group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#E5D5B3] transition-colors">
                            <Link2 size={24} />
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="text-[13px] font-black uppercase tracking-[0.1em] text-white mb-0.5">Payment Link</h3>
                            <p className="text-[10px] font-bold text-zinc-500 tracking-tight">Generate custom billing URL</p>
                        </div>
                        <div className="mr-4">
                            <div className="w-2 h-2 rounded-full bg-zinc-800" />
                        </div>
                    </button>
                </div>

                {/* Footer Info */}
                <div className="mt-16 flex flex-col items-center gap-4 py-8 border-t border-white/5 w-full">
                    <Shield size={24} className="text-zinc-800" />
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] text-center max-w-[240px] leading-loose">
                        End-to-End Encrypted <br /> Bank-Grade Security
                    </p>
                </div>
            </main>
=======
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
                    Sonic Broadcast (Offline)
                </button>

                <p className="mt-12 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[200px] leading-loose">
                    Secure Instant Payment <br /> via Stellar Vault
                </p>
            </div>
>>>>>>> Stashed changes

            {/* Payment Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowLinkModal(false)} />
                    <div className="relative w-full max-w-md bg-[#0d1210] rounded-t-[3.5rem] p-8 border-t border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500">
                        {/* Drag Handle */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

                        <div className="flex items-center justify-between mb-8 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E5D5B3]/60 mb-1">Generate</span>
                                <h3 className="text-2xl font-black text-white tracking-tight">Vault Link</h3>
                            </div>
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400 active:scale-90 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Amount Input */}
                            <div className="relative group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2.5 block ml-1">Expected Amount (Optional)</label>
                                <div className="relative flex items-center bg-black/40 border border-white/5 rounded-3xl p-5 focus-within:border-[#E5D5B3]/30 transition-all">
                                    <div className="w-10 h-10 bg-[#E5D5B3]/10 rounded-xl flex items-center justify-center text-[#E5D5B3] mr-4">
                                        <IndianRupee size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0.00"
                                        value={linkAmount}
                                        onChange={(e) => setLinkAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                        className="bg-transparent text-xl font-black text-white w-full outline-none placeholder-zinc-800"
                                    />
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2">INR</span>
                                </div>
                            </div>

                            {/* Note Input */}
                            <div className="relative group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2.5 block ml-1">Payment Note</label>
                                <div className="relative flex items-center bg-black/40 border border-white/5 rounded-3xl p-5 focus-within:border-[#E5D5B3]/30 transition-all">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-600 mr-4">
                                        <Copy size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add a reason for payment"
                                        value={linkNote}
                                        onChange={(e) => setLinkNote(e.target.value)}
                                        className="bg-transparent text-sm font-bold text-white w-full outline-none placeholder-zinc-800"
                                    />
                                </div>
                            </div>

                            {/* Preview Tile */}
                            <div className="bg-[#E5D5B3]/5 border border-[#E5D5B3]/10 rounded-[2.5rem] p-6 mb-8 mt-2">
                                <div className="flex items-center gap-3 mb-3">
                                    <Link2 size={14} className="text-[#E5D5B3]" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#E5D5B3]">Sharable URL Preview</span>
                                </div>
                                <p className="text-[#E5D5B3] text-[11px] font-black font-mono break-all opacity-80 leading-relaxed">
                                    {getPaymentLink()}
                                </p>
                            </div>

                            {/* Action Row */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleCopyLink}
                                    className="flex-1 py-5 bg-white/5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-white/5"
                                >
                                    {linkCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                    {linkCopied ? 'Link Copied' : 'Copy Link'}
                                </button>
                                <button
                                    onClick={handleShareLink}
                                    className="flex-[1.2] py-5 gold-gradient text-black rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_15px_30px_-10px_rgba(229,213,179,0.4)]"
                                >
                                    <Share2 size={18} />
                                    Share Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiveMoney;
