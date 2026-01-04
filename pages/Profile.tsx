
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { updateUserDetails } from '../services/db';
import {
    ArrowLeft,
    Copy,
    Check,
    ShieldCheck,
    Mail,
    Wallet,
    QrCode,
    LogOut,
    ExternalLink,
    Edit2,
    Save,
    RefreshCw,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    profile: UserProfile | null;
}

const Profile: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState<'id' | 'key' | null>(null);
    const [showQR, setShowQR] = useState(false);

    // Edit states
    const [isEditingName, setIsEditingName] = useState(false);
    const [nickname, setNickname] = useState(profile?.displayName || profile?.stellarId.split('@')[0] || '');
    const [avatarSeed, setAvatarSeed] = useState(profile?.avatarSeed || profile?.stellarId || 'custom-seed');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setNickname(profile.displayName || profile.stellarId.split('@')[0]);
            setAvatarSeed(profile.avatarSeed || profile.stellarId);
        }
    }, [profile]);

    if (!profile) return null;

    const handleCopy = (text: string, type: 'id' | 'key') => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            await updateUserDetails(profile.uid, {
                displayName: nickname,
                avatarSeed: avatarSeed
            });
            setIsEditingName(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        } finally {
            setSaving(false);
        }
    };

    const generateRandomSeed = () => {
        const randomSeed = Math.random().toString(36).substring(7);
        setAvatarSeed(randomSeed);
    };

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=stellar:pay?to=${profile.stellarId}&color=1A1A1A&bgcolor=E5D5B3`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white pb-32 relative overflow-hidden">
            {/* Header */}
            <div className="pt-5 px-6 flex items-center justify-between relative z-10">
                <button
                    onClick={() => navigate("/")}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold">Profile</h2>
                <div className="w-12"></div>
            </div>

            <div className="px-6 relative z-10 mt-8">
                {/* Profile Card */}
                <div className="flex flex-col items-center mb-10">
                    {/* Avatar with glow */}
                    <div className="relative mb-6 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#E5D5B3]/30 to-transparent rounded-full blur-2xl scale-150 opacity-50"></div>
                        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#1a2520] to-[#0d1510] border-2 border-white/10 overflow-hidden shadow-2xl">
                            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                            <button
                                onClick={generateRandomSeed}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <RefreshCw size={20} className="text-white" />
                            </button>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-4 border-[#0d1510]">
                            <Check size={12} />
                        </div>
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-2 mb-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center font-semibold text-lg w-40 focus:border-[#E5D5B3]/50 outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={saving}
                                    className="p-2 bg-[#E5D5B3] text-black rounded-xl transition-all disabled:opacity-50"
                                >
                                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold capitalize">{nickname}</h1>
                                <button onClick={() => setIsEditingName(true)} className="p-1 text-white/30 hover:text-[#E5D5B3] transition-colors">
                                    <Edit2 size={14} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Stellar ID */}
                    <button
                        onClick={() => handleCopy(profile.stellarId, 'id')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all"
                    >
                        <span className="text-white/50 text-xs font-medium">
                            {profile.stellarId}
                        </span>
                        {copied === 'id' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-white/30" />}
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button
                        onClick={() => setShowQR(true)}
                        className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all"
                    >
                        <div className="w-10 h-10 bg-[#E5D5B3]/10 rounded-xl flex items-center justify-center text-[#E5D5B3]">
                            <QrCode size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-sm">My QR</p>
                            <p className="text-[10px] text-white/40">Receive money</p>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 p-4 bg-gradient-to-br from-[#E5D5B3]/20 to-[#E5D5B3]/5 border border-[#E5D5B3]/20 rounded-2xl hover:from-[#E5D5B3]/30 transition-all">
                        <div className="w-10 h-10 bg-[#E5D5B3]/20 rounded-xl flex items-center justify-center text-[#E5D5B3]">
                            <Sparkles size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-sm text-[#E5D5B3]">Premium</p>
                            <p className="text-[10px] text-[#E5D5B3]/60">Upgrade now</p>
                        </div>
                    </button>
                </div>

                {/* Account Details */}
                <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 px-1">Account Details</p>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                        {/* Email */}
                        <div className="flex items-center gap-4 p-4 border-b border-white/5">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                                <Mail size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Email</p>
                                <p className="font-medium text-sm truncate">{profile.email}</p>
                            </div>
                        </div>

                        {/* Public Key */}
                        <div className="flex items-center gap-4 p-4 border-b border-white/5">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                                <Wallet size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Public Key</p>
                                <p className="font-mono text-xs truncate text-white/70">{profile.publicKey}</p>
                            </div>
                            <button
                                onClick={() => handleCopy(profile.publicKey, 'key')}
                                className="p-2 text-white/30 hover:text-white transition-colors"
                            >
                                {copied === 'key' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                        </div>

                        {/* Account Status */}
                        <div className="flex items-center gap-4 p-4">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                                <ShieldCheck size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Status</p>
                                <p className="font-medium text-sm">Verified Account</p>
                            </div>
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="text-[10px] font-semibold text-emerald-500">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 px-1">Settings</p>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                        <button className="w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-all">
                            <span className="text-sm font-medium">Notifications</span>
                            <ChevronRight size={16} className="text-white/30" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-all">
                            <span className="text-sm font-medium">Security</span>
                            <ChevronRight size={16} className="text-white/30" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                            <span className="text-sm font-medium">Help & Support</span>
                            <ChevronRight size={16} className="text-white/30" />
                        </button>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={() => {
                        localStorage.removeItem('web3_address');
                        sessionStorage.removeItem('temp_vault_key');
                        window.location.href = '/login';
                    }}
                    className="w-full p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-3 text-rose-400 hover:bg-rose-500/20 transition-all"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-semibold">Sign Out</span>
                </button>
            </div>

            {/* QR Overlay */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowQR(false)}></div>
                    <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1a2520] to-[#0d1510] border border-white/10 rounded-3xl p-8 flex flex-col items-center">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/60"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <p className="text-white/40 text-xs mb-2">Scan to Pay</p>
                        <p className="font-semibold mb-6">{profile.stellarId}</p>

                        <div className="bg-white p-4 rounded-2xl mb-6">
                            <img src={qrUrl} alt="Receiver QR" className="w-56 h-56" />
                        </div>

                        <p className="text-center text-white/40 text-xs mb-6 px-4">
                            Show this QR to receive payments directly into your wallet
                        </p>

                        <button className="w-full py-4 bg-[#E5D5B3] text-black rounded-2xl font-semibold text-sm flex items-center justify-center gap-2">
                            <ExternalLink size={16} /> Share QR Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
