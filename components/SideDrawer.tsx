
import React from 'react';
import { X, User, Settings, HelpCircle, Shield, LogOut, ChevronRight, Zap, ToggleLeft, ToggleRight, ArrowDownToLine, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';
import { getAvatarUrl } from '../services/avatars';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    profileName: string;
    stellarId: string;
    avatarSeed?: string;
}

const SideDrawer: React.FC<Props> = ({ isOpen, onClose, profileName, stellarId, avatarSeed }) => {
    const navigate = useNavigate();
    const { isMainnet, networkName, toggleNetwork } = useNetwork();
    const avatarUrl = getAvatarUrl(avatarSeed || stellarId);

    const menuItems = [
        { icon: <User size={22} />, label: 'My Profile', path: '/profile' },
        { icon: <ArrowDownToLine size={22} />, label: 'Withdraw to Bank', path: '/withdraw' },
        { icon: <Repeat size={22} />, label: 'AutoPay', path: '/autopay' },
        { icon: <Settings size={22} />, label: 'Settings', path: '/settings' },
        { icon: <Shield size={22} />, label: 'Security & Privacy', path: '/security' },
        { icon: <HelpCircle size={22} />, label: 'Help & Support', path: '/help' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('web3_address');
        sessionStorage.removeItem('temp_vault_key');
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
                className={`fixed top-0 left-0 h-full w-[80%] max-w-[320px] bg-[#1A1A1A] z-[70] transition-transform duration-300 ease-out border-r border-white/5 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-8 pt-16 flex flex-col mb-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden">
                            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                            <h2 className="text-xl font-black tracking-tight capitalize truncate w-full">{profileName}</h2>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1 truncate w-full">{stellarId}</p>
                        </div>
                    </div>
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
                    {/* Network Toggle */}
                    <button
                        onClick={handleNetworkToggle}
                        className="w-full flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-white/5 hover:bg-zinc-900 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${isMainnet
                                ? 'bg-emerald-500 text-white'
                                : 'gold-gradient text-black'
                                }`}>
                                <Zap size={16} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Stellar Network</p>
                                <p className={`text-xs font-bold ${isMainnet ? 'text-emerald-400' : 'text-[#E5D5B3]'}`}>
                                    {networkName}
                                </p>
                            </div>
                        </div>
                        <div className="text-zinc-500 group-hover:text-white transition-colors">
                            {isMainnet ? <ToggleRight size={28} className="text-emerald-400" /> : <ToggleLeft size={28} />}
                        </div>
                    </button>

                    {/* Mainnet Warning */}
                    {isMainnet && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                                ⚡ Real XLM Mode
                            </p>
                            <p className="text-zinc-400 text-[10px] mt-1">
                                Transactions use real cryptocurrency
                            </p>
                        </div>
                    )}

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
