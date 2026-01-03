
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, SplitGroup, SplitExpense } from '../types';
import { ArrowLeft, Plus, Users, Receipt, Send, ChevronRight, CheckCircle2, IndianRupee, MessageCircle } from 'lucide-react';
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
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = React.useRef<HTMLDivElement>(null);

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

        const chatsRef = { current: [] as any[] };
        const expensesRef = { current: [] as any[] };

        const updateUnified = () => {
            const unified = [...chatsRef.current, ...expensesRef.current].sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeA - timeB;
            });
            setExpenses(unified);
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        };

        // Listen to Group Chat Messages
        const chatQ = query(collection(db, 'chats'), where('groupId', '==', groupId));
        const unsubChats = onSnapshot(chatQ, (snap) => {
            chatsRef.current = snap.docs.map(d => ({ ...d.data(), id: d.id, itemType: 'chat' }));
            updateUnified();
        });

        // Listen to Expenses
        const expenseQ = query(collection(db, 'splitExpenses'), where('groupId', '==', groupId));
        const unsubExpenses = onSnapshot(expenseQ, (snap) => {
            expensesRef.current = snap.docs.map(d => ({ ...d.data(), id: d.id, itemType: 'tx' }));
            updateUnified();
        });

        return () => {
            unsubChats();
            unsubExpenses();
        };
    }, [groupId]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !profile || !groupId) return;
        try {
            await addDoc(collection(db, 'chats'), {
                senderId: profile.stellarId,
                groupId: groupId,
                text: inputText,
                type: 'text',
                timestamp: serverTimestamp()
            });
            setInputText('');
        } catch (err) {
            console.error(err);
        }
    };

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
            <div className="pt-5 pb-8 px-2 bg-zinc-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate("/")} className="p-2 text-zinc-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#E5D5B3]/40 flex items-center justify-center overflow-hidden shadow-2xl relative">
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${group.avatarSeed}`} className="w-full h-full object-cover" />
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
                ) : expenses.map((item, idx) => {
                    const isMe = item.senderId === profile.stellarId || item.paidBy === profile.stellarId;
                    const isTx = item.itemType === 'tx';

                    if (isTx) {
                        const isPayer = item.paidBy === profile.stellarId;
                        const mySplit = item.participants.find((p: any) => p.stellarId === profile.stellarId);
                        const unpaidCount = item.participants.filter((p: any) => p.status === 'PENDING').length;

                        return (
                            <div key={item.id} className={`flex ${isPayer ? 'justify-end' : 'justify-start'}`}>
                                <div className="bg-zinc-900/80 border border-white/5 rounded-[1rem] p-6 shadow-2xl max-w-[85%]">
                                    <div className="flex justify-between items-start mb-4 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-[#E5D5B3]">
                                                <Receipt size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white leading-tight capitalize text-sm">{item.description}</h4>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    Paid by {isPayer ? 'You' : item.paidBy.split('@')[0]}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black tracking-tighter text-white">₹{item.totalAmount}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#E5D5B3]">{unpaidCount} Pending</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                                        <div className="flex -space-x-3">
                                            {item.participants.slice(0, 4).map((p: any) => (
                                                <div key={p.stellarId} className={`w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden ${p.status === 'PAID' ? 'opacity-100' : 'opacity-40'}`}>
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.stellarId}`} className="w-full h-full" />
                                                </div>
                                            ))}
                                        </div>

                                        {!isPayer && mySplit.status === 'PENDING' && (
                                            <button
                                                onClick={() => navigate(`/send?to=${item.paidBy}&amt=${mySplit.amount}`)}
                                                className="px-6 py-2 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                            >
                                                Pay
                                            </button>
                                        )}
                                        {(isPayer || mySplit.status === 'PAID') && (
                                            <div className="flex items-center gap-2 text-emerald-500/60 font-black text-[10px] uppercase tracking-widest">
                                                <CheckCircle2 size={14} /> Settle
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                            {!isMe && (
                                <div className="w-6 h-6 rounded-lg bg-zinc-800 overflow-hidden border border-white/5 mb-1">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.senderId}`} className="w-full h-full" />
                                </div>
                            )}
                            <div className={`max-w-[75%] px-5 py-3 rounded-2xl font-bold text-sm shadow-xl ${isMe ? 'bg-[#E5D5B3] text-black rounded-tr-none' : 'bg-zinc-900 text-white rounded-tl-none border border-white/5'}`}>
                                {!isMe && <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{item.senderId.split('@')[0]}</p>}
                                {item.text}
                                <div className="text-[8px] mt-1 opacity-40 text-right font-black">
                                    {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 pb-12 bg-zinc-900/80 backdrop-blur-xl border-t border-white/5 relative z-10">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Message to group..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-6 pr-16 font-bold text-sm focus:outline-none focus:border-[#E5D5B3]/20 transition-all placeholder-zinc-700 shadow-inner"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#E5D5B3] rounded-xl flex items-center justify-center text-black disabled:opacity-30 transition-all active:scale-90"
                    >
                        <Send size={18} />
                    </button>
                </div>
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
