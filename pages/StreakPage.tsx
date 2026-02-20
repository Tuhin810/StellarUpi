
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StreakPage: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [viewDate, setViewDate] = useState(new Date());

    if (!profile) return null;

    const currentStreak = profile.currentStreak || 0;
    const streakLevel = profile.streakLevel || 'orange';
    const streakHistory = profile.streakHistory || [];
    const createdAt = profile.createdAt ? new Date(profile.createdAt) : new Date();

    // Color config
    const configs = {
        orange: { color: '#FF6B00', glow: 'rgba(255, 107, 0, 0.4)' },
        blue: { color: '#00D1FF', glow: 'rgba(0, 209, 255, 0.4)' },
        purple: { color: '#CC00FF', glow: 'rgba(204, 0, 255, 0.4)' }
    };
    const config = configs[streakLevel];

    // Calendar Calculations
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    const isPrevDisabled = currentMonth === createdAt.getMonth() && currentYear === createdAt.getFullYear();
    const isNextDisabled = currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

    const changeMonth = (delta: number) => {
        const nextDate = new Date(currentYear, currentMonth + delta, 1);
        setViewDate(nextDate);
    };

    // Check if a specific date is in streak history
    const isDayInHistory = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return streakHistory.includes(dateStr);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 blur-[100px] rounded-full opacity-10" style={{ backgroundColor: config.color }} />

            {/* Header */}
            <div className="flex items-center justify-between p-4 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                    <X size={20} className="text-zinc-400" />
                </button>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Savings Streak</div>
                <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <Share2 size={20} className="text-zinc-400" />
                </button>
            </div>

            {/* Main Streak Display - Scaled Down */}
            <div className="flex-1 flex flex-col items-center pt-4 px-6 overflow-y-auto pb-24">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative mb-6"
                >
                    <div
                        className="w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center relative"
                        style={{ borderColor: `${config.color}33` }}
                    >
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="64" cy="64" r="60"
                                fill="none"
                                stroke={config.color}
                                strokeWidth="4"
                                strokeDasharray="377"
                                strokeDashoffset={377 - (377 * Math.min(currentStreak, 30) / 30)}
                                className="opacity-80"
                            />
                        </svg>

                        <Flame size={32} fill={config.color} stroke={config.color} />
                        <span className="text-3xl font-black mt-1 leading-none">{currentStreak}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Days</span>
                    </div>

                    <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border border-white/10 text-[8px] font-black uppercase tracking-widest bg-zinc-900"
                        style={{ color: config.color }}
                    >
                        {streakLevel} Status
                    </div>
                </motion.div>

                <h1 className="text-xl font-black text-center mb-1">Keep up your streak!</h1>
                <p className="text-zinc-500 text-xs text-center mb-6 max-w-[200px]">
                    {currentStreak > 0
                        ? `You've saved for ${currentStreak} days in a row! Keep it going.`
                        : "Start your savings streak today!"}
                </p>

                {/* Calendar View - More Compact */}
                <div className="w-full max-w-[320px] bg-zinc-900/40 rounded-[24px] border border-white/5 p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <button
                            onClick={() => changeMonth(-1)}
                            disabled={isPrevDisabled}
                            className={`p-1 transition-colors ${isPrevDisabled ? 'text-zinc-800' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{monthNames[currentMonth]} {currentYear}</span>
                        <button
                            onClick={() => changeMonth(1)}
                            disabled={isNextDisabled}
                            className={`p-1 transition-colors ${isNextDisabled ? 'text-zinc-800' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-y-4">
                        {weekDays.map((day, i) => (
                            <div key={i} className="text-center text-[8px] font-black text-zinc-600">
                                {day}
                            </div>
                        ))}

                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const hasStreak = isDayInHistory(dayNum);
                            const isToday = dayNum === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

                            return (
                                <div key={dayNum} className="flex items-center justify-center relative h-7">
                                    {hasStreak ? (
                                        <div className="relative group">
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center relative z-10"
                                                style={{ backgroundColor: `${config.color}22`, border: `1px solid ${config.color}44` }}
                                            >
                                                <Flame
                                                    size={12}
                                                    fill={config.color}
                                                    stroke={config.color}
                                                />
                                            </div>
                                            <span
                                                className="absolute -bottom-1 -right-1 text-[6px] font-black w-3 h-3 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"
                                                style={{ color: config.color }}
                                            >
                                                {dayNum}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className={`text-[10px] font-bold ${isToday ? 'text-white' : 'text-zinc-700'}`}>
                                            {dayNum}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend - Smaller */}
                <div className="mt-6 flex gap-4 text-[8px] font-black uppercase tracking-widest text-zinc-600">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full border border-white/10" />
                        <span>Missed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                        <span>Saved</span>
                    </div>
                </div>
            </div>

            {/* Bottom Button - Fixed at bottom, scaled down */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                <button
                    onClick={() => navigate('/gullak')}
                    className="w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.15em] transition-all bg-[#FF6B00] text-black shadow-lg shadow-[#FF6B00]/10 hover:scale-[1.01] active:scale-[0.98]"
                    style={{ backgroundColor: config.color }}
                >
                    Go to My Gullak
                </button>
            </div>
        </div>
    );
};

export default StreakPage;
