import React, { useState, useEffect } from 'react';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        if (isStandalone) return;

        // For Android/Chrome - Native WebAPK Installation
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Trigger the browser's native installation dialog
        // On Android, this triggers the "Package Installer" for a WebAPK
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the system install prompt');
        } else {
            console.log('User dismissed the system install prompt');
        }

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-[#1A1A1A]/95 backdrop-blur-2xl border border-[#E5D5B3]/20 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_50px_rgba(229,213,179,0.05)] relative overflow-hidden">
                {/* Premium Shine Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#E5D5B3]/10 blur-[60px] rounded-full pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-black border border-[#E5D5B3]/20 p-2.5 flex items-center justify-center shadow-2xl">
                        <img src="/icon-192.png" alt="StellarPay" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[#E5D5B3] font-extrabold text-xl leading-tight tracking-tight">StellarPay App</h3>
                        <p className="text-zinc-400 text-sm font-medium mt-0.5">Official System Installation</p>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-zinc-500 hover:text-white transition-colors p-1 bg-white/5 rounded-full"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mt-7 relative z-10">
                    <div className="bg-black/40 rounded-2xl p-4 border border-[#E5D5B3]/10 mb-6 font-mono">
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>PACKAGE_INSTALLER_READY</span>
                        </div>
                    </div>

                    <button
                        onClick={handleInstallClick}
                        className="w-full py-4.5 bg-[#E5D5B3] hover:bg-[#D4C4A2] text-black font-black text-lg rounded-2xl transition-all active:scale-[0.97] shadow-[0_12px_24px_-10px_rgba(229,213,179,0.4)] flex items-center justify-center gap-3 group"
                    >
                        <svg className="w-6 h-6 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        INSTALL APP
                    </button>

                    <p className="text-[10px] text-zinc-500 text-center mt-4 font-bold tracking-widest uppercase opacity-50">
                        TRUSTED SOURCE • APK INSTALLATION
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
