
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
    onMenuClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick }) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-4 mb-10 relative z-[60]">
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onMenuClick}
                className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl backdrop-blur-md"
            >
                <Menu size={20} />
            </motion.button>

            <div
                onClick={() => navigate('/send')}
                className="flex-1 relative cursor-pointer group"
            >
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                    <Search size={16} />
                </div>
                <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-14 pr-12 font-bold text-xs text-zinc-600 group-hover:text-zinc-400 group-hover:bg-white/[0.05] group-hover:border-white/10 transition-all shadow-inner flex items-center h-full">
                    Search contacts or UPI ID
                </div>
            </div>

            <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl backdrop-blur-md relative"
            >
                <Bell size={20} />
                <div className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-[#E5D5B3] rounded-full shadow-[0_0_8px_rgba(229,213,179,0.5)]" />
            </motion.button>
        </div>
    );
};

export default DashboardHeader;

