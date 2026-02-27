
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { updateUserDetails } from '../services/db';
import {
    ArrowLeft,
    Bell,
    Lock,
    Fingerprint,
    ChevronRight,
    Shield,
    RefreshCw,
    Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../services/notification';
import { PasskeyService } from '../services/passkeyService';
import { KYCService } from '../services/kycService';
import { encryptSecret, decryptSecret } from '../services/encryption';

interface Props {
    profile: UserProfile | null;
}

const Security: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [registeringPasskey, setRegisteringPasskey] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinEntry, setPinEntry] = useState('');
    const [notificationStatus, setNotificationStatus] = useState('ACTIVE');

    if (!profile) return null;

    const handleEnableNotifications = async () => {
        setNotificationStatus('ACTIVE');
        alert("In-app notifications enabled!");
    };

    const handleSendTestNotification = async () => {
        setSaving(true);
        await NotificationService.sendInAppNotification(
            profile.stellarId,
            "Notification Test ✅",
            "Your notification system is fully operational.",
            "success"
        );
        setSaving(false);
        alert("Test notification sent!");
    };

    const handleRegisterPasskey = async () => {
        setRegisteringPasskey(true);
        try {
            await PasskeyService.registerPasskey(profile);
            NotificationService.sendInAppNotification(
                profile.stellarId,
                "Passkey Registered! 🔑",
                "You can now use Biometrics to confirm payments.",
                "success"
            );
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to register passkey");
        } finally {
            setRegisteringPasskey(false);
        }
    };

    const handleSavePin = async () => {
        if (pinEntry.length !== 4) return;
        setSaving(true);
        try {
            // CRITICAL: When changing PIN, we MUST re-encrypt the Stellar Secret
            // because the encryption key is derived from Phone + PIN.
            const oldPin = profile.pin || '0000';
            const phone = localStorage.getItem('ching_phone') || '';

            const oldVaultKey = KYCService.deriveEncryptionKey(phone, oldPin);
            const newVaultKey = KYCService.deriveEncryptionKey(phone, pinEntry);

            // Decrypt with old key
            const rawSecret = decryptSecret(profile.encryptedSecret, oldVaultKey);

            if (!rawSecret || !rawSecret.startsWith('S')) {
                throw new Error("Failed to re-encrypt vault. Please ensure your old PIN/Session is valid.");
            }

            // Encrypt with new key
            const newEncryptedSecret = encryptSecret(rawSecret, newVaultKey);

            // ALSO re-encrypt Gullak secret if it exists
            let newGullakSecret = profile.gullakEncryptedSecret;
            if (profile.gullakEncryptedSecret) {
                const rawGullak = decryptSecret(profile.gullakEncryptedSecret, oldVaultKey);
                if (rawGullak && rawGullak.startsWith('S')) {
                    newGullakSecret = encryptSecret(rawGullak, newVaultKey);
                }
            }

            await updateUserDetails(profile.uid, {
                pin: pinEntry,
                encryptedSecret: newEncryptedSecret,
                gullakEncryptedSecret: newGullakSecret
            });

            setShowPinModal(false);
            setPinEntry('');
            NotificationService.sendInAppNotification(
                profile.stellarId,
                "Security PIN Updated 🔒",
                "Your Stellar Vault has been re-keyed for protection.",
                "success"
            );
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to save PIN.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white pb-32 relative overflow-hidden">

            {/* Header */}
            <div className="sticky top-0 z-30 px-6 pt-5 pb-4 bg-gradient-to-b from-[#0a0f0a] to-transparent">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl backdrop-blur-md"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <p className="text-sm font-bold tracking-tight text-white/70">Security</p>
                    <div className="w-12" />
                </div>
            </div>

            {/* Hero */}
            <div className="px-6 mt-6 mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Security</h1>
                        <p className="text-white/40 text-xs">Manage your account protection</p>
                    </div>
                </div>
            </div>

            {/* Settings List */}
            <div className="px-6">
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">

                    {/* Notifications */}
                    <button
                        onClick={handleEnableNotifications}
                        className="w-full flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                                <Bell size={20} />
                            </div>
                            <span className="font-medium text-[15px]">Notifications</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                            <ChevronRight size={16} className="text-white/20" />
                        </div>
                    </button>

                    {/* Test Notification */}
                    <button
                        onClick={handleSendTestNotification}
                        disabled={saving}
                        className="w-full flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                <Bell size={20} />
                            </div>
                            <span className="font-medium text-[15px]">Test Notification</span>
                        </div>
                        <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/20 rounded-xl">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                {saving ? 'Sending...' : 'Send'}
                            </span>
                        </div>
                    </button>

                    {/* Security PIN */}
                    <button
                        onClick={() => setShowPinModal(true)}
                        className="w-full flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                                <Lock size={20} />
                            </div>
                            <span className="font-medium text-[15px]">Security PIN</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${profile.pin ? 'text-emerald-500' : 'text-rose-400'}`}>
                                {profile.pin ? 'Set' : 'Not Set'}
                            </span>
                            <ChevronRight size={16} className="text-white/20" />
                        </div>
                    </button>

                    {/* Biometric Login */}
                    <button
                        onClick={handleRegisterPasskey}
                        disabled={registeringPasskey || !PasskeyService.isSupported()}
                        className="w-full flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${profile.passkeyEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40'}`}>
                                <Fingerprint size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-[15px]">Biometric Login</span>
                                <span className="text-[9px] text-white/30 uppercase font-bold tracking-wider">FaceID / Fingerprint</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${profile.passkeyEnabled ? 'text-emerald-500' : 'text-[#E5D5B3]'}`}>
                                {registeringPasskey ? 'Wait...' : profile.passkeyEnabled ? 'Active' : 'Enable'}
                            </span>
                            <ChevronRight size={16} className="text-white/20" />
                        </div>
                    </button>

                    {/* Help & Support */}
                    <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                                <Zap size={20} />
                            </div>
                            <span className="font-medium text-[15px]">Help & Support</span>
                        </div>
                        <ChevronRight size={16} className="text-white/20" />
                    </button>
                </div>
            </div>

            {/* PIN Modal */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showPinModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)} />
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2.5rem] p-8 flex flex-col items-center transition-transform duration-300 ease-out ${showPinModal ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mb-8" />
                    <div className="flex items-center justify-between w-full mb-6">
                        <h3 className="text-2xl font-black tracking-tight">Security PIN</h3>
                        <button onClick={() => setShowPinModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                            <Lock size={20} />
                        </button>
                    </div>
                    <p className="text-zinc-500 text-sm text-center mb-8 px-4">Set a 4-digit PIN to secure every payment.</p>

                    <div className="bg-black/40 w-full max-w-sm rounded-3xl p-6 border border-white/5 mb-8">
                        <input
                            type="password"
                            maxLength={4}
                            placeholder="• • • •"
                            value={pinEntry}
                            onChange={(e) => setPinEntry(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full bg-transparent text-center text-4xl font-black tracking-[1em] outline-none text-[#E5D5B3] placeholder-zinc-800"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-4 w-full max-w-sm">
                        <button onClick={() => { setShowPinModal(false); setPinEntry(''); }} className="flex-1 py-5 bg-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs">
                            Cancel
                        </button>
                        <button
                            onClick={handleSavePin}
                            disabled={pinEntry.length !== 4 || saving}
                            className="flex-[2] py-5 gold-gradient text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30"
                        >
                            {saving ? 'Saving...' : 'Save PIN'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Security;
