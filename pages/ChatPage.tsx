
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, ChatMessage, TransactionRecord } from '../types';
import { getProfileByStellarId } from '../services/db';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    limit,
    or,
    and
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowLeft, Send, Sparkles, CheckCircle2, IndianRupee, MessageCircle, MoreVertical, Zap } from 'lucide-react';

interface Props {
    profile: UserProfile | null;
}

const ChatPage: React.FC<Props> = ({ profile }) => {
    const { contactId } = useParams<{ contactId: string }>();
    const navigate = useNavigate();
    const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contactId) {
            getProfileByStellarId(contactId).then(setTargetProfile);
        }
    }, [contactId]);

    useEffect(() => {
        if (!profile || !contactId) return;

        // Listen to text messages
        const chatQuery = query(
            collection(db, 'chats'),
            or(
                and(where('senderId', '==', profile.stellarId), where('receiverId', '==', contactId)),
                and(where('senderId', '==', contactId), where('receiverId', '==', profile.stellarId))
            ),
            orderBy('timestamp', 'asc'),
            limit(50)
        );

        const unsubChats = onSnapshot(chatQuery, (snap) => {
            const chats = snap.docs.map(d => ({ ...d.data(), id: d.id, itemType: 'chat' }));
            updateUnifiedMessages(chats, txsRef.current);
        });

        // Listen to transactions
        const txQuery = query(
            collection(db, 'transactions'),
            or(
                and(where('fromId', '==', profile.stellarId), where('toId', '==', contactId)),
                and(where('fromId', '==', contactId), where('toId', '==', profile.stellarId))
            ),
            orderBy('timestamp', 'asc'),
            limit(50)
        );

        const txsRef = { current: [] as any[] };
        const unsubTxs = onSnapshot(txQuery, (snap) => {
            const txs = snap.docs.map(d => ({ ...d.data(), id: d.id, itemType: 'tx' }));
            txsRef.current = txs;
            // Trigger update logic
            // (This relies on the fact that at least one snap will fire)
        });

        const updateUnifiedMessages = (chats: any[], txs: any[]) => {
            const unified = [...chats, ...txs].sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeA - timeB;
            });
            setMessages(unified);
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        };

        return () => {
            unsubChats();
            unsubTxs();
        };
    }, [profile, contactId]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !profile || !contactId) return;

        try {
            await addDoc(collection(db, 'chats'), {
                senderId: profile.stellarId,
                receiverId: contactId,
                text: inputText,
                type: 'text',
                timestamp: serverTimestamp()
            });
            setInputText('');
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const avatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

    if (!profile || !contactId) return null;

    return (
        <div className="flex flex-col h-screen bg-[#1A1A1A] text-white overflow-hidden">
            {/* Header */}
            <div className="pt-14 pb-4 px-6 bg-zinc-900 border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 overflow-hidden">
                            <img src={avatarUrl(contactId)} alt="" className="w-full h-full" />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight capitalize leading-none mb-1">
                                {targetProfile?.displayName || contactId.split('@')[0]}
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#E5D5B3] opacity-60">{contactId}</p>
                        </div>
                    </div>
                </div>
                <button className="p-2 text-zinc-400">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#E5D5B3] border-t-transparent rounded-full animate-spin"></div></div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                        <MessageCircle size={64} className="mb-4" />
                        <p className="font-bold">No messages yet</p>
                        <p className="text-xs">Start a conversation or send a payment</p>
                    </div>
                ) : messages.map((msg, idx) => {
                    const isMe = msg.senderId === profile.stellarId || msg.fromId === profile.stellarId;
                    const isTx = msg.itemType === 'tx';

                    if (isTx) {
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-[2rem] p-1 border border-white/5 shadow-2xl overflow-hidden ${isMe ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
                                    <div className="bg-[#E5D5B3] p-4 rounded-[1.8rem] flex flex-col items-center gap-2">
                                        <span className="text-black/40 text-[10px] font-black tracking-[0.2em] uppercase">
                                            {isMe ? 'Payment to' : 'Payment received from'}
                                        </span>
                                        <h3 className="text-2xl font-black text-black">₹{msg.amount?.toLocaleString()}</h3>
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-black/5 rounded-full mt-2">
                                            <CheckCircle2 size={12} className="text-emerald-600" />
                                            <span className="text-[11px] font-bold text-black/60 capitalize">Paid • {msg.timestamp?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                    </div>
                                    {msg.memo && (
                                        <div className="p-4 px-6">
                                            <p className="text-zinc-500 text-xs font-bold leading-relaxed">{msg.memo}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-6 py-4 rounded-3xl font-bold text-sm shadow-xl ${isMe ? 'bg-[#E5D5B3] text-black rounded-tr-none' : 'bg-zinc-900 text-white rounded-tl-none border border-white/5'}`}>
                                {msg.text}
                                <div className={`text-[9px] mt-1 opacity-40 text-right font-black`}>
                                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Footer Controls */}
            <div className="p-6 pb-12 bg-zinc-900 border-t border-white/5 space-y-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(`/send?to=${contactId}`)}
                        className="flex-1 h-12 bg-white rounded-2xl text-black font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Zap size={14} fill="currentColor" /> Pay
                    </button>
                    <button className="flex-1 h-12 bg-zinc-800 rounded-2xl text-white font-black text-xs uppercase tracking-widest border border-white/5 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center">
                        Request
                    </button>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-6 pr-16 font-bold text-sm focus:outline-none focus:border-[#E5D5B3]/20 transition-all placeholder-zinc-700"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#E5D5B3] rounded-xl flex items-center justify-center text-black disabled:opacity-30 transition-all active:scale-90"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
