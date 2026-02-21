
import React from 'react';
import { X, User, Settings, LogOut, ChevronRight, Zap, ArrowDownToLine, Repeat, Shield } from 'lucide-react';
import StreakFire from './StreakFire';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';
import { getAvatarUrl } from '../services/avatars';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    profileName: string;
    stellarId: string;
    avatarSeed?: string;
    streak?: number;
    streakLevel?: 'orange' | 'blue' | 'purple';
}

const SideDrawer: React.FC<Props> = ({ isOpen, onClose, profileName, stellarId, avatarSeed, streak, streakLevel }) => {
    const navigate = useNavigate();
    const { isMainnet, networkName, toggleNetwork } = useNetwork();
    const avatarUrl = getAvatarUrl(avatarSeed || stellarId);

    const menuItems = [
        { icon: <User size={20} />, label: 'My Profile', path: '/profile' },
        { icon: <ArrowDownToLine size={20} />, label: 'Withdraw to Bank', path: '/withdraw' },
        { icon: <Repeat size={20} />, label: 'AutoPay', path: '/autopay' },
        { icon: <Shield size={20} />, label: 'Security', path: '/security' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('web3_address');
        localStorage.removeItem('temp_vault_key');
        window.location.reload();
    };

    const handleNetworkToggle = () => {
        if (window.confirm(`Switch to ${isMainnet ? 'Testnet' : 'Mainnet'}? This will reload the app.`)) {
            toggleNetwork();
        }
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
                className={`fixed top-0 left-0 h-full w-[80%] max-w-[320px] bg-gradient-to-b from-[#0a0f0a] to-[#0d1210] z-[70] transition-transform duration-300 ease-out border-r border-white/5 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 pt-14 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden">
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h2 className="text-lg font-bold tracking-tight capitalize truncate">{profileName}</h2>
                            <p className="text-zinc-500 text-[10px] font-mono tracking-wider truncate">{stellarId}</p>
                        </div>
                    </div>
                </div>

                {/* Streak */}
                {streak !== undefined && streak > 0 && (
                    <div className="px-4 mb-2">
                        <button
                            onClick={() => { navigate('/streak'); onClose(); }}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#FF6B00]/30 transition-all group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <StreakFire streak={streak} level={streakLevel || 'orange'} />
                            <ChevronRight size={16} className="text-zinc-700 relative z-10" />
                        </button>
                    </div>
                )}

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 mt-2">
                    <div className="space-y-1">
                        {menuItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => { navigate(item.path); onClose(); }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-4 text-zinc-400 group-hover:text-white transition-colors">
                                    {item.icon}
                                    <span className="font-medium text-sm text-zinc-300 group-hover:text-white transition-colors">{item.label}</span>
                                </div>
                                <ChevronRight size={16} className="text-zinc-800 group-hover:text-zinc-400 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 space-y-4">
                    {/* Network Toggle */}
                    <button
                        onClick={handleNetworkToggle}
                        className="w-full flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5 hover:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isMainnet ? 'bg-emerald-400' : 'bg-[#E5D5B3]'}`} />
                            <div className="text-left">
                                <p className={`text-xs font-bold ${isMainnet ? 'text-emerald-400' : 'text-[#E5D5B3]'}`}>{networkName}</p>
                                <p className="text-[9px] text-zinc-600">Stellar Protocol</p>
                            </div>
                        </div>
                        <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${isMainnet ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full transition-all duration-300 ${isMainnet ? 'left-5 bg-emerald-400' : 'left-1 bg-zinc-500'}`} />
                        </div>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 p-3 rounded-2xl text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                    >
                        <LogOut size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SideDrawer;
