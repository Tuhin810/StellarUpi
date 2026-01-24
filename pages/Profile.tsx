
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
    Sparkles,
    Lock,
    Bell,
    Camera,
    Image as ImageIcon,
    Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../services/notification';

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

    // Edit states
    const [isEditingName, setIsEditingName] = useState(false);
    const [nickname, setNickname] = useState(profile?.displayName || profile?.stellarId.split('@')[0] || '');
    const [avatarSeed, setAvatarSeed] = useState(profile?.avatarSeed || profile?.stellarId || 'custom-seed');
    const [saving, setSaving] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [dailyLimitEntry, setDailyLimitEntry] = useState(profile?.dailyLimit || 0);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [pinEntry, setPinEntry] = useState('');

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
        // Automatically save if we change seed
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

    const [notificationStatus, setNotificationStatus] = useState<string>('');

    const handleEnableNotifications = async () => {
        setSaving(true);
        try {
            await NotificationService.requestPermission();
            setNotificationStatus('Prompt Shown');
        } catch (e) {
            setNotificationStatus('Failed');
        }
        setSaving(false);
    };

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
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <button
                                    onClick={generateRandomSeed}
                                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                                    title="Random Avatar"
                                >
                                    <RefreshCw size={18} className="text-[#E5D5B3]" />
                                </button>
                                <button
                                    onClick={handleUploadClick}
                                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                                    title="Upload Photo"
                                >
                                    <Camera size={18} className="text-[#E5D5B3]" />
                                </button>
                            </div>
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

                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden mb-6">
                        {/* Daily Spending Limit */}
                        <div className="p-5 border-b border-white/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#E5D5B3]/10 rounded-xl flex items-center justify-center text-[#E5D5B3]">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-white/30">Daily Spending Limit</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg">₹{profile.dailyLimit || 0}</p>
                                            <button onClick={() => setShowLimitModal(true)} className="p-1 text-white/20 hover:text-[#E5D5B3] transition-colors">
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-white/20 uppercase font-black">Allowance</p>
                                    <p className="text-xs font-bold text-emerald-500">₹{Math.max(0, (profile.dailyLimit || 0) - (profile.spentToday || 0))}</p>
                                </div>
                            </div>

                            {profile.dailyLimit! > 0 && (
                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-[#E5D5B3] transition-all duration-500"
                                        style={{ width: `${Math.min(100, ((profile.spentToday || 0) / profile.dailyLimit!) * 100)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>

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

                        {/* Phone Number */}
                        <div className="flex items-center gap-4 p-4 border-b border-white/5">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                                <Smartphone size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Phone Number</p>
                                <p className="font-medium text-sm truncate">{profile.phoneNumber || 'Not linked'}</p>
                            </div>
                            <button onClick={() => setShowPhoneModal(true)} className="p-2 text-white/30 hover:text-[#E5D5B3] transition-colors">
                                <Edit2 size={16} />
                            </button>
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
                        <button
                            onClick={handleEnableNotifications}
                            className="w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-all"
                        >
                            <span className="text-sm font-medium">Notifications</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[#E5D5B3] uppercase">
                                    {notificationStatus || (profile.fcmToken ? 'ACTIVE' : 'ENABLE')}
                                </span>
                                <ChevronRight size={16} className="text-white/30" />
                            </div>
                        </button>
                        <button
                            onClick={() => setShowSecurityModal(true)}
                            className="w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-all text-left"
                        >
                            <span className="text-sm font-medium">Security & PIN</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">{profile.pin ? 'SET' : 'NOT SET'}</span>
                                <ChevronRight size={16} className="text-white/30" />
                            </div>
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
                        localStorage.removeItem('temp_vault_key');
                        window.location.href = '/login';
                    }}
                    className="w-full p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-3 text-rose-400 hover:bg-rose-500/20 transition-all"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-semibold">Sign Out</span>
                </button>
            </div>

            {/* Phone Modal */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showPhoneModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPhoneModal(false)}></div>
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2.5rem] p-8 flex flex-col items-center transition-transform duration-300 ease-out ${showPhoneModal ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '60vh', minHeight: '400px' }}>
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mb-8"></div>
                    <div className="flex items-center justify-between w-full mb-8">
                        <h3 className="text-2xl font-black tracking-tight">Phone Number</h3>
                        <button onClick={() => setShowPhoneModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                            <Smartphone size={20} />
                        </button>
                    </div>
                    <p className="text-zinc-500 text-sm text-center mb-8 px-6">Add your phone number to allow your contacts to find and pay you easily.</p>

                    <div className="bg-black/40 w-full max-w-sm rounded-3xl p-6 border border-white/5 mb-8">
                        <input
                            type="tel"
                            placeholder="+91 00000 00000"
                            value={phoneEntry}
                            onChange={(e) => setPhoneEntry(e.target.value)}
                            className="w-full bg-transparent text-center text-2xl font-black outline-none text-[#E5D5B3] placeholder-zinc-800"
                        />
                    </div>

                    <div className="flex gap-4 w-full max-w-sm mt-auto">
                        <button onClick={() => setShowPhoneModal(false)} className="flex-1 py-5 bg-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs">
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                setSaving(true);
                                await updateUserDetails(profile.uid, { phoneNumber: phoneEntry });
                                setSaving(false);
                                setShowPhoneModal(false);
                            }}
                            disabled={saving || !phoneEntry}
                            className="flex-[2] py-5 gold-gradient text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30"
                        >
                            {saving ? <RefreshCw size={18} className="animate-spin" /> : 'Save Phone'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Security Modal */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showSecurityModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSecurityModal(false)}></div>
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2.5rem] p-8 flex flex-col items-center transition-transform duration-300 ease-out ${showSecurityModal ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '60vh', minHeight: '400px' }}>
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mb-8"></div>
                    <div className="flex items-center justify-between w-full mb-8">
                        <h3 className="text-2xl font-black tracking-tight">Security PIN</h3>
                        <button onClick={() => setShowSecurityModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                            <Lock size={20} />
                        </button>
                    </div>
                    <p className="text-zinc-500 text-sm text-center mb-8 px-6">Set a 4-digit PIN to secure your payments. Required for every transaction.</p>

                    <div className="bg-black/40 w-full max-w-sm rounded-3xl p-6 border border-white/5 mb-8">
                        <input
                            type="password"
                            maxLength={4}
                            placeholder="PIN"
                            value={pinEntry}
                            onChange={(e) => setPinEntry(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full bg-transparent text-center text-4xl font-black tracking-[1em] outline-none text-[#E5D5B3] placeholder-zinc-800"
                        />
                    </div>

                    <div className="flex gap-4 w-full max-w-sm mt-auto">
                        <button onClick={() => setShowSecurityModal(false)} className="flex-1 py-5 bg-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs">
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                if (pinEntry.length !== 4) return;
                                setSaving(true);
                                await updateUserDetails(profile.uid, { pin: pinEntry });
                                setSaving(false);
                                setShowSecurityModal(false);
                                setPinEntry('');
                            }}
                            disabled={pinEntry.length !== 4 || saving}
                            className="flex-[2] py-5 gold-gradient text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30"
                        >
                            {saving ? <RefreshCw size={18} className="animate-spin" /> : 'Save PIN'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Limit Modal */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showLimitModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLimitModal(false)}></div>
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2.5rem] py-5 px-8 flex flex-col items-center transition-transform duration-300 ease-out ${showLimitModal ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '60vh', minHeight: '400px' }}>
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mb-8"></div>
                    <div className="flex items-center justify-between w-full mb-8">
                        <h3 className="text-2xl font-black tracking-tight">Spending Limit</h3>
                        <button onClick={() => setShowLimitModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                            <ShieldCheck size={20} />
                        </button>
                    </div>
                    <p className="text-zinc-500 text-sm text-center mb-10 px-6">Set your daily transaction limit to stay within your budget.</p>

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
                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="flex-1 py-5 bg-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                setSaving(true);
                                await updateUserDetails(profile.uid, { dailyLimit: dailyLimitEntry });
                                setSaving(false);
                                setShowLimitModal(false);
                            }}
                            disabled={saving}
                            className="flex-[2] py-5 gold-gradient text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30"
                        >
                            {saving ? <RefreshCw size={18} className="animate-spin" /> : 'Update Limit'}
                        </button>
                    </div>
                </div>
            </div>

            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(false)}></div>
                    <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1a2520] to-[#0d1510] border border-white/10 rounded-3xl p-8 flex flex-col items-center animate-in zoom-in-95 duration-300">
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
