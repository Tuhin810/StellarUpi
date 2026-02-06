
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Zap } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';

interface DashboardHeaderProps {
    onMenuClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const { networkName, isMainnet } = useNetwork();

    return (
        <div className="flex items-center gap-3 mb-8 relative z-[60]">
            <button
                onClick={onMenuClick}
                className="p-3 bg-zinc-900/80 rounded-2xl text-zinc-400 hover:text-white border border-white/5 shadow-xl transition-all active:scale-95"
            >
                <Menu size={20} />
            </button>

            <div
                onClick={() => navigate('/send')}
                className="flex-1 relative cursor-pointer group"
            >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-[#E5D5B3] transition-colors">
                    <Search size={16} />
                </div>
                <div className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl py-3 pl-12 pr-4 font-bold text-xs text-zinc-700 shadow-xl flex items-center h-12">
                    Search contacts...
                </div>
            </div>

            <div className={`px-3 h-12 rounded-2xl border flex items-center gap-2 shadow-xl backdrop-blur-md ${isMainnet
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                <Zap size={14} fill="currentColor" className="opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-widest">{networkName}</span>
            </div>
        </div>
    );
};

export default DashboardHeader;
