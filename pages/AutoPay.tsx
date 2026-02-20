
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Repeat, Plus, Trash2, Calendar, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { UserProfile, UserSubscription } from '../types';
import { getUserSubscriptions, cancelSubscription } from '../services/db';

interface Props {
    profile: UserProfile | null;
}

const AutoPay: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            fetchSubscriptions();
        }
    }, [profile]);

    const fetchSubscriptions = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const subs = await getUserSubscriptions(profile.uid);
            setSubscriptions(subs);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (subId: string) => {
        if (!window.confirm("Are you sure you want to cancel this subscription?")) return;
        try {
            await cancelSubscription(subId);
            setSubscriptions(prev => prev.filter(s => s.id !== subId));
        } catch (error) {
            console.error("Error cancelling subscription:", error);
        }
    };

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
                                            <h4 className="font-black text-white tracking-tight">{sub.planName}</h4>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{sub.merchantStellarId}</p>
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
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Next Pay: <span className="text-zinc-400">{sub.nextPaymentDate?.seconds ? new Date(sub.nextPaymentDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span></p>
                                    </div>
                                    <button
                                        onClick={() => handleCancel(sub.id)}
                                        className="p-2 text-rose-500/40 hover:text-rose-500 transition-colors"
                                    >
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
