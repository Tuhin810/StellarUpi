
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
    Zap,
    Edit2,
    Save,
    RefreshCw
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
            // Ideally we would trigger a global profile refresh here, 
            // but for now the user will see changes on reload or navigation back.
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
        <div className="min-h-screen bg-[#1A1A1A] text-white pb-32 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-20%] right-[-10%] w-[100%] h-[60%] bg-[#E5D5B3]/5 rounded-full blur-[120px]"></div>

            {/* Header */}
            <div className="pt-16 px-8 flex items-center justify-between mb-10 relative z-10">
                <button
                    onClick={() => navigate("/")}
                    className="p-3 bg-zinc-900/80 backdrop-blur-md rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-black tracking-tight">Vault Profile</h2>
                <div className="w-10"></div>
            </div>

            <div className="px-8 relative z-10">
                {/* Profile Card with Avatar Selection */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-6 group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border-2 border-[#E5D5B3]/20 overflow-hidden shadow-2xl relative">
                            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                            <button
                                onClick={generateRandomSeed}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <RefreshCw size={24} className="text-[#E5D5B3]" />
                            </button>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-[#1A1A1A] text-white">
                            <ShieldCheck size={16} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-1 text-center font-black text-xl tracking-tighter w-40 focus:border-[#E5D5B3]/50 outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={saving}
                                    className="p-2 bg-[#E5D5B3] text-black rounded-lg active:scale-90 transition-all disabled:opacity-50"
                                >
                                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-black tracking-tighter capitalize">
                                    {nickname}
                                </h1>
                                <button onClick={() => setIsEditingName(true)} className="p-1 text-zinc-600 hover:text-[#E5D5B3] transition-colors">
                                    <Edit2 size={16} />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleCopy(profile.stellarId, 'id')}>
                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                            {profile.stellarId}
                        </span>
                        {copied === 'id' ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-zinc-700 group-hover:text-zinc-500" />}
                    </div>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <button
                        onClick={() => setShowQR(true)}
                        className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] hover:bg-zinc-900/80 transition-all active:scale-95"
                    >
                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-3 text-[#E5D5B3]">
                            <QrCode size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Receive Money</span>
                    </button>

                    <button className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] hover:bg-zinc-900/80 transition-all active:scale-95">
                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-3 text-[#E5D5B3]">
                            <Zap size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Upgrade Plan</span>
                    </button>
                </div>

                {/* Details List */}
                <div className="space-y-4">
                    <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-[2rem]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Email Address</p>
                                <p className="font-bold text-sm">{profile.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                                <Wallet size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Public Key (Stellar)</p>
                                <p className="font-mono text-xs truncate opacity-80">{profile.publicKey}</p>
                            </div>
                            <button onClick={() => handleCopy(profile.publicKey, 'key')} className="p-2 text-zinc-600 hover:text-white transition-colors">
                                {copied === 'key' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Account Type</p>
                                <p className="font-bold text-sm">Priority Business Vault</p>
                            </div>
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.removeItem('web3_address');
                            sessionStorage.removeItem('temp_vault_key');
                            window.location.href = '/login';
                        }}
                        className="w-full p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] flex items-center justify-center gap-3 text-rose-500 hover:bg-rose-500/10 transition-all group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Terminate Session</span>
                    </button>
                </div>
            </div>

            {/* QR Overlay */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowQR(false)}></div>
                    <div className="relative w-full max-w-sm bg-[#E5D5B3] rounded-[3rem] p-10 flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-black/40">UPI Address</span>
                                <span className="text-black font-black text-sm">{profile.stellarId}</span>
                            </div>
                            <button onClick={() => setShowQR(false)} className="p-2 bg-black/5 rounded-xl text-black/60">
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-xl mb-8">
                            <img src={qrUrl} alt="Receiver QR" className="w-64 h-64 grayscale" />
                        </div>

                        <p className="text-center font-bold text-black/60 text-xs px-6 leading-relaxed">
                            Show this QR code to receive payments directly into your Stellar Vault.
                        </p>

                        <div className="mt-8 flex gap-4 w-full">
                            <button className="flex-1 py-4 bg-black text-[#E5D5B3] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                <ExternalLink size={14} /> Share
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
