
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, SplitGroup } from '../types';
import {
    ArrowLeft,
    Plus,
    Users,
    Receipt,
    Send
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getProfileByStellarId } from '../services/db';
import { getAvatarUrl } from '../services/avatars';

// Modular Components
import SplitExpenseDrawer from '../components/Group/SplitExpenseDrawer';
import ManageMembersDrawer from '../components/Group/ManageMembersDrawer';
import ActivityItem from '../components/Group/ActivityItem';

interface Props {
    profile: UserProfile | null;
}

const GroupPage: React.FC<Props> = ({ profile }) => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const [group, setGroup] = useState<SplitGroup | null>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [inputText, setInputText] = useState('');
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

        const chatQ = query(collection(db, 'chats'), where('groupId', '==', groupId));
        const unsubChats = onSnapshot(chatQ, (snap) => {
            chatsRef.current = snap.docs.map(d => ({ ...d.data(), id: d.id, itemType: 'chat' }));
            updateUnified();
        });

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

    if (!group || !profile) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col overflow-hidden">
            {/* Ultra-Premium Unified Header */}
            <div className="pt-6 pb-6 px-6 bg-[#080808]/80 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-50 flex flex-col gap-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative">
                                <img src={getAvatarUrl(group.avatarSeed, true)} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#E5D5B3]/10 to-transparent" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1.5">{group.name}</h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500">{group.members.length} members online</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSplitModal(true)}
                        className="flex-1 h-14 gold-gradient text-black rounded-2xl font-black text-[12px] uppercase tracking-[0.1em] shadow-[0_10px_30px_-10px_rgba(229,213,179,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <Plus size={18} strokeWidth={3} /> Create Split
                    </button>
                    <button
                        onClick={() => setShowMembersModal(true)}
                        className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-[#E5D5B3] hover:border-[#E5D5B3]/20 transition-all active:scale-[0.98]"
                    >
                        <Users size={22} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Expense/Chat List */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar pb-32">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-[#E5D5B3] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-10 text-center">
                        <Receipt size={64} className="mb-4" />
                        <p className="font-black uppercase tracking-[0.2em] text-xs">No Activities</p>
                    </div>
                ) : expenses.map((item) => (
                    <ActivityItem
                        key={item.id}
                        item={item}
                        profile={profile}
                        navigate={navigate}
                        memberProfiles={memberProfiles}
                    />
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 pb-8 bg-zinc-900/80 backdrop-blur-xl border-t border-white/5 relative z-10">
                <div className="relative">
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

            {/* Modular Drawers */}
            <SplitExpenseDrawer
                isOpen={showSplitModal}
                onClose={() => setShowSplitModal(false)}
                group={group}
                profile={profile}
                memberProfiles={memberProfiles}
            />

            <ManageMembersDrawer
                isOpen={showMembersModal}
                onClose={() => setShowMembersModal(false)}
                group={group}
                profile={profile}
                memberProfiles={memberProfiles}
            />
        </div>
    );
};

export default GroupPage;
