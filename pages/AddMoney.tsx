
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, TrendingUp, Zap, AlertCircle, Wallet, CreditCard, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { getBalance } from '../services/stellar';
import { openBuyWidget, getXlmRate } from '../services/onramp';
import { useNetwork } from '../context/NetworkContext';

interface Props {
    profile: UserProfile | null;
}

const AddMoney: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const { isMainnet, networkName } = useNetwork();
    const [balance, setBalance] = useState<string>('0.00');
    const [xlmRate, setXlmRate] = useState<number>(8.42);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (profile) {
                try {
                    const [bal, rate] = await Promise.all([
                        getBalance(profile.publicKey),
                        getXlmRate()
                    ]);
                    setBalance(bal);
                    setXlmRate(rate);
                } catch (e) {
                    console.error('Error loading data:', e);
                }
            }
            setLoading(false);
        };
        loadData();
    }, [profile]);

    const xlmToInr = parseFloat(balance) * xlmRate;

    const handleBuyXLM = () => {
        if (!profile) return;
        openBuyWidget({
            walletAddress: profile.publicKey,
        });
    };

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white">
            {/* Header */}
            <div className="pt-5 px-6 flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold">Add Money</h1>
                <div className="w-12"></div>
            </div>

            {/* Network Badge */}
            <div className="px-6 mb-8">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isMainnet
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                    <Zap size={12} />
                    {networkName}
                </div>
            </div>

            {/* Main Balance Card - Premium Design */}
            <div className="px-6 mb-8">
                <div className="relative overflow-hidden">
                    {/* Glow Effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#E5D5B3]/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

                    <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8">
                        {/* Wallet Icon */}
                        <div className="w-14 h-14 gold-gradient rounded-2xl flex items-center justify-center text-black mb-6 shadow-lg shadow-[#E5D5B3]/20">
                            <Wallet size={24} />
                        </div>

                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Your Balance</p>

                        <div className="flex items-baseline gap-3 mb-2">
                            <span className="text-5xl font-black tracking-tight">{loading ? '...' : parseFloat(balance).toFixed(2)}</span>
                            <span className="text-zinc-400 font-bold text-xl">XLM</span>
                        </div>

                        <p className="text-[#E5D5B3] text-lg font-semibold">
                            ≈ ₹{loading ? '...' : xlmToInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>

                        {/* Rate Badge */}
                        <div className="mt-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 w-fit">
                            <TrendingUp size={16} className="text-emerald-400" />
                            <span className="text-emerald-400 text-sm font-bold">1 XLM = ₹{xlmRate.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testnet Warning */}
            {!isMainnet && (
                <div className="px-6 mb-8">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                        <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-400 font-bold text-sm mb-1">Testnet Mode</p>
                            <p className="text-zinc-400 text-xs">
                                You're on Testnet. Switch to Mainnet in settings to buy real XLM.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Buy Button */}
            <div className="px-6 mb-10">
                <button
                    onClick={handleBuyXLM}
                    disabled={!isMainnet}
                    className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isMainnet
                        ? 'gold-gradient text-black shadow-xl shadow-[#E5D5B3]/20'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                >
                    <Plus size={22} />
                    Buy XLM with INR
                </button>

                {!isMainnet && (
                    <p className="text-center text-zinc-600 text-xs mt-4">
                        Switch to Mainnet to enable purchases
                    </p>
                )}
            </div>

            {/* Payment Methods */}
            <div className="px-6 mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Supported Payment Methods</h3>
                <div className="flex gap-3">
                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Zap size={18} className="text-purple-400" />
                        </div>
                        <span className="text-xs font-bold text-zinc-300">UPI</span>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <CreditCard size={18} className="text-blue-400" />
                        </div>
                        <span className="text-xs font-bold text-zinc-300">Card</span>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Building2 size={18} className="text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-zinc-300">Bank</span>
                    </div>
                </div>
            </div>

            {/* How it works - Compact */}
            <div className="px-6 pb-12">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">How it works</h3>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                    <div className="space-y-3">
                        {[
                            { step: '1', text: 'Click "Buy XLM with INR"' },
                            { step: '2', text: 'Complete KYC (one-time)' },
                            { step: '3', text: 'Pay via UPI/Card/Bank' },
                            { step: '4', text: 'XLM sent to your wallet' },
                        ].map((item, index) => (
                            <div key={item.step} className="flex items-center gap-4">
                                <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-black font-black text-xs">
                                    {item.step}
                                </div>
                                <p className="text-zinc-300 text-sm font-medium flex-1">{item.text}</p>
                                {index < 3 && <div className="text-zinc-700">→</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMoney;
