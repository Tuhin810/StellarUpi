
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Gift,
    Trophy,
    Zap,
    Star,
    ChevronRight,
    Clock,
    Copy,
    Check,
    Flame,
    Utensils,
    ShoppingBag,
    Car,
    Ticket
} from 'lucide-react';

const Rewards: React.FC = () => {
    const navigate = useNavigate();
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('All');

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const categories = [
        { name: 'All', icon: <Flame size={14} /> },
        { name: 'Food', icon: <Utensils size={14} /> },
        { name: 'Shopping', icon: <ShoppingBag size={14} /> },
        { name: 'Travel', icon: <Car size={14} /> },
    ];

    const coupons = [
        {
            merchant: "Swiggy",
            code: "UJJIVAN125",
            discount: "₹125 OFF",
            desc: "On orders above ₹400",
            category: "Food",
            expiry: "Exp: 31 Jan",
            color: "bg-orange-500/10 text-orange-500",
            icon: <Utensils size={18} />
        },
        {
            merchant: "Zomato",
            code: "GET50",
            discount: "50% OFF",
            desc: "Up to ₹150 on first order",
            category: "Food",
            expiry: "Exp: 31 Jan",
            color: "bg-rose-500/10 text-rose-500",
            icon: <Utensils size={18} />
        },
        {
            merchant: "Uber",
            code: "GRAB50",
            discount: "FREE RIDE",
            desc: "Valid for first 3 rides",
            category: "Travel",
            expiry: "Limited",
            color: "bg-zinc-500/10 text-zinc-300",
            icon: <Car size={18} />
        },
        {
            merchant: "Amazon",
            code: "ION",
            discount: "5% OFF",
            desc: "On electronics & accessories",
            category: "Shopping",
            expiry: "2 days left",
            color: "bg-amber-500/10 text-amber-500",
            icon: <ShoppingBag size={18} />
        }
    ];

    const filteredCoupons = activeCategory === 'All'
        ? coupons
        : coupons.filter(c => c.category === activeCategory);

    const achievements = [
        {
            title: "Protocol Pioneer",
            desc: "Connect to the Stellar Mainnet",
            reward: "500 XLM",
            progress: 100,
            completed: true,
            icon: <Zap className="text-emerald-500" size={20} />
        },
        {
            title: "Wealth Builder",
            desc: "Hold > 1,000 XLM in your vault",
            reward: "2,000 XLM",
            progress: 65,
            completed: false,
            icon: <Trophy className="text-[#E5D5B3]" size={20} />
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white pb-32 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-5%] left-[-10%] w-[70%] h-[30%] bg-[#E5D5B3]/5 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]"></div>

            {/* Header */}
            <div className="relative z-20 pt-5 px-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-sm font-black uppercase tracking-[0.3em] opacity-80 text-center flex items-center gap-2">
                    <Ticket size={16} className="text-[#E5D5B3]" />
                    Reward Hub
                </h2>
                <div className="w-12"></div>
            </div>

            <div className="px-6 mt-8 relative z-10">
                {/* Main Card */}


                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2 mb-4">
                    {categories.map((cat, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat.name
                                ? 'bg-[#E5D5B3] text-black shadow-lg'
                                : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                                }`}
                        >
                            {cat.icon}
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Coupons */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between px-1 mb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3]">Global Brand Coupons</h3>
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">January 2026</span>
                    </div>

                    {filteredCoupons.map((coupon, i) => (
                        <div key={i} className={`relative h-32 w-full rounded-[1.5rem] overflow-hidden flex shadow-2xl transition-all active:scale-[0.98] group cursor-pointer ${coupon.merchant === 'Swiggy' ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                            coupon.merchant === 'Zomato' ? 'bg-gradient-to-r from-rose-600 to-rose-400' :
                                coupon.merchant === 'Uber' ? 'bg-gradient-to-r from-zinc-800 via-zinc-900 to-black' :
                                    'bg-gradient-to-r from-emerald-700 to-emerald-500'
                            }`}>
                            {/* Left Content */}
                            <div className="flex-1 p-5 flex flex-col justify-center relative z-10 text-white">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-0.5">Get up to</p>
                                <h2 className="text-3xl font-black tracking-tighter leading-tight mb-0.5">{coupon.discount}</h2>
                                <p className="text-[9px] font-bold opacity-70 mb-3 truncate pr-4">{coupon.desc}</p>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(coupon.code);
                                    }}
                                    className="w-fit flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-black transition-all hover:scale-105 active:scale-95 shadow-lg"
                                >
                                    {copiedCode === coupon.code ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="opacity-60" />}
                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none pt-0.5">
                                        {copiedCode === coupon.code ? 'Copied' : coupon.code}
                                    </span>
                                </button>
                            </div>

                            {/* Right Ticket Stub */}
                            <div className="w-24 relative flex items-center justify-center overflow-hidden">
                                {/* Perforated Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] border-l-2 border-dashed border-white/20 z-20"></div>

                                {/* Background Shape Overlay */}
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>

                                {/* Large Background Icon */}
                                <div className="relative z-10 opacity-30 group-hover:scale-120 group-hover:rotate-12 transition-transform duration-700">
                                    {React.cloneElement(coupon.icon as React.ReactElement<any>, { size: 44, strokeWidth: 1.5 })}
                                </div>

                                {/* Semi-circle punches (Ticket effect) */}
                                <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#0a0f0a] rounded-full z-30 shadow-inner"></div>
                            </div>

                            {/* Expiry Badge */}
                            <div className="absolute top-3 right-3 z-20">
                                <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-tighter bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 text-white/60">
                                    <Clock size={8} />
                                    {coupon.expiry}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


            </div>
        </div>
    );
};

export default Rewards;
