
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Repeat, ArrowRight, Loader2, AlertCircle, CheckCircle2, Sparkles, Calendar } from 'lucide-react';
import { getSubscriptionPlan, createUserSubscription } from '../services/db';
import { SubscriptionPlan } from '../types';
import { useAuth } from '../context/AuthContext';

const Subscribe: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, profile } = useAuth();

    const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subscribing, setSubscribing] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const loadPlan = async () => {
            if (!planId) {
                setError('Invalid plan link');
                setLoading(false);
                return;
            }

            try {
                const planData = await getSubscriptionPlan(planId);
                if (planData) {
                    setPlan(planData);
                } else {
                    setError('Subscription plan not found');
                }
            } catch (e) {
                setError('Failed to load plan details');
            }
            setLoading(false);
        };

        loadPlan();
    }, [planId]);

    const handleSubscribe = async () => {
        if (!profile || !plan) return;

        setSubscribing(true);
        try {
            // Calculate next payment date based on frequency
            const nextDate = new Date();
            if (plan.frequency === 'minutely') nextDate.setMinutes(nextDate.getMinutes() + 1);
            else if (plan.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (plan.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            else if (plan.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

            await createUserSubscription({
                planId: plan.id,
                planName: plan.name,
                userId: profile.uid,
                userName: profile.displayName || profile.stellarId.split('@')[0],
                userStellarId: profile.stellarId,
                merchantId: plan.merchantId,
                merchantStellarId: plan.merchantStellarId,
                amount: plan.amount,
                frequency: plan.frequency,
                nextPaymentDate: nextDate,
                status: 'active'
            });

            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Subscription failed');
        }
        setSubscribing(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
                <div className="w-20 h-20 bg-[#E5D5B3] rounded-3xl flex items-center justify-center text-black mb-6">
                    <Repeat size={32} />
                </div>
                <h1 className="text-2xl font-black mb-2">Subscribe to Plan</h1>
                <p className="text-zinc-400 text-center mb-8">Please login to setup Autopay for this plan.</p>
                <button
                    onClick={() => navigate('/login')}
                    className="w-full max-w-xs py-4 gold-gradient text-black font-black rounded-2xl"
                >
                    Login to Continue
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 size={40} className="text-[#E5D5B3] animate-spin" />
            </div>
        );
    }

    if (error && !success) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-red-400" />
                </div>
                <h1 className="text-xl font-black mb-2 text-center">{error}</h1>
                <button
                    onClick={() => navigate('/scan')}
                    className="mt-6 px-8 py-3 bg-white/10 rounded-2xl font-bold"
                >
                    Try Scanning Again
                </button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                </div>
                <h1 className="text-2xl font-black mb-2 text-center">Subscription Active!</h1>
                <p className="text-zinc-400 text-center mb-8">
                    Autopay has been setup for <span className="text-white font-bold">{plan?.name}</span>.
                    Next payment of <span className="text-[#E5D5B3] font-bold">₹{plan?.amount}</span> is scheduled.
                </p>
                <button
                    onClick={() => navigate('/autopay')}
                    className="w-full max-w-xs py-4 gold-gradient text-black font-black rounded-2xl shadow-xl"
                >
                    View Subscriptions
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white px-6 py-12">
            <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles size={16} className="text-[#E5D5B3]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subscription Plan</span>
                </div>
                <h1 className="text-3xl font-black">Confirm Autopay</h1>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 rounded-[2.5rem] p-8 mb-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#E5D5B3]/5 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-[#E5D5B3]/10 flex items-center justify-center border border-[#E5D5B3]/20">
                            <Repeat size={28} className="text-[#E5D5B3]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">{plan?.name}</h2>
                            <p className="text-zinc-500 text-sm">{plan?.merchantName}</p>
                        </div>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Amount</span>
                            <span className="text-2xl font-black text-[#E5D5B3]">₹{plan?.amount}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Frequency</span>
                            <span className="text-lg font-black capitalize text-white">{plan?.frequency}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Merchant ID</span>
                            <span className="text-sm font-bold text-zinc-300">{plan?.merchantStellarId}</span>
                        </div>
                    </div>

                    <p className="text-zinc-500 text-sm leading-relaxed mb-8 italic">
                        "{plan?.description}"
                    </p>
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 mb-10 flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                    <Calendar size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white mb-1">Automatic Payments</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">By confirming, you authorize StellarPay to automatically deduct ₹{plan?.amount} {plan?.frequency} from your wallet.</p>
                </div>
            </div>

            <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full py-5 gold-gradient text-black font-black rounded-2xl shadow-xl shadow-[#E5D5B3]/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg"
            >
                {subscribing ? (
                    <Loader2 size={24} className="animate-spin" />
                ) : (
                    <>
                        <ArrowRight size={24} />
                        Confirm & Subscribe
                    </>
                )}
            </button>

            <button
                onClick={() => navigate('/scan')}
                className="w-full mt-4 py-4 text-zinc-500 font-bold text-sm uppercase tracking-widest"
            >
                Cancel
            </button>
        </div>
    );
};

export default Subscribe;
