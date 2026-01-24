
import React, { useState, useEffect } from 'react';
import { X, Check, Users, IndianRupee, PieChart, Activity, ChevronRight, AlertCircle } from 'lucide-react';
import { UserProfile, SplitGroup } from '../../types';
import { recordSplitExpense } from '../../services/db';
import { getAvatarUrl } from '../../services/avatars';
import { NotificationService } from '../../services/notification';


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

            // Trigger remote notifications for all participants except the sender
            const others = selectedMembers.filter(mId => mId !== profile.stellarId);
            if (others.length > 0) {
                NotificationService.triggerRemoteNotification(
                    others,
                    totalNum.toString(),
                    profile.displayName || profile.stellarId.split('@')[0],
                    `New Split in ${group.name} 👥`,
                    `${description}: Total ₹${totalNum} split with you.`
                );
            }

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

            <div className={`absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-gradient-to-b from-zinc-900 to-black rounded-t-[2rem] transition-transform duration-300 ease-out shadow-[0_-40px_100px_-20px_rgba(0,0,0,1)] flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ maxHeight: '96vh' }}>

                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-6 border-b border-white/5">
                    <h3 className="text-xl font-black text-white tracking-tight">New Split for {group.name}</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-8 no-scrollbar mt-6">

                    {/* Amount & Description Area */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="inline-flex items-center justify-center bg-zinc-950/50 border border-white/5 rounded-2xl py-4 px-8 text-center group focus-within:border-[#E5D5B3]/20 transition-all">
                            <span className="text-2xl font-black text-[#E5D5B3] italic mr-4 opacity-50">₹</span>
                            <input
                                autoFocus
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                className="bg-transparent text-center text-4xl font-black text-white outline-none placeholder-zinc-800 transition-all w-[180px]"
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="What's this for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full max-w-[320px] bg-zinc-900/40 borde border-white/10 py-3 px-4 text-center rounded-xl font-bold text-sm outline-none focus:border-[#E5D5B3]/40 transition-all placeholder-zinc-700 italic"
                        />
                    </div>

                    {/* Mode Selection */}
                    <div className="flex justify-center p-1.5 bg-zinc-950/50 rounded-2xl border border-white/5 w-fit mx-auto">
                        <button
                            onClick={() => setMode('equal')}
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'equal' ? 'bg-[#E5D5B3] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Split Equally
                        </button>
                        <button
                            onClick={() => setMode('exact')}
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'exact' ? 'bg-[#E5D5B3] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Custom Exact
                        </button>
                    </div>

                    {/* Participants Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[12px] font-black text-zinc-600  ">Participants</span>
                            <button
                                onClick={() => setSelectedMembers(selectedMembers.length === group.members.length ? [] : group.members)}
                                className="text-[10px] font-black text-[#fff] hover:text-white transition-colors  "
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
                                        className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${isSelected ? 'bg-zinc-900/40 border-white/10 shadow-sm' : 'bg-transparent border-white/5 opacity-40 hover:opacity-60'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shadow-inner">
                                                    <img src={getAvatarUrl(profile?.avatarSeed || mId)} className="w-full h-full object-cover" />
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#E5D5B3] rounded-full flex items-center justify-center text-black border-2 border-[#121212] animate-in zoom-in duration-300">
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm leading-none mb-1 flex items-center gap-2">
                                                    {profile?.displayName || mId.split('@')[0]}
                                                    {mId === profile?.stellarId && <span className="text-[7px] bg-[#E5D5B3]/20 text-[#E5D5B3] px-1.5 py-0.5 rounded font-black uppercase">You</span>}
                                                </span>
                                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">@{mId.split('@')[0]}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                            {mode === 'equal' ? (
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-white tracking-tighter ">₹{isSelected ? perPerson : '0.00'}</p>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 ">₹</span>
                                                    <input
                                                        disabled={!isSelected}
                                                        type="text"
                                                        value={customAmounts[mId] || ''}
                                                        onChange={(e) => handleCustomAmountChange(mId, e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-24 bg-black/40 border border-white/5 rounded-lg py-1.5 pl-6 pr-2 text-right text-base font-black text-white outline-none focus:border-[#E5D5B3]/30 transition-all disabled:opacity-0"
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

                {/* Professional Action Footer */}
                <div className="px-6 pt-6 pb-10 bg-black/40 backdrop-blur-3xl border-t border-white/10 rounded-t-3xl">
                    <div className="flex flex-col space-y-6">
                        {/* Status Summary */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2.5">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                    {isValid ? 'Ready to split' : mode === 'exact' ? (remaining > 0 ? `Needs ₹${remaining.toFixed(2)}` : `Excess ₹${Math.abs(remaining).toFixed(2)}`) : 'Enter amount & members'}
                                </span>
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{selectedMembers.length} / {group.members.length} Members</span>
                        </div>

                        {/* Action Button */}
                        <button
                            disabled={!isValid || loading}
                            onClick={handleCreateSplit}
                            className="group relative w-full h-14 rounded-xl overflow-hidden active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                        >
                            <div className="absolute inset-0 gold-gradient" />
                            <span className="relative text-xs font-black text-black uppercase ">{loading ? 'Processing...' : 'Launch Split'}</span>
                            {!loading && <ChevronRight size={18} className="relative text-black group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplitExpenseDrawer;
