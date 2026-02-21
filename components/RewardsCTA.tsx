
import React from 'react';
import { Gift, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RewardsCTA: React.FC = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/gullak')}
            className="w-full mt-8 bg-zinc-900/50 border border-white/5 rounded-[1rem] p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
            <div className="flex items-center gap-4">

                <div className="text-left">
                    <p className="text-md font-black  text-white/70 -500 mb-0.5">Introducing Gullak</p>
                    <p className="text-sm font-bold text-white/30">Save money with your friends and family</p>
                </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-[#E5D5B3] group-hover:bg-white/10 transition-all">
                <ChevronRight size={20} />
            </div>
        </button>
    );
};

export default RewardsCTA;
