
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
    Camera,
    Smartphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

declare global {
    interface Window {
        cloudinary: any;
    }
}

interface Props {
    profile: UserProfile | null;
}

const Profile: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState<'id' | 'key' | null>(null);
    const [showQR, setShowQR] = useState(false);

    const [isEditingName, setIsEditingName] = useState(false);
    const [nickname, setNickname] = useState(profile?.displayName || profile?.stellarId.split('@')[0] || '');
    const [avatarSeed, setAvatarSeed] = useState(profile?.avatarSeed || profile?.stellarId || 'custom-seed');
    const [saving, setSaving] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [dailyLimitEntry, setDailyLimitEntry] = useState(profile?.dailyLimit || 0);

    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneEntry, setPhoneEntry] = useState(profile?.phoneNumber || '');

    useEffect(() => {
        if (profile) {
            setNickname(profile.displayName || profile.stellarId.split('@')[0]);
            setAvatarSeed(profile.avatarSeed || profile.stellarId);
            setDailyLimitEntry(profile.dailyLimit || 0);
            setPhoneEntry(profile.phoneNumber || '');
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
                avatarSeed: avatarSeed,
                dailyLimit: dailyLimitEntry
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
        updateUserDetails(profile.uid, { avatarSeed: randomSeed });
    };

    const handleUploadClick = () => {
        if (!window.cloudinary) {
            console.error('Cloudinary widget not loaded');
            alert('Cloudinary is still loading, please wait a moment...');
            return;
        }

        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: 'diecfwnp9',
                uploadPreset: 'jo9pp2yd',
                sources: ['local', 'url', 'camera'],
                folder: 'stellar_profiles',
                cropping: true,
                multiple: false,
                maxFileSize: 50000000,
                maxFiles: 1,
                resourceType: 'image',
                clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
                styles: {
                    palette: {
                        window: "#0A0F0A",
                        windowBorder: "#E5D5B3",
                        tabIcon: "#E5D5B3",
                        menuIcons: "#E5D5B3",
                        textDark: "#000000",
                        textLight: "#FFFFFF",
                        link: "#E5D5B3",
                        action: "#E5D5B3",
                        inactiveTabIcon: "#444444",
                        error: "#F44235",
                        inProgress: "#E5D5B3",
                        complete: "#20B832",
                        sourceBg: "#0A0F0A"
                    }
                }
            },
            (error: any, result: any) => {
                if (!error && result && result.event === "success") {
                    const url = result.info.secure_url;
                    setAvatarSeed(url);
                    updateUserDetails(profile.uid, { avatarSeed: url });
                }
            }
        );
        widget.open();
    };

    const avatarUrl = avatarSeed.startsWith('http')
        ? avatarSeed
        : `https://api.dicebear.com/7.x/lorelei/svg?seed=${avatarSeed}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=stellar:pay?to=${profile.stellarId}&color=1A1A1A&bgcolor=E5D5B3`;

    const handleLogout = () => {
        localStorage.removeItem('web3_address');
        localStorage.removeItem('temp_vault_key');
        window.location.href = '/login';
    };

    const spentPercent = Math.min(100, ((profile.spentToday || 0) / (profile.dailyLimit || 1)) * 100);
    const remaining = Math.max(0, (profile.dailyLimit || 0) - (profile.spentToday || 0));

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white pb-32 relative overflow-hidden">

            {/* Header */}
            <div className="sticky top-0 z-30 px-6 pt-5 pb-4 bg-gradient-to-b from-[#0a0f0a] to-transparent">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate("/")}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl backdrop-blur-md"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <p className="text-sm font-bold tracking-tight text-white/70">My Account</p>
                    <button
                        onClick={() => setShowQR(true)}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl backdrop-blur-md"
                    >
                        <QrCode size={18} />
                    </button>
                </div>
            </div>

            {/* Identity Card */}
            <div className="px-6 mt-4">
                <div className="relative bg-white/[0.03] border border-white/5 rounded-3xl p-6 overflow-hidden backdrop-blur-md">
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#E5D5B3]/5 rounded-full blur-[60px] pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-5">
                        <div className="relative group shrink-0">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1a2520] to-[#0d1510] border-2 border-white/10 overflow-hidden shadow-2xl">
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                    <button onClick={generateRandomSeed} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20">
                                        <RefreshCw size={14} className="text-[#E5D5B3]" />
                                    </button>
                                    <button onClick={handleUploadClick} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20">
                                        <Camera size={14} className="text-[#E5D5B3]" />
                                    </button>
                                </div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-5 h-5 rounded-full border-[3px] border-[#0d1510] flex items-center justify-center">
                                <Check size={10} strokeWidth={3} className="text-white" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 font-semibold text-lg w-32 focus:border-[#E5D5B3]/50 outline-none"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateProfile} disabled={saving} className="p-1.5 bg-[#E5D5B3] text-black rounded-lg disabled:opacity-50">
                                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-xl font-bold capitalize truncate">{nickname}</h1>
                                        <button onClick={() => setIsEditingName(true)} className="p-1 text-white/20 hover:text-[#E5D5B3] transition-colors shrink-0">
                                            <Edit2 size={12} />
                                        </button>
                                    </>
                                )}
                            </div>
                            <button onClick={() => handleCopy(profile.stellarId, 'id')} className="flex items-center gap-2 group">
                                <span className="text-white/40 text-xs font-medium truncate">{profile.stellarId}</span>
                                {copied === 'id'
                                    ? <Check size={12} className="text-emerald-500 shrink-0" />
                                    : <Copy size={12} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Limit */}
            <div className="px-6 mt-6">
                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#E5D5B3]/10 rounded-xl flex items-center justify-center text-[#E5D5B3]">
                                <ShieldCheck size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-white/30">Daily Limit</p>
                                <p className="font-bold text-lg">₹{profile.dailyLimit || 0}</p>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                            <div>
                                <p className="text-[10px] text-white/20 uppercase font-black">Left</p>
                                <p className="text-xs font-bold text-emerald-500">₹{remaining}</p>
                            </div>
                            <button onClick={() => setShowLimitModal(true)} className="p-2 text-white/20 hover:text-[#E5D5B3] transition-colors">
                                <Edit2 size={12} />
                            </button>
                        </div>
                    </div>
                    {(profile.dailyLimit || 0) > 0 && (
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-[#E5D5B3] transition-all duration-500" style={{ width: `${spentPercent}%` }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Account Info */}
            <div className="px-6 mt-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 px-1">Account Info</p>
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
                    <div className="flex items-center gap-4 p-4 border-b border-white/5">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                            <Mail size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Email</p>
                            <p className="font-medium text-sm truncate">{profile.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 border-b border-white/5">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                            <Smartphone size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Phone</p>
                            <p className="font-medium text-sm truncate">{profile.phoneNumber || 'Not linked'}</p>
                        </div>
                        <button onClick={() => setShowPhoneModal(true)} className="p-2 text-white/30 hover:text-[#E5D5B3] transition-colors">
                            <Edit2 size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 p-4 border-b border-white/5">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                            <Wallet size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Wallet Address</p>
                            <p className="font-mono text-xs truncate text-white/70">{profile.publicKey}</p>
                        </div>
                        <button onClick={() => handleCopy(profile.publicKey, 'key')} className="p-2 text-white/30 hover:text-white transition-colors">
                            {copied === 'key' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                    </div>

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

            {/* Logout */}
            <div className="px-6 mt-8">
                <button
                    onClick={handleLogout}
                    className="w-full p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-3 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-[0.98]"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-semibold">Sign Out</span>
                </button>
            </div>

            {/* ═══ MODALS ═══ */}

            {/* Phone Modal */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showPhoneModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPhoneModal(false)} />
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2.5rem] p-8 flex flex-col items-center transition-transform duration-300 ease-out ${showPhoneModal ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mb-8" />
                    <div className="flex items-center justify-between w-full mb-8">
                        <h3 className="text-2xl font-black tracking-tight">Phone Number</h3>
                        <button onClick={() => setShowPhoneModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                            <Smartphone size={20} />
                        </button>
                    </div>
                    <p className="text-zinc-500 text-sm text-center mb-8 px-6">Add your phone number so contacts can find and pay you easily.</p>

                    <div className="bg-black/40 w-full max-w-sm rounded-3xl p-6 border border-white/5 mb-8">
                        <input
                            type="tel"
                            placeholder="+91 00000 00000"
                            value={phoneEntry}
                            onChange={(e) => setPhoneEntry(e.target.value)}
                            className="w-full bg-transparent text-center text-2xl font-black outline-none text-[#E5D5B3] placeholder-zinc-800"
                        />
                    </div>

                    <div className="flex gap-4 w-full max-w-sm">
                        <button onClick={() => setShowPhoneModal(false)} className="flex-1 py-5 bg-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs">Cancel</button>
                        <button
                            onClick={async () => {
                                setSaving(true);
                                try { await updateUserDetails(profile.uid, { phoneNumber: phoneEntry }); setShowPhoneModal(false); }
                                catch (err) { console.error(err); alert("Update failed."); }
                                finally { setSaving(false); }
                            }}
                            disabled={saving || !phoneEntry}
                            className="flex-[2] py-5 gold-gradient text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30"
                        >
                            {saving ? <RefreshCw size={18} className="animate-spin mx-auto" /> : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Limit Modal */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showLimitModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLimitModal(false)} />
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2.5rem] py-5 px-8 flex flex-col items-center transition-transform duration-300 ease-out ${showLimitModal ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mb-8" />
                    <div className="flex items-center justify-between w-full mb-8">
                        <h3 className="text-2xl font-black tracking-tight">Spending Limit</h3>
                        <button onClick={() => setShowLimitModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                            <ShieldCheck size={20} />
                        </button>
                    </div>
                    <p className="text-zinc-500 text-sm text-center mb-10 px-6">Set your daily transaction limit.</p>

                    <div className="bg-black/40 w-full max-w-sm rounded-[2rem] p-6 border border-white/5 mb-10 flex items-center justify-center gap-4">
                        <span className="text-4xl font-black text-zinc-700">₹</span>
                        <input
                            type="number"
                            placeholder="0"
                            value={dailyLimitEntry}
                            onChange={(e) => setDailyLimitEntry(Number(e.target.value))}
                            className="bg-transparent text-center text-4xl font-black outline-none text-[#E5D5B3] placeholder-zinc-800 w-full"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-4 w-full max-w-sm mt-auto mb-4">
                        <button onClick={() => setShowLimitModal(false)} className="flex-1 py-5 bg-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs">Cancel</button>
                        <button
                            onClick={async () => {
                                setSaving(true);
                                try { await updateUserDetails(profile.uid, { dailyLimit: dailyLimitEntry }); setShowLimitModal(false); }
                                catch (err) { console.error(err); alert("Update failed."); }
                                finally { setSaving(false); }
                            }}
                            disabled={saving}
                            className="flex-[2] py-5 gold-gradient text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30"
                        >
                            {saving ? <RefreshCw size={18} className="animate-spin mx-auto" /> : 'Update'}
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Modal */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(false)} />
                    <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1a2520] to-[#0d1510] border border-white/10 rounded-3xl p-8 flex flex-col items-center">
                        <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/60">
                            <ArrowLeft size={18} />
                        </button>

                        <p className="text-white/40 text-xs mb-2">Scan to Pay</p>
                        <p className="font-semibold mb-6">{profile.stellarId}</p>

                        <div className="bg-white p-4 rounded-2xl mb-6">
                            <img src={qrUrl} alt="Receiver QR" className="w-56 h-56" />
                        </div>

                        <p className="text-center text-white/40 text-xs mb-6 px-4">Show this QR to receive payments directly into your wallet</p>

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
