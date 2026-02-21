import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, ShieldCheck, ArrowRight, Share2, Download, Shield, Sparkles, Gift } from 'lucide-react';
import { PaymentProof } from '../services/zkProofService';

interface SuccessScreenProps {
    recipientName: string;
    amount: string;
    zkProof?: PaymentProof | null;
    claimLink?: string | null;
    chillarAmount?: number;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ recipientName, amount, zkProof, claimLink, chillarAmount }) => {
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
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-[#0a0f0a] text-white text-center relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E5D5B3]/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E5D5B3]/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-700">
                {/* Compact Lottie Animation */}
                <div className="relative w-48 h-48 mb-2 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#E5D5B3]/10 rounded-full blur-3xl scale-75"></div>
                    <iframe
                        src="https://lottie.host/embed/11cf97ea-4079-46f7-b3af-5d2639247cbc/zHtee9lJgW.lottie"
                        className="w-full h-full border-0 relative z-10 pointer-events-none"
                        title="Success Animation"
                    />
                </div>

                <div className="mb-4">
                    <h2 className="text-3xl font-black tracking-tight -mt-4 mb-2 uppercase italic text-[#E5D5B3]">Success</h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                        Sent to <span className="text-white">{recipientName}</span>
                    </p>
                </div>

                {/* Compact Amount Card */}
                <div className="relative w-full mb-6 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E5D5B3]/10 via-transparent to-[#E5D5B3]/10 rounded-xl blur-xl opacity-50"></div>
                    <div className="relative bg-zinc-900/40 backdrop-blur-2xl border border-white/5 w-full rounded-3xl p-6 overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-[#E5D5B3] text-2xl font-black opacity-30 italic">₹</span>
                                <h3 className="text-5xl font-black tracking-tighter">
                                    {parseInt(amount).toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        {chillarAmount && chillarAmount > 0 && (
                            <div className="mt-4 py-2 bg-[#E5D5B3]/5 border border-[#E5D5B3]/10 rounded-xl flex items-center justify-center gap-2">
                                <span className="text-[9px] font-black text-[#E5D5B3] uppercase tracking-widest">
                                    ₹{chillarAmount} Gullak Savings
                                </span>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center">
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{today}</p>
                        </div>
                    </div>
                </div>

                {/* Expandable zk-SNARK Verification */}
                {zkProof && (
                    <div className="w-full mb-6 bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => setShowZkDetails(!showZkDetails)}
                            className="w-full p-4 flex items-center justify-between text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <ShieldCheck size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">zk-SNARK Secured</p>
                                    <p className="text-[8px] font-bold text-zinc-500 uppercase">Payout Authorized by ZK-SDK</p>
                                </div>
                            </div>
                            <div className={`transition-transform duration-300 ${showZkDetails ? 'rotate-180' : ''}`}>
                                <ArrowRight size={16} className="text-zinc-700 rotate-90" />
                            </div>
                        </button>

                        <div className={`px-4 bg-black/20 transition-all duration-500 ease-in-out ${showZkDetails ? 'max-h-40 py-4 opacity-100 border-t border-white/5' : 'max-h-0 py-0 opacity-0 overflow-hidden'}`}>
                            <div className="space-y-3 text-left">
                                <div className="flex flex-col gap-1">
                                    <span className="text-zinc-600 text-[8px] uppercase font-black tracking-widest">Proof String</span>
                                    <code className="text-[8px] text-zinc-400 bg-black/40 p-2 rounded-lg break-all font-mono leading-tight border border-white/5">
                                        {zkProof.proof}
                                    </code>
                                </div>
                                <div className="flex justify-between items-center text-[8px]">
                                    <span className="text-zinc-600 font-black uppercase tracking-widest">Signals</span>
                                    <span className="text-zinc-400 font-mono italic">[{zkProof.publicSignals.join(', ')}]</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {claimLink && (
                    <div className="w-full mb-6 bg-[#E5D5B3]/5 border border-[#E5D5B3]/10 rounded-2xl p-4 text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3] mb-2 flex items-center gap-2">
                            <Gift size={14} /> Viral Link Created
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
                            className="w-full py-3 bg-[#E5D5B3] text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Share2 size={14} />
                            Share Link
                        </button>
                    </div>
                )}

                <button
                    onClick={() => navigate('/')}
                    className="w-full h-14 gold-gradient text-black rounded-2xl font-black text-sm shadow-[0_15px_30px_rgba(229,213,179,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                    Return to Dashboard
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default SuccessScreen;
