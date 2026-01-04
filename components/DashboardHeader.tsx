
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';

interface DashboardHeaderProps {
    onMenuClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick }) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-4 mb-8 relative z-[60]">
            <button
                onClick={onMenuClick}
                className="p-3 bg-zinc-900/80 rounded-2xl text-zinc-400 hover:text-white border border-white/5 shadow-xl transition-all active:scale-95"
            >
                <Menu size={22} />
            </button>

            <div
                onClick={() => navigate('/send')}
                className="flex-1 relative cursor-pointer"
            >
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600">
                    <Search size={18} />
                </div>
                <div className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-14 pr-12 font-bold text-xs text-zinc-700 shadow-xl flex items-center h-full">
                    Search ...
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
