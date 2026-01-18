
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
            {/* Dynamic Header */}
            <div className="pt-5 pb-8 px-2 bg-zinc-900 border-b border-white/5 sticky top-0 z-50">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate("/")} className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#E5D5B3]/40 flex items-center justify-center overflow-hidden shadow-2xl relative">
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${group.avatarSeed}`} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">{group.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3] opacity-60">{group.members.length} Members</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 px-2">
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
