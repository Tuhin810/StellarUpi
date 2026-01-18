import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SuccessScreenProps {
    recipientName: string;
    amount: string;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ recipientName, amount }) => {
    const navigate = useNavigate();
    const successSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!successSoundRef.current) {
            successSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
            successSoundRef.current.volume = 0.5;
            successSoundRef.current.play().catch(() => { });
        }
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#1A1A1A] text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[20%] left-[20%] w-[120%] h-[60%] bg-[#E5D5B3]/5 rounded-full blur-[120px] rotate-[-15deg]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
                {/* Lottie Success Animation */}
                <div className="w-72 h-72 mb-2">
                    <iframe
                        src="https://lottie.host/embed/11cf97ea-4079-46f7-b3af-5d2639247cbc/zHtee9lJgW.lottie"
                        className="w-full h-full border-0"
                        title="Success Animation"
                    />
                </div>
                <h2 className="text-3xl font-black mb-2 tracking-tight">Success</h2>
                <p className="text-zinc-500 font-medium mb-12">
                    Transfer to <span className="text-white">{recipientName}</span> completed
                </p>

                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 w-full rounded-[2.5rem] p-10 mb-12">
                    <span className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] block mb-2">
                        Total Amount
                    </span>
                    <h3 className="text-5xl font-black italic">₹{parseInt(amount).toLocaleString()}</h3>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="w-full gold-gradient text-black py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default SuccessScreen;
