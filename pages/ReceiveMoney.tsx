
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Share2, QrCode } from 'lucide-react';

interface Props {
    profile: UserProfile | null;
}

const ReceiveMoney: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    if (!profile) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(profile.stellarId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=stellar:pay?to=${profile.stellarId}&color=1A1A1A&bgcolor=E5D5B3`;
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed || profile.stellarId}`;

    return (
        <div className="min-h-screen bg-[#1A1A1A] text-white relative overflow-hidden flex flex-col pb-32">
            {/* Background Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-[#E5D5B3]/5 rounded-full blur-[120px]"></div>

            {/* Header */}
            <div className="pt-5 px-3 flex items-center justify-between relative z-10 mb-8">
                <button
                    onClick={() => navigate(-1)}
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

                <p className="mt-12 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[200px] leading-loose">
                    Secure Instant Payment <br /> via Stellar Vault
                </p>
            </div>
        </div>
    );
};

export default ReceiveMoney;
