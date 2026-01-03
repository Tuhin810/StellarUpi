
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
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestAmount, setRequestAmount] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contactId) {
            getProfileByStellarId(contactId).then(setTargetProfile);
        }
    }, [contactId]);

    useEffect(() => {
        if (!profile || !contactId) return;

        const chatsRef = { current: [] as any[] };
        const txsRef = { current: [] as any[] };

        const updateUnifiedMessages = () => {
            const unified = [...chatsRef.current, ...txsRef.current].sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeA - timeB;
            });
            setMessages(unified);
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        };

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
            chatsRef.current = snap.docs.map(d => ({ ...d.data(), id: d.id, itemType: 'chat' }));
            updateUnifiedMessages();
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

        const unsubTxs = onSnapshot(txQuery, (snap) => {
            txsRef.current = snap.docs.map(d => ({ ...d.data(), id: d.id, itemType: 'tx' }));
            updateUnifiedMessages();
        });

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

    const handleSendRequest = async () => {
        if (!requestAmount || isNaN(parseFloat(requestAmount)) || !profile || !contactId) return;
        setRequestLoading(true);
        try {
            await addDoc(collection(db, 'chats'), {
                senderId: profile.stellarId,
                receiverId: contactId,
                amount: parseFloat(requestAmount),
                type: 'request',
                status: 'PENDING',
                timestamp: serverTimestamp()
            });
            setShowRequestModal(false);
            setRequestAmount('');
        } catch (err) {
            console.error("Failed to send request", err);
        } finally {
            setRequestLoading(false);
        }
    };

    const avatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

    if (!profile || !contactId) return null;

    return (
        <div className="flex flex-col h-screen bg-[#1A1A1A] text-white overflow-hidden">
            {/* Header */}
            <div className="pt-5 pb-4 px-2 bg-zinc-900 border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
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
                                <div className={`max-w-[85%] rounded-[1rem] p-1 border border-white/5 shadow-2xl overflow-hidden ${isMe ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
                                    <div className="bg-[#E5D5B3] p-4 rounded-[1rem] flex flex-col items-center gap-2">
                                        <span className="text-black/40 text-[10px] font-black tracking-[0.2em] uppercase">
                                            {isMe ? 'Payment to' : 'Payment received from'}
                                        </span>
                                        <h3 className="text-2xl font-black text-black">₹{msg.amount?.toLocaleString()}</h3>
                                        <div className="flex items-center gap-2 px-4 py-1 bg-black/5 rounded-full ">
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

                    if (msg.type === 'request') {
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-[2rem] p-6 border border-white/10 shadow-2xl ${isMe ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950 border-[#E5D5B3]/10'}`}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">{isMe ? 'Request from you' : 'Request from ' + (targetProfile?.displayName || contactId.split('@')[0])}</p>
                                    <h3 className="text-4xl font-black text-white mb-6 italic">₹{msg.amount?.toLocaleString()}</h3>

                                    {!isMe && msg.status === 'PENDING' ? (
                                        <button
                                            onClick={() => navigate(`/send?to=${msg.senderId}&amt=${msg.amount}`)}
                                            className="w-full py-4 bg-[#E5D5B3] text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                                        >
                                            Pay Now
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-zinc-600">
                                            <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{msg.status === 'PENDING' ? 'Unpaid' : 'Completed'}</span>
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
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="flex-1 h-12 bg-zinc-800 rounded-2xl text-white font-black text-xs uppercase tracking-widest border border-white/5 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                    >
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

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pt-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowRequestModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-zinc-900 rounded-[3rem] p-10 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300">
                        <h3 className="text-xl font-black mb-1 tracking-tight">Request Money</h3>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8">From {targetProfile?.displayName || contactId.split('@')[0]}</p>

                        <div className="flex items-center justify-start gap-4 bg-black/40 p-4 rounded-[2.5rem] border border-white/5 mb-10">
                            <span className="text-zinc-600 text-4xl font-black opacity-30">₹</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoFocus
                                value={requestAmount}
                                onChange={(e) => setRequestAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="0"
                                className="bg-transparent text-white text-2xl font-black text-start w-full outline-none placeholder-zinc-800"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="flex-1 py-5 bg-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendRequest}
                                disabled={!requestAmount || requestLoading}
                                className="flex-[2] py-5 gold-gradient text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center"
                            >
                                {requestLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
