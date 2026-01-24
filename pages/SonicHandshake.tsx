import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Mic, Info } from 'lucide-react';
import SonicTransfer from '../components/SonicTransfer';
import { UserProfile } from '../types';

interface Props {
    profile: UserProfile | null;
}

const SonicHandshake: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') || 'send';

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col relative overflow-hidden font-sans">
            {/* Background Glow */}
            <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[50%] bg-green-500/5 rounded-full blur-[120px]"></div>

            {/* Header */}
            <div className="pt-14 px-6 flex items-center justify-between relative z-20 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 active:scale-95 transition-all text-zinc-400 hover:text-white"
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">Stellar NFC</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Wireless Link</span>
                    </div>
                </div>
                <button
                    onClick={() => alert("Stellar NFC uses ultra-high frequency wireless syncing to transfer your UPI ID to nearby devices instantly.")}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 active:scale-95 transition-all text-zinc-400 hover:text-white"
                >
                    <Info size={22} />
                </button>
            </div>

            <div className="flex-1 px-6 flex flex-col items-center justify-center relative z-10 pb-20">
                <div className="w-full max-w-sm mb-12">
                    <h2 className="text-3xl font-black text-center mb-4 tracking-tighter">NFC Sync</h2>
                    <p className="text-zinc-500 text-center text-sm font-medium leading-relaxed px-4">
                        Transfer your identity through the air via secure NFC syncing. Contactless and futuristic.
                    </p>
                </div>

                {/* The Core Logic Component */}
                <SonicTransfer payload={profile.stellarId} initialMode={initialMode} />

                <div className="mt-12 flex flex-col items-center">
                    <div className="flex items-center gap-8 mb-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 font-bold text-[10px]">
                                SEND
                            </div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Wireless</span>
                        </div>
                        <div className="w-12 h-[1px] bg-zinc-800"></div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 font-bold text-[10px]">
                                SCAN
                            </div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Encrypted</span>
                        </div>
                    </div>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Stellar Near-Field Protocol</p>
                </div>
            </div>
        </div>
    );
};

export default SonicHandshake;
