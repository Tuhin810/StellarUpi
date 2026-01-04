
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Send, Download, Users } from 'lucide-react';

interface QuickActionsProps {
    onReceiveClick: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onReceiveClick }) => {
    const navigate = useNavigate();

    const actions = [
        { icon: <QrCode size={20} />, label: 'Scan', action: () => navigate('/scan') },
        { icon: <Send size={20} />, label: 'Send', action: () => navigate('/send') },
        { icon: <Download size={20} />, label: 'Receive', action: onReceiveClick },
        { icon: <Users size={20} />, label: 'Family', action: () => navigate('/family') }
    ];

    return (
        <div className="grid grid-cols-4 gap-4 mt-10">
            {actions.map((item, i) => (
                <button
                    key={i}
                    onClick={item.action}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#E5D5B3]/10 to-[#E5D5B3]/5 border border-white/5 rounded-2xl flex items-center justify-center text-[#E5D5B3] shadow-lg hover:bg-zinc-800 transition-all active:scale-90">
                        {item.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

export default QuickActions;
