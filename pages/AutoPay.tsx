
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Repeat, Plus, Trash2, Calendar, Clock, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface AutoPayRecord {
    id: string;
    recipientName: string;
    recipientId: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    nextPayment: string;
    active: boolean;
}

interface Props {
    profile: UserProfile | null;
}

const AutoPay: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [subscriptions, setSubscriptions] = useState<AutoPayRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data for initial PoC
        setTimeout(() => {
            setSubscriptions([
                {
                    id: '1',
                    recipientName: 'Internet Bill',
                    recipientId: 'isp@stellar',
                    amount: 999,
                    frequency: 'monthly',
                    nextPayment: '2026-02-01',
                    active: true
                },
                {
                    id: '2',
                    recipientName: 'Netflix',
                    recipientId: 'netflix@stellar',
                    amount: 499,
                    frequency: 'monthly',
                    nextPayment: '2026-01-25',
                    active: true
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white pb-32">
            {/* Header */}
            <div className="pt-5 px-3 flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate("/")} className="p-2 text-zinc-400">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-3xl font-black tracking-tighter">AutoPay</h2>
                </div>
            </div>

            <div className="px-6 space-y-8">
                {/* Promo Card */}
                <div className="relative overflow-hidden bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl group active:scale-[0.98] transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={80} className="text-[#E5D5B3]" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-[#E5D5B3]/10 flex items-center justify-center mb-6 border border-[#E5D5B3]/20">
                            <Repeat size={24} className="text-[#E5D5B3]" />
                        </div>
                        <h3 className="text-xl font-black mb-2 tracking-tight">Recurring Payments</h3>
                        <p className="text-zinc-500 text-sm font-medium mb-6">Schedule your bills and subscriptions. Never miss a deadline with automated Stellar payments.</p>
                        <button className="flex items-center gap-2 bg-[#E5D5B3] text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                            <Plus size={16} /> Setup New Pay
                        </button>
                    </div>
                </div>

                {/* Subscriptions List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Subscriptions</p>
                        <span className="bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full text-[9px] font-black border border-white/5">{subscriptions.length} SET</span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                            <Clock size={40} className="animate-pulse mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Loading records...</p>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-dashed border-white/5">
                            <AlertCircle size={32} className="text-zinc-800 mx-auto mb-4" />
                            <p className="text-zinc-600 font-bold text-sm tracking-tight">No active AutoPay configs</p>
                        </div>
                    ) : (
                        subscriptions.map((sub) => (
                            <div key={sub.id} className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 group hover:bg-zinc-900 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 border border-white/5 group-hover:border-[#E5D5B3]/20 transition-all">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white tracking-tight">{sub.recipientName}</h4>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{sub.recipientId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-[#E5D5B3] tracking-tighter">₹{sub.amount}</p>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{sub.frequency}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-zinc-600" />
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Next Pay: <span className="text-zinc-400">{sub.nextPayment}</span></p>
                                    </div>
                                    <button className="p-2 text-rose-500/40 hover:text-rose-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutoPay;
