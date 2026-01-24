
import React from 'react';
import { Gift, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RewardsCTA: React.FC = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/rewards')}
            className="w-full mt-8 bg-zinc-900/50 border border-white/5 rounded-[2rem] p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Gift size={22} />
                </div>
                <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-0.5">Stellar Rewards</p>
                    <p className="text-sm font-bold text-white/70">You have 1,250 XLM to claim</p>
                </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-[#E5D5B3] group-hover:bg-white/10 transition-all">
                <ChevronRight size={20} />
            </div>
        </button>
    );
};

export default RewardsCTA;
