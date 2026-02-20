
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Shield, TrendingUp, History, Info, Sparkles, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { getBalance } from '../services/stellar';
import { getLivePrice } from '../services/priceService';
import { applyGullakYield } from '../services/db';
import { useNetwork } from '../context/NetworkContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    profile: UserProfile | null;
}

const GullakPage: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const { isMainnet, networkName } = useNetwork();
    const [balance, setBalance] = useState<string>('0.00');
    const [xlmRate, setXlmRate] = useState<number>(15.02);
    const [loading, setLoading] = useState(true);
    const [justYielded, setJustYielded] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (profile?.uid) {
                // Apply daily yield bonus logic
                const bonus = await applyGullakYield(profile.uid);
                if (bonus) setJustYielded(bonus);

                if (profile.gullakPublicKey) {
                    try {
                        const [balData, rate] = await Promise.all([
                            getBalance(profile.gullakPublicKey).catch(err => {
                                return { total: '0.00', spendable: '0.00', reserve: '1.00' };
                            }),
                            getLivePrice('stellar')
                        ]);

                        const totalBal = typeof balData === 'string' ? balData : (balData as any).total || '0.00';
                        setBalance(totalBal);
                        setXlmRate(rate);
                    } catch (e) {
                        console.error('Error loading Gullak data:', e);
                    }
                }
            }
            setLoading(false);
        };
        loadData();
    }, [profile]);

    if (!profile) return null;

    const inrValue = parseFloat(balance) * xlmRate;

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 relative overflow-hidden">
            <AnimatePresence>
                {justYielded && (
                    <motion.div
                        initial={{ y: -100, x: '-50%', opacity: 0 }}
                        animate={{ y: 20, x: '-50%', opacity: 1 }}
                        exit={{ y: -100, x: '-50%', opacity: 0 }}
                        className="fixed top-0 left-1/2 z-[100] bg-emerald-500 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2"
                    >
                        <Sparkles size={16} />
                        Yield Collected: +₹{justYielded.toFixed(4)}
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E5D5B3]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E5D5B3]/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="pt-10 px-6 flex items-center justify-between mb-12 relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all shadow-xl active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-black tracking-tight italic text-zinc-100">My Gullak</h1>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#E5D5B3] opacity-60">Digital Savings</p>
                </div>
                <div className="w-12"></div>
            </div>

            {/* Main Savings Card */}
            <div className="px-6 mb-10 relative z-10">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative"
                >
                    {/* Floating Piggy Icon Aura */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#E5D5B3]/10 blur-3xl rounded-full"></div>

                    <div className="relative bg-zinc-900/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 flex flex-col items-center shadow-2xl overflow-hidden">
                        {/* Internal Accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16"></div>

                        <div className="w-20 h-20 bg-gradient-to-b from-[#E5D5B3]/20 to-[#E5D5B3]/5 rounded-3xl flex items-center justify-center text-[#E5D5B3] mb-8 border border-[#E5D5B3]/20 shadow-inner">
                            <PiggyBank size={40} className="drop-shadow-lg" />
                        </div>

                        <span className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-4 opacity-80">Total Savings</span>

                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[#E5D5B3] text-4xl font-black opacity-30 italic">₹</span>
                            <h2 className="text-7xl font-black tracking-tighter text-white">
                                {loading ? '...' : (profile.totalSavingsINR || 0).toLocaleString('en-IN')}
                            </h2>
                        </div>

                        {/* Yield Highlight */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <Sparkles size={14} className="opacity-80" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Yield Earned</span>
                            </div>
                            <p className="text-sm font-black text-emerald-400 italic">
                                +₹{(profile.totalYieldEarnedINR || 0).toFixed(4)}
                            </p>
                        </div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-inner"
                        >
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                                {parseFloat(balance).toFixed(2)} XLM SAVED
                            </span>
                        </motion.div>

                        <div className="mt-10 pt-10 border-t border-white/5 w-full flex flex-col gap-4">
                            <div className="flex flex-col items-center gap-1 opacity-40">
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Gullak Address</p>
                                <p className="text-[9px] font-medium text-zinc-300">
                                    {profile.gullakPublicKey?.substring(0, 12)}...{profile.gullakPublicKey?.substring(44)}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="px-6 grid grid-cols-2 gap-5 mb-10 relative z-10">
                <div className="bg-zinc-900/20 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-xl group hover:border-[#E5D5B3]/10 transition-all">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/10 shadow-inner">
                        <Shield size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Asset Vault</p>
                    <p className="text-white font-black text-sm">100% SECURE</p>
                </div>
                <div className="bg-zinc-900/20 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-xl group hover:border-[#E5D5B3]/10 transition-all">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/10 shadow-inner">
                        <Sparkles size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Interest</p>
                    <p className="text-white font-black text-sm">STREAK YIELD</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="px-6 mb-12 relative z-10">
                <div className="bg-[#E5D5B3]/5 backdrop-blur-md border border-[#E5D5B3]/10 rounded-[2rem] p-8 flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E5D5B3]/10 flex items-center justify-center text-[#E5D5B3] flex-shrink-0">
                        <Info size={24} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#E5D5B3] mb-2">How it works</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-bold opacity-80 uppercase tracking-tight">
                            Every transaction rounds up to the nearest ₹10. This amount is automatically diverted to your separate Gullak vault, building protocol yield silently.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-8 z-40">
                <button
                    onClick={() => navigate('/withdraw')}
                    className="w-full gold-gradient text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(229,213,179,0.25)] active:scale-[0.96] transition-all flex items-center justify-center gap-3 hover:brightness-110"
                >
                    <PiggyBank size={18} strokeWidth={2.5} />
                    Withdraw Savings
                </button>
            </div>
        </div>
    );
};

export default GullakPage;
