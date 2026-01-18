
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, SplitGroup, SplitExpense } from '../types';
import {
    ArrowLeft,
    Plus,
    Users,
    Receipt,
    Send,
    ChevronRight,
    CheckCircle2,
    IndianRupee,
    MessageCircle,
    X,
    Search,
    Trash2,
    RefreshCw,
    UserPlus
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { recordSplitExpense, updateGroupMembers, searchUsers, getProfileByStellarId } from '../services/db';

interface Props {
    profile: UserProfile | null;
}

const GroupPage: React.FC<Props> = ({ profile }) => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const [group, setGroup] = useState<SplitGroup | null>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [savingMembers, setSavingMembers] = useState(false);
    const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
    const scrollRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!group?.members?.length) return;
        const fetchProfiles = async () => {
            const profiles: Record<string, UserProfile> = {};
            await Promise.all(group.members.map(async (mId) => {
                const p = await getProfileByStellarId(mId);
                if (p) profiles[mId] = p;
            }));
            setMemberProfiles(profiles);
        };
        fetchProfiles();
    }, [group?.members]);

    useEffect(() => {
        if (!groupId) return;

        // Fetch Group Details with Real-time listener
        const unsubGroup = onSnapshot(doc(db, 'groups', groupId), (snap) => {
            if (snap.exists()) {
                setGroup({ id: snap.id, ...snap.data() } as SplitGroup);
            }
        });

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
            unsubGroup();
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
        <div className="min-h-screen  bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col">
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
                    <button
                        onClick={() => setShowMembersModal(true)}
                        className="p-4 bg-zinc-800 rounded-2xl border border-white/5 text-zinc-400 hover:text-[#E5D5B3] transition-all"
                    >
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
                            <div key={item.id} className={`flex ${isPayer ? 'justify-end' : 'justify-start'} w-full mb-2`}>
                                <div className={`relative max-w-[90%] w-full sm:w-auto min-w-[320px] bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[2rem] p-6 shadow-2xl transition-all hover:border-[#E5D5B3]/20`}>
                                    {/* Action Header */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#E5D5B3]/10 flex items-center justify-center text-[#E5D5B3]">
                                                <Receipt size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-0.5">Split Expense</p>
                                                <h4 className="font-black text-white text-base leading-none capitalize">{item.description}</h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black tracking-tighter text-white">₹{item.totalAmount}</p>
                                        </div>
                                    </div>

                                    {/* Participants Summary */}
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4 mb-5">
                                        <div className="flex -space-x-3">
                                            {item.participants.slice(0, 5).map((p: any) => (
                                                <div key={p.stellarId} className={`w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 p-0.5 transition-all ${p.status === 'PAID' ? 'ring-2 ring-emerald-500/20' : 'opacity-40 grayscale'}`}>
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.stellarId}`} className="w-full h-full rounded-full" />
                                                </div>
                                            ))}
                                            {item.participants.length > 5 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400">
                                                    +{item.participants.length - 5}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#E5D5B3]">
                                            {unpaidCount === 0 ? <span className="text-emerald-400">FULLY SETTLED</span> : `${unpaidCount} PENDING`}
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                            {isPayer ? 'You paid' : `${item.paidBy.split('@')[0]} paid`}
                                        </p>

                                        {!isPayer && mySplit.status === 'PENDING' && (
                                            <button
                                                onClick={() => navigate(`/send?to=${item.paidBy}&amt=${mySplit.amount}`)}
                                                className="px-8 py-3 gold-gradient text-black rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                                            >
                                                Pay ₹{mySplit.amount}
                                            </button>
                                        )}
                                        {(isPayer || mySplit.status === 'PAID') && (
                                            <div className="flex items-center gap-2 text-emerald-500/80 font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                                <CheckCircle2 size={14} strokeWidth={3} /> Settled
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-3 w-full group mb-1`}>
                            {!isMe && (
                                <div className="w-8 h-8 rounded-xl bg-zinc-800/80 overflow-hidden border border-white/10 mb-1 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.senderId}`} className="w-full h-full" />
                                </div>
                            )}
                            <div className={`max-w-[75%] shadow-2xl transition-all ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                {!isMe && (
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1.5 ml-1">{item.senderId.split('@')[0]}</p>
                                )}
                                <div className={`relative px-4 py-2 rounded-2xl font-medium text-[17.5px] leading-relaxed shadow-lg ${isMe ? 'bg-gradient-to-br from-[#E5D5B3] to-[#D4C4A3] text-zinc-950 rounded-tr-none' : 'bg-zinc-900 border border-white/5 text-white rounded-tl-none'}`}>
                                    {item.text}
                                    <div className={`text-[7px]  font-black uppercase tracking-tighter opacity-30 ${isMe ? 'text-black' : 'text-zinc-500'} flex justify-end items-center gap-1`}>
                                        {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <CheckCircle2 size={7} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 pb-6 bg-zinc-900/80 backdrop-blur-xl border-t border-white/5 relative z-10">
                <div className="relative ">
                    <input
                        type="text"
                        placeholder="Message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 pl-5 pr-12 font-bold text-md focus:outline-none focus:border-[#E5D5B3]/20 transition-all placeholder-zinc-800"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#E5D5B3] rounded-xl flex items-center justify-center text-black disabled:opacity-30 transition-all active:scale-90"
                    >
                        <Send size={22} />
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

            {/* Members Management Drawer */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showMembersModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMembersModal(false)}></div>
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2.5rem] transition-transform duration-300 ease-out flex flex-col ${showMembersModal ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '70vh', minHeight: '500px' }}>
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pb-6 pt-2">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Manage Members</h3>
                            <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">{group.members.length} People in group</p>
                        </div>
                        <button
                            onClick={() => setShowMembersModal(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Section */}
                    <div className="px-6 mb-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="text"
                                placeholder="Add member by Stellar ID..."
                                value={searchQuery}
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    setSearchQuery(val);
                                    if (val.length > 2) {
                                        setIsSearching(true);
                                        const results = await searchUsers(val);
                                        setSearchResults(results.filter(r => !group.members.includes(r.stellarId)));
                                        setIsSearching(false);
                                    } else {
                                        setSearchResults([]);
                                    }
                                }}
                                className="w-full bg-zinc-800/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-[#E5D5B3]/40"
                            />
                            {isSearching && (
                                <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" size={16} />
                            )}
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-zinc-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
                                {searchResults.map(user => (
                                    <button
                                        key={user.uid}
                                        onClick={async () => {
                                            setSavingMembers(true);
                                            await updateGroupMembers(group.id, [...group.members, user.stellarId]);
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            setSavingMembers(false);
                                        }}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all text-left border-b border-white/5 last:border-0"
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed}`} className="w-full h-full" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{user.displayName || user.stellarId.split('@')[0]}</p>
                                            <p className="text-[10px] text-zinc-500">{user.stellarId}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-[#E5D5B3]/10 flex items-center justify-center text-[#E5D5B3]">
                                            <UserPlus size={16} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Member List */}
                    <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 px-1">Current Members</p>
                        <div className="space-y-3">
                            {group.members.map(memberId => {
                                const isMe = memberId === profile.stellarId;
                                return (
                                    <div key={memberId} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/5">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`} className="w-full h-full" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm flex items-center gap-2">
                                                {memberProfiles[memberId]?.displayName || memberId.split('@')[0]}
                                                {isMe && <span className="text-[8px] bg-[#E5D5B3] text-black px-2.5  rounded-full font-black uppercase ">You</span>}
                                            </p>
                                            <p className="text-[10px] text-zinc-500">{memberId}</p>
                                        </div>
                                        {!isMe && (
                                            <button
                                                onClick={async () => {
                                                    const displayName = memberProfiles[memberId]?.displayName || memberId.split('@')[0];
                                                    if (window.confirm(`Remove ${displayName} from group?`)) {
                                                        const newMembers = group.members.filter(m => m !== memberId);
                                                        await updateGroupMembers(group.id, newMembers);
                                                    }
                                                }}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 transition-all hover:text-white"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupPage;
