
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, SplitGroup, SplitExpense } from '../types';
import { ArrowLeft, Plus, Users, Receipt, Send, ChevronRight, CheckCircle2, IndianRupee } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { recordSplitExpense } from '../services/db';

interface Props {
    profile: UserProfile | null;
}

const GroupPage: React.FC<Props> = ({ profile }) => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const [group, setGroup] = useState<SplitGroup | null>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) return;

        // Fetch Group Details
        const fetchGroup = async () => {
            const snap = await getDoc(doc(db, 'groups', groupId));
            if (snap.exists()) {
                setGroup({ id: snap.id, ...snap.data() } as SplitGroup);
            }
        };
        fetchGroup();

        // Listen to Expenses
        const q = query(collection(db, 'splitExpenses'), where('groupId', '==', groupId));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setExpenses(data.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
            setLoading(false);
        });

        return () => unsub();
    }, [groupId]);

    const handleCreateSplit = async () => {
        if (!amount || !description || !group || !profile) return;

        const total = parseFloat(amount);
        const perPerson = total / group.members.length;

        const expenseData = {
            groupId: group.id,
            description,
            totalAmount: total,
            paidBy: profile.stellarId,
            splitType: 'equal',
            participants: group.members.map(m => ({
                stellarId: m,
                amount: perPerson,
                status: m === profile.stellarId ? 'PAID' : 'PENDING'
            }))
        };

        try {
            await recordSplitExpense(expenseData);
            setShowSplitModal(false);
            setAmount('');
            setDescription('');
        } catch (e) {
            console.error(e);
        }
    };

    if (!group || !profile) return null;

    return (
        <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
            {/* Dynamic Header */}
            <div className="pt-14 pb-8 px-6 bg-zinc-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 text-zinc-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#E5D5B3] p-1 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${group.avatarSeed}`} className="w-full h-full" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">{group.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{group.members.length} Members</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSplitModal(true)}
                        className="flex-1 py-4 gold-gradient text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <Plus size={16} strokeWidth={3} /> Create Split
                    </button>
                    <button className="p-4 bg-zinc-800 rounded-2xl border border-white/5 text-zinc-400">
                        <Users size={20} />
                    </button>
                </div>
            </div>

            {/* Expense List */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar pb-32">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Activities</h3>

                {loading ? (
                    <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#E5D5B3] border-t-transparent rounded-full animate-spin" /></div>
                ) : expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Receipt size={64} className="mb-4" />
                        <p className="font-bold">No expenses yet</p>
                        <p className="text-xs">Split bills effortlessly with your group</p>
                    </div>
                ) : expenses.map(expense => {
                    const isPayer = expense.paidBy === profile.stellarId;
                    const mySplit = expense.participants.find((p: any) => p.stellarId === profile.stellarId);
                    const unpaidCount = expense.participants.filter((p: any) => p.status === 'PENDING').length;

                    return (
                        <div key={expense.id} className="bg-zinc-900/80 border border-white/5 rounded-[2rem] p-6 shadow-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-[#E5D5B3]">
                                        <Receipt size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white leading-tight capitalize">{expense.description}</h4>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            Paid by {expense.paidBy === profile.stellarId ? 'You' : expense.paidBy.split('@')[0]}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black tracking-tighter text-white">₹{expense.totalAmount}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#E5D5B3]">{unpaidCount} Pending</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex -space-x-3">
                                    {expense.participants.slice(0, 4).map((p: any) => (
                                        <div key={p.stellarId} className={`w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden ${p.status === 'PAID' ? 'opacity-100' : 'opacity-40'}`}>
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.stellarId}`} className="w-full h-full" />
                                        </div>
                                    ))}
                                    {expense.participants.length > 4 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-black">
                                            +{expense.participants.length - 4}
                                        </div>
                                    )}
                                </div>

                                {!isPayer && mySplit.status === 'PENDING' && (
                                    <button
                                        onClick={() => navigate(`/send?to=${expense.paidBy}&amt=${mySplit.amount}`)}
                                        className="px-6 py-2 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                    >
                                        Pay Split
                                    </button>
                                )}
                                {(isPayer || mySplit.status === 'PAID') && (
                                    <div className="flex items-center gap-2 text-emerald-500/60 font-black text-[10px] uppercase tracking-widest">
                                        <CheckCircle2 size={14} /> Settle
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Split Modal */}
            {showSplitModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSplitModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-zinc-900 rounded-[3rem] p-10 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
                        <h3 className="text-xl font-black mb-8 tracking-tight">New Split Expense</h3>

                        <div className="space-y-6 mb-10">
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-700 italic">₹</span>
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                    className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] py-6 pl-14 pr-6 text-3xl font-black outline-none focus:border-[#E5D5B3]/20 italic"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="What is this for?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] py-5 px-6 font-bold text-sm outline-none focus:border-[#E5D5B3]/20"
                            />
                        </div>

                        <div className="bg-zinc-800/40 p-6 rounded-3xl border border-white/5 mb-8">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Split Between</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#E5D5B3]">{group.members.length} People</span>
                            </div>
                            <p className="text-xl font-black tracking-tighter text-white italic">
                                ₹{(parseFloat(amount || '0') / group.members.length).toFixed(2)} <span className="text-[10px] font-bold text-zinc-600 not-italic uppercase tracking-widest">/ each</span>
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowSplitModal(false)} className="flex-1 py-5 bg-zinc-800 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-500">Cancel</button>
                            <button
                                disabled={!amount || !description}
                                onClick={handleCreateSplit}
                                className="flex-[2] py-5 gold-gradient text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                            >
                                Create Split
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupPage;
