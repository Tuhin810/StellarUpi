import React, { useState, useEffect } from 'react';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        if (isStandalone) return;

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        // For Android/Chrome
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show if not standalone
        if (isIOSDevice && !isStandalone) {
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-[#1A1A1A]/95 backdrop-blur-xl border border-[#E5D5B3]/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(229,213,179,0.1)] relative overflow-hidden">
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#E5D5B3]/5 to-transparent pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#050505] border border-[#E5D5B3]/20 p-2 flex items-center justify-center shadow-inner">
                        <img src="/icon-192.png" alt="StellarPay" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[#E5D5B3] font-bold text-lg leading-tight">Install StellarPay</h3>
                        <p className="text-zinc-400 text-sm">Add to home screen for the best experience</p>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-zinc-500 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mt-6 relative z-10">
                    {isIOS ? (
                        <div className="space-y-4">
                            <div className="bg-[#050505]/50 rounded-2xl p-4 border border-[#E5D5B3]/10">
                                <ol className="text-sm text-zinc-300 space-y-4">
                                    <li className="flex gap-3 items-start">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E5D5B3]/20 text-[#E5D5B3] flex items-center justify-center text-xs font-bold">1</span>
                                        <span><strong className="text-[#E5D5B3]">Open Safari:</strong> You must use the Safari browser (Chrome for iOS doesn't support "installing" web apps).</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E5D5B3]/20 text-[#E5D5B3] flex items-center justify-center text-xs font-bold">2</span>
                                        <span><strong className="text-[#E5D5B3]">Tap the Share Button:</strong> It’s the square icon with an arrow pointing up at the bottom center of the screen.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E5D5B3]/20 text-[#E5D5B3] flex items-center justify-center text-xs font-bold">3</span>
                                        <span><strong className="text-[#E5D5B3]">Scroll Down:</strong> Find the option that says <strong className="text-white">"Add to Home Screen"</strong>.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E5D5B3]/20 text-[#E5D5B3] flex items-center justify-center text-xs font-bold">4</span>
                                        <span><strong className="text-[#E5D5B3]">Confirm:</strong> Tap <strong className="text-white">"Add"</strong> in the top right corner.</span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className="w-full py-4 bg-[#E5D5B3] hover:bg-[#C5B38F] text-black font-bold rounded-2xl transition-all active:scale-[0.98] shadow-[0_10px_20px_-10px_rgba(229,213,179,0.3)] flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Install Now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
