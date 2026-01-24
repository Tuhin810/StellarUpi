
import React from 'react';
import { Receipt, CheckCircle2, ChevronRight } from 'lucide-react';
import { UserProfile } from '../../types';
import { getAvatarUrl } from '../../services/avatars';

interface Props {
    item: any;
    profile: UserProfile;
    navigate: (path: string) => void;
    memberProfiles: Record<string, UserProfile>;
}

const ActivityItem: React.FC<Props> = ({ item, profile, navigate, memberProfiles }) => {
    const isMe = item.senderId === profile.stellarId || item.paidBy === profile.stellarId;
    const isTx = item.itemType === 'tx';

    if (isTx) {
        const isPayer = item.paidBy === profile.stellarId;
        const mySplit = item.participants.find((p: any) => p.stellarId === profile.stellarId);
        const unpaidCount = item.participants.filter((p: any) => p.status === 'PENDING').length;

        return (
            <div className={`flex ${isPayer ? 'justify-end' : 'justify-start'} w-full mb-4 animate-in fade-in slide-in-from-bottom-3 duration-500`}>
                <div className={`relative max-w-[90%] w-full sm:w-auto min-w-[340px] bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 shadow-2xl transition-all hover:bg-zinc-900/80 group overflow-hidden`}>

                    {/* Subtle Gradient Glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E5D5B3]/5 blur-[60px] pointer-events-none" />

                    {/* Action Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#E5D5B3] flex items-center justify-center text-black shadow-[0_5px_20px_-5px_rgba(229,213,179,0.5)] transition-transform group-hover:scale-110">
                                <Receipt size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3]/60 mb-0.5">Split Bill</p>
                                <h4 className="font-black text-white text-lg leading-tight capitalize">{item.description}</h4>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black tracking-tighter text-white italic">₹{item.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Participants Summary - Sleeker Design */}
                    <div className="bg-black/20 rounded-[1.8rem] p-4 border border-white/5 flex items-center justify-between gap-4 mb-6">
                        <div className="flex -space-x-3 items-center">
                            {item.participants.slice(0, 5).map((p: any) => (
                                <div key={p.stellarId} className={`w-9 h-9 rounded-xl border-2 border-[#121212] bg-zinc-800 p-0.5 transition-all shadow-lg ${p.status === 'PAID' ? 'ring-2 ring-emerald-500/20 opacity-100' : 'opacity-40 grayscale'}`}>
                                    <img src={getAvatarUrl(memberProfiles[p.stellarId]?.avatarSeed || p.stellarId)} className="w-full h-full rounded-lg" />
                                </div>
                            ))}
                            {item.participants.length > 5 && (
                                <div className="w-9 h-9 rounded-xl border-2 border-[#121212] bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-400">
                                    +{item.participants.length - 5}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Status</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${unpaidCount === 0 ? 'text-emerald-400' : 'text-[#E5D5B3]'}`}>
                                {unpaidCount === 0 ? 'Fully Settled' : `${unpaidCount} Pending`}
                            </p>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Initiated By</span>
                            <span className="text-xs font-black text-white uppercase tracking-tight">
                                {isPayer ? 'YOU' : (memberProfiles[item.paidBy]?.displayName || item.paidBy.split('@')[0])}
                            </span>
                        </div>

                        {!isPayer && mySplit && mySplit.status === 'PENDING' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/send?to=${item.paidBy}&amt=${mySplit.amount}`);
                                }}
                                className="px-8 py-3.5 gold-gradient text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-[0_10px_30px_-10px_rgba(229,213,179,0.4)] flex items-center gap-2"
                            >
                                Pay ₹{mySplit.amount} <ChevronRight size={14} strokeWidth={4} />
                            </button>
                        )}
                        {(isPayer || (mySplit && mySplit.status === 'PAID')) && (
                            <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                <CheckCircle2 size={16} strokeWidth={3} /> Settled
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-3 w-full group mb-2 animate-in fade-in slide-in-from-bottom-1 duration-300`}>
            {!isMe && (
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden mb-1 flex-shrink-0 shadow-2xl transition-transform group-hover:scale-110">
                    <img src={getAvatarUrl(memberProfiles[item.senderId]?.avatarSeed || item.senderId)} className="w-full h-full" />
                </div>
            )}
            <div className={`max-w-[80%] shadow-2xl transition-all ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && (
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3]/60 mb-2 ml-1">
                        {memberProfiles[item.senderId]?.displayName || item.senderId.split('@')[0]}
                    </p>
                )}
                <div className={`relative px-5 py-3.5 rounded-[1.8rem] font-medium text-[17.5px] leading-relaxed shadow-2xl ${isMe ? 'bg-gradient-to-br from-[#E5D5B3] to-[#C4B592] text-zinc-950 rounded-tr-none' : 'bg-zinc-900/80 backdrop-blur-sm border border-white/10 text-white rounded-tl-none'}`}>
                    {item.text}
                    <div className={`mt-1.5 flex justify-end items-center gap-1.5`}>
                        <span className={`text-[8px] font-black uppercase tracking-tighter ${isMe ? 'text-black/40' : 'text-zinc-600'}`}>
                            {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCircle2 size={8} className="text-black/40" strokeWidth={3} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;
