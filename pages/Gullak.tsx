
import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, PiggyBank, Zap, Flame, ArrowUpRight, ArrowDownLeft, Clock, ChevronRight, Sparkles, Target, Calendar, Shield, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { getBalance } from '../services/stellar';
import { getLivePrice } from '../services/priceService';
import { applyGullakYield, getTransactions } from '../services/db';
import { useNetwork } from '../context/NetworkContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    profile: UserProfile | null;
}

const GullakPage: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const { isMainnet } = useNetwork();
    const [balance, setBalance] = useState<string>('0.00');
    const [xlmRate, setXlmRate] = useState<number>(15.02);
    const [loading, setLoading] = useState(true);
    const [justYielded, setJustYielded] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

    useEffect(() => {
        const loadData = async () => {
            if (profile?.uid) {
                const bonus = await applyGullakYield(profile.uid);
                if (bonus) {
                    setJustYielded(bonus);
                    setTimeout(() => setJustYielded(null), 4000);
                }

                if (profile.gullakPublicKey) {
                    try {
                        const [balData, rate] = await Promise.all([
                            getBalance(profile.gullakPublicKey).catch(() => '0.00'),
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

    const totalSavings = profile.totalSavingsINR || 0;
    const totalYield = profile.totalYieldEarnedINR || 0;
    const streak = profile.currentStreak || 0;
    const streakLevel = profile.streakLevel || 'orange';

    const streakConfig = {
        orange: { label: 'Starter', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', apr: '3.6%', rate: '0.01%/day', next: 5, nextLabel: 'Blue' },
        blue: { label: 'Saver', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', apr: '11%', rate: '0.03%/day', next: 15, nextLabel: 'Purple' },
        purple: { label: 'Pro Saver', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', apr: '18%', rate: '0.05%/day', next: 0, nextLabel: 'MAX' },
    };

    const cfg = streakConfig[streakLevel];
    const progressToNext = cfg.next > 0 ? Math.min(100, (streak / cfg.next) * 100) : 100;

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 relative overflow-hidden">
            {/* Yield Toast */}
            <AnimatePresence>
                {justYielded && (
                    <motion.div
                        initial={{ y: -100, x: '-50%', opacity: 0 }}
                        animate={{ y: 60, x: '-50%', opacity: 1 }}
                        exit={{ y: -100, x: '-50%', opacity: 0 }}
                        className="fixed top-0 left-1/2 z-[100] bg-emerald-500 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2"
                    >
                        <Sparkles size={16} />
                        Daily Yield: +₹{justYielded.toFixed(4)}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient Glow */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-[#E5D5B3]/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-emerald-500/3 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="pt-14 px-6 flex items-center justify-between relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                    <img src="/gullak.png" className="w-5 h-5 object-contain" alt="Gullak" />
                    <span className="text-sm font-black tracking-tight uppercase">Gullak</span>
                </div>
                <div className="w-11" />
            </div>

            {/* ═══ BALANCE HERO ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pt-8 pb-4 relative z-10"
            >
                <div className="flex flex-col items-center">
                    {/* Animated Ring */}
                    <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                        {/* Background Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 176 176">
                            <circle cx="88" cy="88" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                            <motion.circle
                                cx="88" cy="88" r="80" fill="none"
                                stroke="url(#goldGradient)" strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={502.65}
                                initial={{ strokeDashoffset: 502.65 }}
                                animate={{ strokeDashoffset: 502.65 * (1 - Math.min(1, totalSavings / 10000)) }}
                                transition={{ duration: 2, ease: 'easeOut' }}
                            />
                            <defs>
                                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#D4874D" />
                                    <stop offset="50%" stopColor="#E5C36B" />
                                    <stop offset="100%" stopColor="#F0D98A" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Center Content */}
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-1">Total Saved</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[#E5D5B3]/40 text-2xl font-black">₹</span>
                                <span className="text-4xl font-black tracking-tight">
                                    {loading ? '...' : totalSavings.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Yield Earned Badge */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/15 rounded-full mb-2"
                    >
                        <TrendingUp size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                            +₹{totalYield.toFixed(2)} yield earned
                        </span>
                    </motion.div>

                    {/* XLM Balance */}
                    <p className="text-[10px] text-zinc-600 font-bold">
                        {parseFloat(balance).toFixed(4)} XLM • ₹{(parseFloat(balance) * xlmRate).toFixed(2)} value
                    </p>
                </div>
            </motion.div>

            {/* ═══ STREAK TIER CARD ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-6 mb-6 relative z-10"
            >
                <div className={`${cfg.bg} border ${cfg.border} rounded-3xl p-5 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                                <Flame size={20} className={cfg.color} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-black ${cfg.color}`}>{cfg.label} Tier</span>
                                    <span className="text-[8px] font-bold text-zinc-600 px-1.5 py-0.5 bg-white/5 rounded-md uppercase">{cfg.apr} APR</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                                    {streak} day streak • {cfg.rate}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-2xl font-black ${cfg.color}`}>{streak}</span>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Days</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {cfg.next > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Next: {cfg.nextLabel} Tier</span>
                                <span className="text-[9px] font-bold text-zinc-500">{streak}/{cfg.next} days</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: 'linear-gradient(90deg, #D4874D, #E5C36B, #F0D98A)' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNext}%` }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    )}
                    {cfg.next === 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <Sparkles size={12} className="text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-400">Max tier reached! Earning highest yield rate.</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ═══ TAB SWITCHER ═══ */}
            <div className="px-6 mb-5 relative z-10">
                <div className="flex bg-zinc-900/50 border border-white/5 rounded-2xl p-1">
                    {(['overview', 'history'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-white/10 text-white'
                                : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                        >
                            {tab === 'overview' ? 'Overview' : 'Activity'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-6 relative z-10"
                >
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                            <Target size={16} className="text-[#E5D5B3] mb-2 opacity-60" />
                            <span className="text-lg font-black">{streak}</span>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mt-0.5">Day Streak</span>
                        </div>
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                            <TrendingUp size={16} className="text-emerald-400 mb-2 opacity-60" />
                            <span className="text-lg font-black text-emerald-400">+{totalYield.toFixed(1)}</span>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mt-0.5">Yield ₹</span>
                        </div>
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                            <Shield size={16} className="text-blue-400 mb-2 opacity-60" />
                            <span className="text-lg font-black">{cfg.apr}</span>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mt-0.5">APR</span>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-5 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Gift size={14} className="text-[#E5D5B3]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3]">How Gullak Works</span>
                        </div>

                        <div className="space-y-4">
                            {[
                                { step: '01', title: 'Pay Normally', desc: 'Make any UPI payment through Ching Pay', icon: ArrowUpRight },
                                { step: '02', title: 'Auto Round-up', desc: 'Amount rounds up to nearest ₹10 automatically', icon: Sparkles },
                                { step: '03', title: 'Earn Yield', desc: `${cfg.apr} APR based on your ${streak}-day streak`, icon: TrendingUp },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                        <span className="text-[9px] font-black text-[#E5D5B3]">{item.step}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-white mb-0.5">{item.title}</p>
                                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gullak Address */}
                    {profile.gullakPublicKey && (
                        <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <Shield size={14} className="text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Vault Address</p>
                                <p className="text-[10px] text-zinc-400 font-mono truncate">
                                    {profile.gullakPublicKey}
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══ HISTORY TAB ═══ */}
            {activeTab === 'history' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-6 relative z-10"
                >
                    {(profile.streakHistory && profile.streakHistory.length > 0) ? (
                        <div className="space-y-3">
                            {profile.streakHistory.slice().reverse().slice(0, 20).map((date: string, i: number) => (
                                <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <ArrowDownLeft size={16} className="text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-white">Chillar Saved</p>
                                        <p className="text-[10px] text-zinc-600 font-medium">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-emerald-400">+₹</p>
                                        <p className="text-[9px] text-zinc-600 font-bold">Round-up</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center mb-4">
                                <Clock size={24} className="text-zinc-700" />
                            </div>
                            <p className="text-sm font-bold text-zinc-500 mb-1">No savings yet</p>
                            <p className="text-xs text-zinc-700 max-w-[200px]">
                                Make your first Chillar-enabled payment to start saving
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══ STICKY BOTTOM CTA ═══ */}
            <div className="fixed bottom-0 left-0 right-0 z-40 p-6 pb-10 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
                <button
                    onClick={() => navigate('/withdraw')}
                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 text-black"
                    style={{ background: 'linear-gradient(90deg, #D4874D 0%, #E5C36B 50%, #F0D98A 100%)' }}
                >
                    <img src="/gullak.png" className="w-6 h-6 object-contain" alt="Gullak" />
                    Withdraw Savings
                </button>
            </div>
        </div>
    );
};

export default GullakPage;
