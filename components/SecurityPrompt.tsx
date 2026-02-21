
import React from 'react';
import { Shield, Lock, Fingerprint, ArrowRight, X } from 'lucide-react';

interface SecurityPromptProps {
    onClose: () => void;
    onSetup: () => void;
    type: 'PIN' | 'BIOMETRIC';
}

const SecurityPrompt: React.FC<SecurityPromptProps> = ({ onClose, onSetup, type }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-gradient-to-br from-zinc-900 to-black rounded-[2.5rem] border border-white/10 shadow-[0_25px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Visual Flair */}
                <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-50" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#E5D5B3]/5 rounded-full blur-[60px]" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-[#E5D5B3]/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative group">
                        <div className="absolute inset-0 bg-[#E5D5B3]/20 rounded-[2.5rem] blur-xl group-hover:blur-2xl transition-all" />
                        {type === 'PIN' ? (
                            <Lock size={40} className="text-[#E5D5B3] relative z-10" />
                        ) : (
                            <Fingerprint size={40} className="text-[#E5D5B3] relative z-10" />
                        )}
                    </div>

                    <h2 className="text-2xl font-black mb-4 tracking-tight leading-tight">
                        Secure Your <br /> Payments
                    </h2>

                    <p className="text-zinc-500 text-sm leading-relaxed mb-10 px-2">
                        {type === 'PIN'
                            ? "Protect your funds with a 4-digit Security PIN. Required for every outgoing transaction."
                            : "Enable Biometric Login for ultra-fast and secure payment confirmations."
                        }
                    </p>

                    <div className="w-full space-y-4">
                        <button
                            onClick={onSetup}
                            className="w-full py-5 gold-gradient text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[#E5D5B3]/20 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                        >
                            <Shield size={18} />
                            Setup Now
                            <ArrowRight size={18} />
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-4 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-zinc-400 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>

                {/* Footer Badge */}
                <div className="bg-white/5 py-4 border-t border-white/5 flex items-center justify-center gap-2">
                    <Shield size={12} className="text-emerald-500/50" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Encrypted via Stellar Protocol</span>
                </div>
            </div>
        </div>
    );
};

export default SecurityPrompt;
