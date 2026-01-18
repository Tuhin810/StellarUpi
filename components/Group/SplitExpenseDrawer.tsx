
import React, { useState, useEffect } from 'react';
import { X, Check, Users, IndianRupee, PieChart, Activity, ChevronRight, AlertCircle } from 'lucide-react';
import { UserProfile, SplitGroup } from '../../types';
import { recordSplitExpense } from '../../services/db';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    group: SplitGroup;
    profile: UserProfile;
    memberProfiles: Record<string, UserProfile>;
}

type SplitMode = 'equal' | 'exact';

const SplitExpenseDrawer: React.FC<Props> = ({ isOpen, onClose, group, profile, memberProfiles }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<SplitMode>('equal');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

    // Initialize with all members selected on open
    useEffect(() => {
        if (isOpen) {
            setSelectedMembers(group.members);
            setMode('equal');
            setCustomAmounts({});
        }
    }, [isOpen, group.members]);

    const totalNum = parseFloat(amount || '0');
    const currentSplitTotal = mode === 'equal'
        ? totalNum
        : Object.values(customAmounts).reduce((acc, val) => acc + parseFloat(val || '0'), 0);

    const remaining = totalNum - currentSplitTotal;
    const isBalanced = mode === 'equal' || (totalNum > 0 && Math.abs(remaining) < 0.01);
    const isValid = totalNum > 0 && selectedMembers.length > 0 && isBalanced && description.trim().length > 0;

    const handleToggleMember = (mId: string) => {
        setSelectedMembers(prev =>
            prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
        );
    };

    const handleCustomAmountChange = (mId: string, val: string) => {
        setCustomAmounts(prev => ({ ...prev, [mId]: val.replace(/[^0-9.]/g, '') }));
    };

    const handleCreateSplit = async () => {
        if (!isValid || !group || !profile || loading) return;

        setLoading(true);
        try {
            const perPerson = totalNum / (selectedMembers.length || 1);

            const expenseData = {
                groupId: group.id,
                description,
                totalAmount: totalNum,
                paidBy: profile.stellarId,
                splitType: mode === 'equal' ? 'equal' : 'percentage',
                participants: selectedMembers.map(mId => ({
                    stellarId: mId,
                    amount: mode === 'equal' ? perPerson : parseFloat(customAmounts[mId] || '0'),
                    status: mId === profile.stellarId ? 'PAID' : 'PENDING'
                }))
            };

            await recordSplitExpense(expenseData as any);
            setAmount('');
            setDescription('');
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[110] transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-all duration-700" onClick={onClose}></div>

            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2rem] transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}


                style={{ maxHeight: '96vh' }}>

                {/* Visual Handle */}
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">New Split for {group.name}</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-12 space-y-10 no-scrollbar mt-4">

                    {/* Centered Amount Logic Area */}
                    <div className="relative py-8 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                        <div className="relative group w-full text-center">
                            <div className="inline-flex items-baseline justify-center relative bg-zinc-900/40 border border-white/5 rounded-2xl py-4 px-8 text-center font-bold 
                            text-sm outline-none focus:border-[#E5D5B3]/20 transition-all placeholder-zinc-800 italic">
                                <span className="text-4xl font-black text-[#E5D5B3] italic mr-4 opacity-50">₹</span>
                                <input
                                    autoFocus
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                    className="bg-transparent text-center text-4xl font-black text-white outline-none placeholder-zinc-900 italic transition-all w-[240px]"
                                />
                                <div className="absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E5D5B3]/20 to-transparent" />
                            </div>
                        </div>

                        {/* Description Input as a Sleek Pill */}
                        <div className="w-full max-w-[280px]">
                            <input
                                type="text"
                                placeholder={"What's the occasion?"}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-zinc-900/40 border-b border-white/5 rounded-2xl py-4 px-8 text-center font-bold text-sm outline-none focus:border-[#E5D5B3]/20 transition-all placeholder-zinc-800 italic"
                            />
                        </div>
                    </div>

                    {/* Mode Selection Chips */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setMode('equal')}
                            className={`px-8 py-3 rounded-2xl font-black text-[9px] uppercase   border ${mode === 'equal' ? 'bg-[#E5D5B3] text-black border-[#E5D5B3] shadow-[0_10px_20px_-5px_rgba(229,213,179,0.2)]' : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20'}`}
                        >
                            Split Equally
                        </button>
                        <button
                            onClick={() => setMode('exact')}
                            className={`px-8 py-3 rounded-2xl font-black text-[9px] uppercase  transition-all border ${mode === 'exact' ? 'bg-[#E5D5B3] text-black border-[#E5D5B3] shadow-[0_10px_20px_-5px_rgba(229,213,179,0.2)]' : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20'}`}
                        >
                            Custom Exact
                        </button>
                    </div>

                    {/* Participant Selection - High Fidelity Row Style */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Participants</span>
                            <button
                                onClick={() => setSelectedMembers(selectedMembers.length === group.members.length ? [] : group.members)}
                                className="text-[10px] font-black text-[#E5D5B3] hover:text-white transition-colors uppercase tracking-widest"
                            >
                                {selectedMembers.length === group.members.length ? 'DESELECT ALL' : 'SELECT ALL'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {group.members.map(mId => {
                                const isSelected = selectedMembers.includes(mId);
                                const profile = memberProfiles[mId];
                                const perPerson = (totalNum / (selectedMembers.length || 1)).toFixed(2);

                                return (
                                    <div
                                        key={mId}
                                        onClick={() => handleToggleMember(mId)}
                                        className={`group relative flex items-center justify-between p-4 rounded-[2rem] border transition-all duration-300 cursor-pointer ${isSelected ? 'bg-zinc-900/60 border-white/10' : 'bg-transparent border-white/5 opacity-30 hover:opacity-50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl relative transition-transform group-active:scale-95">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mId}`} className="w-full h-full object-cover" />
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#E5D5B3] rounded-full flex items-center justify-center text-black border-2 border-[#080808] animate-in zoom-in spin-in-90 duration-300">
                                                        <Check size={14} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-white text-base leading-none mb-1">
                                                    {profile?.displayName || mId.split('@')[0]}
                                                    {mId === profile?.stellarId && <span className="ml-2 text-[8px] bg-[#E5D5B3]/10 text-[#E5D5B3] px-2 py-0.5 rounded uppercase tracking-tighter">You</span>}
                                                </span>
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter opacity-60">@{mId.split('@')[0]}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                            {mode === 'equal' ? (
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-[#E5D5B3]/60 uppercase tracking-widest mb-1">Share</p>
                                                    <p className="text-xl font-black text-white tracking-tighter italic">₹{isSelected ? perPerson : '0.00'}</p>
                                                </div>
                                            ) : (
                                                <div className="relative group/input">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 italic">₹</span>
                                                    <input
                                                        disabled={!isSelected}
                                                        type="text"
                                                        value={customAmounts[mId] || ''}
                                                        onChange={(e) => handleCustomAmountChange(mId, e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-32 bg-black/40 border border-white/5 rounded-2xl py-3 pl-8 pr-4 text-right text-lg font-black text-white outline-none focus:border-[#E5D5B3]/20 italic transition-all disabled:opacity-0"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Glassmorphic Action Footer */}
                <div className="px-10 pt-8 pb-14 bg-zinc-950/40 backdrop-blur-2xl border-t border-white/10 rounded-t-[3.5rem] relative overflow-hidden">
                    {/* Animated Glow Background */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#E5D5B3]/10 blur-xl" />

                    <div className="flex flex-col space-y-8">
                        {/* Status Bar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full blur-[2px] animate-pulse ${isValid ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                    {isValid ? 'Ready to launch split' : mode === 'exact' ? (remaining > 0 ? `Needs ₹${remaining.toFixed(2)} more` : `Excess of ₹${Math.abs(remaining).toFixed(2)}`) : 'Enter amount and description'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Selected</span>
                                <span className="text-base font-black text-white italic">{selectedMembers.length} / {group.members.length}</span>
                            </div>
                        </div>

                        {/* Primary Action Button */}
                        <button
                            disabled={!isValid || loading}
                            onClick={handleCreateSplit}
                            className="group relative w-full h-20 rounded-[2rem] overflow-hidden transition-all active:scale-[0.98] disabled:grayscale disabled:opacity-20"
                        >
                            <div className="absolute inset-0 gold-gradient group-hover:opacity-90 transition-opacity" />
                            <div className="relative flex items-center justify-baseline px-10 h-full">
                                <div className="flex flex-col items-start flex-1">
                                    <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.4em]">Confirm &</span>
                                    <span className="text-2xl font-black text-black italic tracking-tighter leading-none">COMMIT SPLIT</span>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center text-black group-hover:translate-x-1 transition-transform">
                                    {loading ? <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" /> : <ChevronRight size={28} strokeWidth={3} />}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplitExpenseDrawer;
