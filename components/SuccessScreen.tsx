import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, ShieldCheck, ArrowRight, Share2, Download, Shield, Sparkles, Gift } from 'lucide-react';
import { PaymentProof } from '../services/zkProofService';

interface SuccessScreenProps {
    recipientName: string;
    amount: string;
    zkProof?: PaymentProof | null;
    claimLink?: string | null;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ recipientName, amount, zkProof, claimLink }) => {
    const navigate = useNavigate();
    const successSoundRef = useRef<HTMLAudioElement | null>(null);

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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0f0a] text-white text-center relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E5D5B3]/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E5D5B3]/5 rounded-full blur-[100px]"></div>
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-[#E5D5B3]/5 rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10 flex flex-col -mt-10 items-center max-w-sm w-full animate-in fade-in zoom-in duration-700">
                {/* Lottie Success Animation Container */}
                <div className="relative w-72 h-72 mb-2 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#E5D5B3]/10 rounded-full blur-3xl scale-75"></div>
                    <iframe
                        src="https://lottie.host/embed/11cf97ea-4079-46f7-b3af-5d2639247cbc/zHtee9lJgW.lottie"
                        className="w-full h-full border-0 relative z-10 pointer-events-none"
                        title="Success Animation"
                    />
                </div>

                <div className="mb-8">

                    <h2 className="text-4xl font-black tracking-tight -mt-8 mb-8">Transaction Success</h2>
                    <p className="text-zinc-500 font-medium">
                        Sent securely to <span className="text-white font-bold">{recipientName}</span>
                    </p>
                </div>

                {/* Glassmorphic Amount Card */}
                <div className="relative w-full mb-8 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E5D5B3]/20 via-transparent to-[#E5D5B3]/20 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-zinc-900/40 backdrop-blur-2xl border border-white/10 w-full rounded-2xl p-8 overflow-hidden">


                        <div className="relative z-10">
                            <span className="text-zinc-500 text-[10px] font-black uppercase  block mb-3">Amount Paid</span>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-[#E5D5B3] text-3xl font-black opacity-40 italic">₹</span>
                                <h3 className="text-6xl font-black  tracking-tighter">
                                    {parseInt(amount).toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                            <div className="flex items-center justify-between text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-xl">
                                        <Calendar size={14} className="text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Date & Time</p>
                                        <p className="text-xs font-bold text-zinc-300">{today}</p>
                                    </div>
                                </div>
                                {/*  */}
                            </div>
                        </div>
                    </div>
                </div>



                {/* zk-SNARK Verification Card */}
                {zkProof && (
                    <div className="w-full max-w-[320px] mb-8 bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden group text-left">
                        <div className="absolute top-0 right-0 p-3">
                            <Sparkles size={14} className="text-[#E5D5B3] opacity-50" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#E5D5B3] mb-3 flex items-center gap-2">
                            <Shield size={12} />
                            zk-SNARK Verification
                        </p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500 font-bold uppercase tracking-tighter">Status</span>
                                <span className="text-emerald-400 font-black tracking-widest">VERIFIED</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-tighter">Small Cryptographic String</span>
                                <code className="text-[9px] text-zinc-300 bg-black/40 p-2 rounded-lg break-all font-mono leading-tight">
                                    {zkProof.proof}
                                </code>
                            </div>
                            <div className="flex justify-between items-center text-[9px]">
                                <span className="text-zinc-500 font-bold uppercase tracking-tighter">Public Signals</span>
                                <span className="text-zinc-400 font-mono">[{zkProof.publicSignals.join(', ')}]</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Payout Authorized via ZK-SDK</p>
                        </div>
                    </div>
                )}

                {claimLink && (
                    <div className="w-full max-w-[320px] mb-8 bg-[#E5D5B3]/5 border border-[#E5D5B3]/20 rounded-3xl p-6 relative overflow-hidden group text-left">
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <Gift size={20} className="text-[#E5D5B3]" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3] mb-4">Viral Claim Link Created</p>
                        <p className="text-xs text-zinc-400 font-medium mb-6 leading-relaxed">
                            Share this link with <span className="text-white font-bold">{recipientName}</span> to let them claim the funds into their wallet.
                        </p>
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Claim your funds on Ching Pay',
                                        text: `Hi ${recipientName}, I've sent you ₹${amount}! Claim it here:`,
                                        url: claimLink
                                    });
                                } else {
                                    navigator.clipboard.writeText(claimLink);
                                    alert("Link copied to clipboard!");
                                }
                            }}
                            className="w-full py-4 bg-[#E5D5B3] text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Share2 size={16} />
                            Share Claim Link
                        </button>
                    </div>
                )}

                <button
                    onClick={() => navigate('/')}
                    className="w-full gold-gradient text-black py-4 rounded-[1rem] font-black text-lg shadow-[0_20px_40px_rgba(229,213,179,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                    Return to Dashboard
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default SuccessScreen;
