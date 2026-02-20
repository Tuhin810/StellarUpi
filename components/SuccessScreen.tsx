import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, ShieldCheck, ArrowRight, Share2, Download } from 'lucide-react';

interface SuccessScreenProps {
    recipientName: string;
    amount: string;
    chillarAmount?: number;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ recipientName, amount, chillarAmount }) => {
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

                        {chillarAmount && chillarAmount > 0 && (
                            <div className="mt-4 px-4 py-2 bg-[#E5D5B3]/10 border border-[#E5D5B3]/20 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-1000">
                                <span className="text-[10px] font-black text-[#E5D5B3] uppercase tracking-widest italic">
                                    ₹{chillarAmount} added to your Gullak!
                                </span>
                                <div className="w-1.5 h-1.5 bg-[#E5D5B3] rounded-full animate-pulse" />
                            </div>
                        )}

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
