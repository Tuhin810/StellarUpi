
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDownToLine, TrendingDown, Zap, AlertCircle, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { getBalance } from '../services/stellar';
import { openSellWidget, getXlmRate } from '../services/transak';
import { useNetwork } from '../context/NetworkContext';

interface Props {
    profile: UserProfile | null;
}

const Withdraw: React.FC<Props> = ({ profile }) => {
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
    const hasBalance = (parseFloat(balance) * xlmRate) >= 10; // Minimum ₹10 to withdraw

    const handleSellXLM = () => {
        if (!profile || !hasBalance) return;
        openSellWidget({
            walletAddress: profile.publicKey,
            partnerOrderId: `Ching Pay-sell-${Date.now()}`
        });
    };

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white pb-32">
            {/* Header */}
            <div className="pt-5 px-6 flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-semibold">Withdraw</h1>
                <div className="w-12"></div>
            </div>

            {/* Network Badge */}
            <div className="px-6 mb-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isMainnet
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                    <Zap size={12} />
                    {networkName}
                </div>
            </div>

            {/* Balance Card */}
            <div className="px-6 mb-8">
                <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Available to Withdraw</p>
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-black">{loading ? '...' : parseFloat(balance).toFixed(2)}</span>
                        <span className="text-zinc-500 font-bold">XLM</span>
                    </div>
                    <p className="text-emerald-400 text-sm font-medium">
                        ≈ ₹{loading ? '...' : xlmToInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Rate Info */}
            <div className="px-6 mb-8">
                <div className="flex items-center gap-3 bg-zinc-900/30 border border-white/5 rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                        <TrendingDown size={18} className="text-rose-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Current Rate</p>
                        <p className="text-white font-bold">1 XLM = ₹{xlmRate.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Warnings */}
            {!isMainnet && (
                <div className="px-6 mb-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                        <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-400 font-bold text-sm mb-1">Testnet Mode</p>
                            <p className="text-zinc-400 text-xs">
                                You're on Testnet. Switch to Mainnet in settings to withdraw real XLM.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {isMainnet && !hasBalance && (
                <div className="px-6 mb-6">
                    <div className="bg-zinc-800/50 border border-white/5 rounded-2xl p-4 flex gap-3">
                        <Wallet size={20} className="text-zinc-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-zinc-400 font-bold text-sm mb-1">Insufficient Balance</p>
                            <p className="text-zinc-500 text-xs">
                                Minimum ₹10 required to withdraw.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Button */}
            <div className="px-6">
                <button
                    onClick={handleSellXLM}
                    disabled={!isMainnet || !hasBalance}
                    className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isMainnet && hasBalance
                        ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                >
                    <ArrowDownToLine size={22} />
                    {hasBalance ? 'Withdraw to Bank' : `Min. ₹10 Required`}
                </button>

                {!isMainnet && (
                    <p className="text-center text-zinc-600 text-xs mt-4">
                        Switch to Mainnet to enable withdrawals
                    </p>
                )}
            </div>

            {/* How it works */}
            <div className="px-6 mt-12">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">How it works</h3>
                <div className="space-y-4">
                    {[
                        { step: '1', text: 'Click "Withdraw to Bank"' },
                        { step: '2', text: 'Enter the amount of XLM to sell' },
                        { step: '3', text: 'Add your bank account details' },
                        { step: '4', text: 'INR is sent to your bank (1-2 days)' },
                    ].map((item) => (
                        <div key={item.step} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-emerald-400 font-black text-sm">
                                {item.step}
                            </div>
                            <p className="text-zinc-400 text-sm font-medium">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default Withdraw;
