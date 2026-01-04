
import React from 'react';
import { X, User, Settings, HelpCircle, Shield, LogOut, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    profileName: string;
    stellarId: string;
    avatarSeed?: string;
}

const SideDrawer: React.FC<Props> = ({ isOpen, onClose, profileName, stellarId, avatarSeed }) => {
    const navigate = useNavigate();
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed || stellarId}`;

    const menuItems = [
        { icon: <User size={22} />, label: 'My Profile', path: '/profile' },
        { icon: <Settings size={22} />, label: 'Settings', path: '/settings' },
        { icon: <Shield size={22} />, label: 'Security & Privacy', path: '/security' },
        { icon: <HelpCircle size={22} />, label: 'Help & Support', path: '/help' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('web3_address');
        sessionStorage.removeItem('temp_vault_key');
        window.location.reload();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 left-0 h-full w-[80%] max-w-[320px] bg-[#1A1A1A] z-[70] transition-transform duration-300 ease-out border-r border-white/5 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-8 pt-16 flex justify-between items-start mb-8 text-white">
                    <div className="flex flex-col items-start">
                        {/* <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden shadow-2xl mb-4">
                            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                        </div> */}
                        <h2 className="text-xl font-black tracking-tight capitalize">{profileName}</h2>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">{stellarId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 px-4 space-y-2">
                    {menuItems.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                navigate(item.path);
                                onClose();
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-900 transition-all group"
                        >
                            <div className="flex items-center gap-4 text-zinc-400 group-hover:text-[#E5D5B3]">
                                {item.icon}
                                <span className="font-bold text-sm tracking-tight text-white">{item.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-800 group-hover:text-[#E5D5B3] transition-all" />
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 space-y-6">
                    <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                        <div className="w-8 h-8 gold-gradient rounded-lg flex items-center justify-center text-black shadow-lg">
                            <Zap size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Stellar Protocol</p>
                            <p className="text-xs font-bold text-white">TestNet v2.4.0</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 text-rose-500 font-black text-sm uppercase tracking-widest hover:bg-rose-500/5 rounded-2xl transition-all"
                    >
                        <LogOut size={20} />
                        Logout Account
                    </button>
                </div>
            </div>
        </>
    );
};

export default SideDrawer;
