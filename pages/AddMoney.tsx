
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
    const [buyAmount, setBuyAmount] = useState<string>('500');

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
            amount: parseFloat(buyAmount)
        });
    };

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#E5D5B3]/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#C5B38F]/5 blur-[80px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="pt-8 px-6 flex items-center justify-between relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="w-11 h-11 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-2xl active:scale-95 transition-all text-zinc-300"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold tracking-tight">Add Money</h1>
                <div className="w-11"></div>
            </div>

            <div className="flex-1 px-6 pt-10 pb-32 overflow-y-auto no-scrollbar relative z-10">

                {/* Network Badge */}
                <div className="mb-8 flex justify-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isMainnet
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                        <Zap size={10} className={isMainnet ? 'fill-emerald-400' : 'fill-amber-400'} />
                        {networkName}
                    </div>
                </div>

                {/* Main Balance Card - Premium Design */}
                <div className="mb-10">
                    <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E5D5B3]/10 rounded-full blur-3xl" />

                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 gold-gradient rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#E5D5B3]/20">
                                <Wallet size={20} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Live Rate</p>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <TrendingUp size={12} className="text-emerald-400" />
                                    <span className="text-sm font-black text-zinc-300">₹{xlmRate.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Total Holdings</p>

                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-4xl font-black tracking-tighter text-white">
                                {loading ? '...' : parseFloat(balance).toFixed(2)}
                            </span>
                            <span className="text-zinc-500 font-black text-lg">XLM</span>
                        </div>

                        <p className="text-[#E5D5B3] font-black text-sm tracking-widest uppercase opacity-80">
                            ≈ ₹{loading ? '...' : xlmToInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Amount Selection */}
                <div className="mb-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-6 flex items-center gap-3">
                        Enter Amount to Buy
                        <div className="h-px flex-1 bg-white/5" />
                    </h3>

                    <div className="relative group mb-6">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-700 group-focus-within:text-[#E5D5B3] transition-colors">₹</span>
                        <input
                            type="number"
                            value={buyAmount}
                            onChange={(e) => setBuyAmount(e.target.value)}
                            className="w-full bg-zinc-900/40 border border-white/5 rounded-[2rem] py-8 pl-14 pr-8 text-4xl font-black text-white focus:outline-none focus:border-[#E5D5B3]/30 transition-all placeholder:text-zinc-900 tabular-nums"
                            placeholder="0"
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {['500', '1000', '2000', '5000'].map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setBuyAmount(amt)}
                                className={`py-4 rounded-2xl font-black text-xs transition-all active:scale-95 border ${buyAmount === amt
                                    ? 'gold-gradient text-black border-transparent'
                                    : 'bg-zinc-900/60 text-zinc-500 border-white/5 hover:border-white/10'
                                    }`}
                            >
                                ₹{amt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Buy Button */}
                <div className="mb-10">
                    <button
                        onClick={handleBuyXLM}
                        disabled={!isMainnet}
                        className={`w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isMainnet
                            ? 'gold-gradient text-black shadow-2xl shadow-[#E5D5B3]/20'
                            : 'bg-zinc-900/40 text-zinc-600 cursor-not-allowed border border-white/5'
                            }`}
                    >
                        <Plus size={18} />
                        Initiate Purchase
                    </button>

                    {!isMainnet && (
                        <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-relaxed">
                                Sandbox Mode Active. Please switch to Mainnet in profile settings to perform live transactions.
                            </p>
                        </div>
                    )}
                </div>

                {/* Payment Methods */}
                <div className="mb-12">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Supported Payment Methods</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Zap size={18} className="text-purple-400 fill-purple-400" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">UPI</span>
                        </div>
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <CreditCard size={18} className="text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Card</span>
                        </div>
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Building2 size={18} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bank</span>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="mb-12">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Process Protocol</h3>
                    <div className="space-y-4">
                        {[
                            { step: '01', text: 'Select Amount & Initialize' },
                            { step: '02', text: 'Verify Identity (KYC)' },
                            { step: '03', text: 'Fiat Remittance (UPI/IMPS)' },
                            { step: '04', text: 'On-Chain Fulfillment' },
                        ].map((item) => (
                            <div key={item.step} className="flex items-center gap-4 bg-zinc-900/20 p-4 rounded-2xl border border-white/[0.02]">
                                <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-black font-black text-[10px]">
                                    {item.step}
                                </div>
                                <p className="text-zinc-400 text-xs font-black uppercase tracking-widest flex-1">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMoney;
