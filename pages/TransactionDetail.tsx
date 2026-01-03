
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, TransactionRecord } from '../types';
import { getTransactionById, getProfileByStellarId } from '../services/db';
import { ArrowLeft, Share2, Shield, CheckCircle2, XCircle, Clock, Copy, ExternalLink, Download } from 'lucide-react';

interface Props {
    profile: UserProfile | null;
}

const TransactionDetail: React.FC<Props> = ({ profile }) => {
    const { txId } = useParams<{ txId: string }>();
    const navigate = useNavigate();
    const [tx, setTx] = useState<TransactionRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (txId) {
            getTransactionById(txId).then(async (res) => {
                if (res) {
                    setTx(res);
                    const otherId = res.fromId === profile?.stellarId ? res.toId : res.fromId;
                    const op = await getProfileByStellarId(otherId);
                    setOtherProfile(op);
                }
                setLoading(false);
            });
        }
    }, [txId, profile]);

    if (loading) return (
        <div className="h-screen bg-[#1A1A1A] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#E5D5B3] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[#E5D5B3] font-black uppercase tracking-[0.3em] text-[10px]">Verifying Ledger</p>
        </div>
    );

    if (!tx || !profile) return (
        <div className="h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-8 text-center">
            <XCircle size={64} className="text-rose-500 mb-6 opacity-20" />
            <h2 className="text-xl font-black mb-2">Record Not Found</h2>
            <p className="text-zinc-500 text-sm mb-8">This transaction doesn't exist or you don't have permission to view it.</p>
            <button onClick={() => navigate(-1)} className="px-8 py-4 bg-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5">Go Back</button>
        </div>
    );

    const isSent = tx.fromId === profile.stellarId;
    const statusColor = tx.status === 'SUCCESS' ? 'text-emerald-500' : tx.status === 'PENDING' ? 'text-amber-500' : 'text-rose-500';
    const statusBg = tx.status === 'SUCCESS' ? 'bg-emerald-500/10' : tx.status === 'PENDING' ? 'bg-amber-500/10' : 'bg-rose-500/10';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
            {/* Header */}
            <div className="pt-5 px-3 flex items-center justify-between relative z-10 mb-8">
                <button onClick={() => navigate(-1)} className="p-3 bg-zinc-900/80 rounded-2xl text-zinc-400 hover:text-white border border-white/5 shadow-xl transition-all active:scale-95">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-black tracking-tight">Receipt</h2>
                <button className="p-3 bg-zinc-900/80 rounded-2xl text-zinc-400 border border-white/5 shadow-xl">
                    <Share2 size={20} />
                </button>
            </div>

            <div className="flex-1 px-6 pb-12 overflow-y-auto no-scrollbar">
                {/* Main Amount Section */}
                <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className={`w-20 h-20 rounded-[2rem] ${statusBg} flex items-center justify-center mb-6`}>
                        {tx.status === 'SUCCESS' ? <CheckCircle2 size={40} className="text-emerald-500" /> : tx.status === 'PENDING' ? <Clock size={40} className="text-amber-500" /> : <XCircle size={40} className="text-rose-500" />}
                    </div>
                    <p className={`text-sm font-black uppercase tracking-[0.2em] mb-2 ${statusColor}`}>Payment {tx.status}</p>
                    <h1 className="text-6xl font-black tracking-tighter  flex items-center gap-2">
                        <span className="text-zinc-600 text-3xl opacity-30">₹</span>{tx.amount.toLocaleString()}
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-4">
                        {tx.timestamp?.toDate().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                {/* Transfer Details Card */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 mb-8 shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-700">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 p-1 overflow-hidden shadow-inner">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isSent ? profile.stellarId : tx.fromId}`} className="w-full h-full" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate w-20 text-center">{isSent ? 'You' : (otherProfile?.displayName || tx.fromId.split('@')[0])}</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 px-4 opacity-20">
                            <div className="h-[2px] w-12 bg-zinc-800 relative">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 border-t-2 border-r-2 border-zinc-500" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 p-1 overflow-hidden shadow-inner">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isSent ? tx.toId : profile.stellarId}`} className="w-full h-full" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate w-20 text-center">{isSent ? (otherProfile?.displayName || tx.toId.split('@')[0]) : 'You'}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center group" onClick={() => copyToClipboard(tx.id)}>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Transaction ID</p>
                                <p className="text-xs font-bold font-mono text-zinc-400 truncate w-40 capitalize">{tx.id}</p>
                            </div>
                            <button className="p-2 text-zinc-700 group-hover:text-[#E5D5B3] transition-colors">
                                {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Method</p>
                                <p className="text-xs font-bold text-zinc-400 capitalize">{tx.isFamilySpend ? 'Family Vault Transfer' : 'Stellar Direct Pay'}</p>
                            </div>
                            <Shield size={16} className="text-zinc-700" />
                        </div>

                        {tx.txHash && (
                            <div className="flex justify-between items-center group">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Blockchain Hash</p>
                                    <p className="text-xs font-bold font-mono text-zinc-400 truncate w-48">{tx.txHash}</p>
                                </div>
                                <a href={`https://stellar.expert/explorer/public/tx/${tx.txHash}`} target="_blank" rel="noreferrer" className="p-2 text-zinc-700 group-hover:text-[#E5D5B3] transition-colors">
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
                    <button className="flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-white/5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-xl">
                        <Download size={18} className="text-zinc-500" /> Save PDF
                    </button>
                    <button className="flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-white/5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-xl">
                        <Share2 size={18} className="text-zinc-500" /> Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetail;
