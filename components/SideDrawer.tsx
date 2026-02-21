
import React from 'react';
import { X, User, Settings, HelpCircle, Shield, LogOut, ChevronRight, Zap, ToggleLeft, ToggleRight, ArrowDownToLine, Repeat, Gift, PiggyBank } from 'lucide-react';
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
        { icon: <User size={22} />, label: 'My Profile', path: '/profile' },
        { icon: <ArrowDownToLine size={22} />, label: 'Withdraw to Bank', path: '/withdraw' },
        { icon: <Repeat size={22} />, label: 'AutoPay', path: '/autopay' },
        { icon: <Settings size={22} />, label: 'Settings', path: '/settings' },
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
                className={`fixed top-0 left-0 h-full w-[85%] max-w-[340px] bg-[#0A0A0A] z-[70] transition-transform duration-500 ease-[cubic-bezier(0.32,0,0.67,0)] flex flex-col border-r border-white/5 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-8 pt-16 flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors p-1"
                    >
                        <X size={24} strokeWidth={1.5} />
                    </button>

                    <div className="flex flex-col gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/10 p-1 shadow-2xl overflow-hidden group">
                            <img
                                src={avatarUrl}
                                alt="User Avatar"
                                className="w-full h-full object-cover rounded-[1.4rem] transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-semibold tracking-tight text-white leading-tight">{profileName}</h2>
                            <p className="text-zinc-500 text-[11px] font-mono tracking-wider truncate bg-zinc-900/50 w-fit px-2 py-0.5 rounded-md border border-white/5 uppercase">
                                {stellarId.slice(0, 8)}...{stellarId.slice(-8)}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Streak (if active) */}
                {streak !== undefined && streak > 0 && (
                    <div className="mt-6 px-2">
                        <button
                            onClick={() => {
                                navigate('/streak');
                                onClose();
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 hover:border-zinc-700/50 transition-all group"
                        >
                            <StreakFire streak={streak} level={streakLevel || 'orange'} />
                            <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 group-hover:text-white transition-colors">
                                <ChevronRight size={14} />
                            </div>
                        </button>
                    </div>
                )}
                {/* Main Content */}
                <div className="flex-1 px-4 mt-8">
                    <div className="grid gap-2">
                        {menuItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    navigate(item.path);
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-900/50 transition-all duration-300 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-zinc-500 group-hover:text-white transition-colors duration-300">
                                        {item.icon}
                                    </div>
                                    <span className="font-medium text-[15px] tracking-tight text-zinc-300 group-hover:text-white transition-colors duration-300">
                                        {item.label}
                                    </span>
                                </div>
                                <ChevronRight
                                    size={16}
                                    className="text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all duration-300"
                                />
                            </button>
                        ))}
                    </div>


                </div>

                {/* Footer */}
                <div className="p-8 space-y-8 bg-[#0C0C0C]/50 border-t border-white/5">
                    {/* Network Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 px-1">
                            Environment
                        </label>
                        <button
                            onClick={handleNetworkToggle}
                            className="w-full flex items-center justify-between bg-zinc-900/30 p-1.5 rounded-2xl border border-white/5 hover:bg-zinc-900/80 transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-3">

                                <div className="text-left">
                                    <p className={`text-[13px] font-semibold tracking-tight ${isMainnet ? 'text-emerald-400' : 'text-[#E5D5B3]'}`}>
                                        {networkName}
                                    </p>
                                    <p className="text-[10px] text-zinc-600 font-medium">Stellar Protocol</p>
                                </div>
                            </div>
                            <div className="pr-3">
                                <div className={`w-10 h-5 rounded-full relative transition-colors duration-500 ${isMainnet ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all duration-500 ease-out ${isMainnet
                                        ? 'left-6 bg-emerald-400'
                                        : 'left-1 bg-zinc-500'
                                        }`} />
                                </div>
                            </div>
                        </button>
                    </div>


                </div>
            </div>
        </>
    );
};

export default SideDrawer;
