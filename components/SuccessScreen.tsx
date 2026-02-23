import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, ShieldCheck, ArrowRight, Share2, Download, Shield, Sparkles, Gift, Check, Zap } from 'lucide-react';
import { getAvatarUrl } from '../services/avatars';
import { PaymentProof } from '../services/zkProofService';

interface SuccessScreenProps {
    recipientName: string;
    recipientAvatar?: string;
    amount: string;
    txHash?: string;
    zkProof?: PaymentProof | null;
    claimLink?: string | null;
    chillarAmount?: number;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ recipientName, recipientAvatar, amount, txHash, zkProof, claimLink, chillarAmount }) => {
    const navigate = useNavigate();
    const successSoundRef = useRef<HTMLAudioElement | null>(null);
    const [showZkDetails, setShowZkDetails] = React.useState(false);

    useEffect(() => {
        if (!successSoundRef.current) {
            successSoundRef.current = new Audio('/ching.mp3');
            successSoundRef.current.volume = 0.5;
            successSoundRef.current.play().catch(() => { });
        }
    }, []);

    const today = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="h-screen w-full flex flex-col items-center justify-between bg-[#00915E] text-white relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-[5%] right-[10%] w-[150px] h-[150px] bg-white rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[200px] h-[200px] bg-emerald-400 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/10 to-transparent" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p- w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
                {/* Header: Logo with Checkmark Overlay */}
                <div className="relative mb-">
                    <iframe
                        src="https://lottie.host/embed/11cf97ea-4079-46f7-b3af-5d2639247cbc/zHtee9lJgW.lottie"
                        className="w-56 h-56 border-0 relative z-10 pointer-events-none"
                        title="Success Animation"
                    />
                </div>

                <div className="text-center mb-8 -mt-5">


                    <div className="flex items-center justify-center gap-1 mb-8">
                        <span className="text-3xl font-black mt-1 opacity-80">₹</span>
                        <h3 className="text-6xl font-black tracking-tighter">
                            {parseInt(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </h3>
                    </div>

                    <div className="space-y-1 opacity-70">
                        <p className="text-[11px] font-black uppercase tracking-widest">{today}</p>
                        <p className="text-[11px] font-black uppercase tracking-widest">Txn ID: {txHash?.slice(0, 16) || '330292308501002'}</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowZkDetails(!showZkDetails)}
                    className="text-[11px] font-black uppercase tracking-widest underline underline-offset-4 decoration-2 opacity-60 hover:opacity-100 transition-opacity mb-8"
                >
                    view details
                </button>
            </div>

            {/* Bottom Section: Transaction Details & Actions */}
            <div className="relative z-20 w-full bg-black rounded-t-[40px] p-8 pt-10 flex flex-col items-center">
                {/* Recipient Profile Card */}
                <div className="w-full flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 p-0.5 border border-white/10 shadow-2xl overflow-hidden">
                            <img
                                src={getAvatarUrl(recipientAvatar || recipientName)}
                                alt={recipientName}
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                        <div className="absolute -right-1 bottom-0 w-8 h-8 bg-emerald-500 rounded-full border-[3px] border-black flex items-center justify-center shadow-lg">
                            <Check size={14} className="text-white" strokeWidth={4} />
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Paid in</span>
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/5 rounded-full">
                                <Zap size={10} className="fill-yellow-400 text-yellow-400" />
                                <span className="text-[10px] font-black tracking-tight text-white">1.17 Secs</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">to</span>
                        </div>

                        <h2 className="text-2xl font-black tracking-tight mb-1 text-white">
                            {recipientName}
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Verified Stellar Recipient</p>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full h-16 bg-[#E5D5B3] text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-black/60 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        Return to Dashboard
                        <ArrowRight size={20} className="stroke-[3]" />
                    </button>

                    {claimLink && (
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Claim your funds on Ching Pay',
                                        text: `Hi ${recipientName}, I've sent you ₹${amount}! Claim it here:`,
                                        url: claimLink
                                    });
                                }
                            }}
                            className="w-full py-2 text-zinc-500 font-bold text-[10px] uppercase tracking-widest text-center"
                        >
                            Share Receipt
                        </button>
                    )}
                </div>
            </div>

            {/* ZK Detail Modal Fallback */}
            {showZkDetails && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl p-8 flex flex-col justify-center items-center">
                    <div className="w-full max-w-sm">
                        <h4 className="text-emerald-500 font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <ShieldCheck size={20} /> ZK-Identity Proof
                        </h4>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Protocol 25 Hash</p>
                                <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl font-mono text-[10px] break-all leading-relaxed text-zinc-400">
                                    {zkProof?.proof || 'Pending confirmation on Stellar Protocol 25...'}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowZkDetails(false)}
                                className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuccessScreen;
