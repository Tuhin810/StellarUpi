
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, ChatMessage, TransactionRecord } from '../types';
import { getProfileByStellarId } from '../services/db';
import { getAvatarUrl } from '../services/avatars';
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

    if (!profile || !contactId) return null;

    return (
        <div className="flex flex-col h-screen  bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white overflow-hidden">
            {/* Header */}
            <div className="pt-5 pb-4 px-2 bg-zinc-900 border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/")} className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 overflow-hidden">
                            <img src={getAvatarUrl(targetProfile?.avatarSeed || contactId)} alt="" className="w-full h-full" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black tracking-tight capitalize leading-none mb-1">
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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-40">
                        <div className="w-6 h-6 border-2 border-[#E5D5B3] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[8px] font-black uppercase tracking-widest">Securing...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-10 py-10 text-center">
                        <MessageCircle size={32} className="mb-4 text-zinc-800" />
                        <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest">No history</h3>
                    </div>
                ) : messages.map((msg, idx) => {
                    const isMe = msg.senderId === profile.stellarId || msg.fromId === profile.stellarId;
                    const isTx = msg.itemType === 'tx';

                    if (isTx) {
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full animate-in fade-in zoom-in-95 duration-300`}>
                                <div className={`w-[85%] max-w-[340px] rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/60 shadow-2xl backdrop-blur-sm`}>
                                    <div className="flex items-center gap-4 p-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-zinc-800 text-zinc-400' : 'bg-[#E5D5B3]/10 text-[#E5D5B3]'}`}>
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                    {isMe ? 'Sent To' : 'Received From'}
                                                </p>
                                                <span className="text-[8px] font-black text-zinc-600">
                                                    {msg.timestamp?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between gap-2">
                                                <h4 className="text-lg font-black tracking-tight text-white leading-none">
                                                    ₹{msg.amount?.toLocaleString()}
                                                </h4>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/10">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-400">Success</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {msg.memo && (
                                        <div className="px-4 pb-3">
                                            <p className="text-[10px] font-bold text-zinc-500 leading-tight border-t border-white/5 pt-3 italic">
                                                "{msg.memo}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    if (msg.type === 'request') {
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                                <div className={`w-[80%] max-w-[280px] p-5 rounded-3xl border ${isMe ? 'border-white/5 bg-zinc-900/40' : 'border-[#E5D5B3]/20 bg-zinc-900/80'} shadow-xl`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 text-zinc-500`}>
                                            <IndianRupee size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-zinc-500">{isMe ? 'Requested' : 'Payment request'}</p>
                                            <h3 className="text-xl font-black text-white italic">₹{msg.amount?.toLocaleString()}</h3>
                                        </div>
                                    </div>

                                    {!isMe && msg.status === 'PENDING' ? (
                                        <button
                                            onClick={() => navigate(`/send?to=${msg.senderId}&amt=${msg.amount}`)}
                                            className="w-full py-2.5 gold-gradient text-black rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            Pay Now
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-zinc-600 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${msg.status === 'PENDING' ? 'bg-zinc-700' : 'bg-emerald-500'}`} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">{msg.status === 'PENDING' ? 'Pending' : 'Settled'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full group`}>
                            <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`relative px-4 py-2 rounded-2xl font-medium text-[17.5px] leading-relaxed shadow-lg ${isMe ? 'bg-gradient-to-br from-[#E5D5B3] to-[#D4C4A3] text-zinc-950 rounded-tr-none' : 'bg-zinc-900 border border-white/5 text-white rounded-tl-none'}`}>
                                    {msg.text}
                                    <div className={`text-[7px]  font-black uppercase tracking-tighter opacity-30 ${isMe ? 'text-black' : 'text-zinc-500'} flex justify-end items-center gap-1`}>
                                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <CheckCircle2 size={7} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Footer Controls */}
            <div className="p-4 pb-6 bg-zinc-900 border-t border-white/5 space-y-5">
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/send?to=${contactId}`)}
                        className="flex-1 h-10 bg-white rounded-xl text-black font-black text-[14px] uppercase  hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        Pay
                    </button>
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="flex-1 h-10 bg-zinc-800 rounded-xl text-white font-black text-[14px] uppercase  border border-white/5 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                    >
                        Request
                    </button>
                </div>

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

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pt-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowRequestModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-zinc-900 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300">
                        <h3 className="text-lg font-black mb-1 tracking-tight">Request Money</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">From {targetProfile?.displayName || contactId.split('@')[0]}</p>

                        <div className="flex items-center justify-start gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 mb-8">
                            <span className="text-zinc-600 text-3xl font-black opacity-30">₹</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoFocus
                                value={requestAmount}
                                onChange={(e) => setRequestAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="0"
                                className="bg-transparent text-white text-xl font-black text-start w-full outline-none placeholder-zinc-800"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="flex-1 py-4 bg-zinc-800 rounded-xl text-zinc-400 font-bold uppercase tracking-widest text-[10px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendRequest}
                                disabled={!requestAmount || requestLoading}
                                className="flex-[2] py-4 gold-gradient text-black rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center"
                            >
                                {requestLoading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
