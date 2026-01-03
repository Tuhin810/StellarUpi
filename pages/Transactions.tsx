
import React, { useEffect, useState } from 'react';
import { UserProfile, TransactionRecord } from '../types';
import { getTransactions } from '../services/db';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Shield, Search, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  profile: UserProfile | null;
}

const Transactions: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      getTransactions(profile.stellarId).then(res => {
        setTxs(res);
        setLoading(false);
      });
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white pb-32">
      {/* Header */}
      <div className="pt-16 px-8 flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 text-zinc-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-black tracking-tighter">History</h2>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-zinc-400">
            <Search size={24} />
          </button>
        </div>
      </div>

      <div className="px-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#E5D5B3] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Syncing Ledger</p>
          </div>
        ) : txs.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 rounded-[2.5rem] border border-white/5 mx-2">
            <Calendar size={48} className="mx-auto text-zinc-800 mb-6" />
            <h3 className="text-lg font-black mb-2 tracking-tight">Empty Record</h3>
            <p className="text-zinc-500 text-sm font-medium">Your activity will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {txs.map((tx) => {
              const isSent = tx.fromId === profile?.stellarId;
              return (
                <div key={tx.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSent ? 'bg-zinc-800/80 text-zinc-500' : 'bg-[#E5D5B3]/20 text-[#E5D5B3]'}`}>
                      {isSent ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-base leading-none mb-1">
                        {isSent ? `To: ${tx.toId.split('@')[0]}` : `From: ${tx.fromId.split('@')[0]}`}
                      </p>
                      <p className="text-xs font-medium text-zinc-500">
                        {tx.timestamp?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg tracking-tight ${isSent ? 'text-white' : 'text-[#E5D5B3]'}`}>
                      {isSent ? '-' : '+'}₹{tx.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${tx.status === 'SUCCESS' ? 'text-emerald-500/60' : 'text-rose-500'}`}>
                        {tx.status}
                      </span>
                      {tx.isFamilySpend && <Shield size={8} className="text-zinc-500 ml-1" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
