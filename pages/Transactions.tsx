
import React, { useEffect, useState } from 'react';
import { UserProfile, TransactionRecord } from '../types';
import { getTransactions, getProfileByStellarId } from '../services/db';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Shield, Search, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  profile: UserProfile | null;
}

const Transactions: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile) {
      getTransactions(profile.stellarId).then(async (res) => {
        setTxs(res);

        // Resolve names for all unique IDs
        const uniqueIds = Array.from(new Set(res.flatMap(tx => [tx.fromId, tx.toId])))
          .filter(id => id !== profile.stellarId);

        const nameMap: Record<string, string> = {};
        await Promise.all(uniqueIds.map(async (id) => {
          const p = await getProfileByStellarId(id);
          if (p?.displayName) nameMap[id] = p.displayName;
        }));

        setNames(nameMap);
        setLoading(false);
      });
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white pb-32">
      {/* Header */}
      <div className="pt-5 px-3 flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 text-zinc-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-black tracking-tighter">History</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 transition-all ${showSearch ? 'text-[#E5D5B3]' : 'text-zinc-400'}`}
          >
            <Search size={24} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-5 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors" size={18} />
            <input
              autoFocus
              type="text"
              placeholder="Search ID, amount, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 font-bold text-sm outline-none focus:border-[#E5D5B3]/20 transition-all placeholder-zinc-800"
            />
          </div>
        </div>
      )}

      <div className="px-5 space-y-8">
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
            {txs
              .filter(tx => {
                const query = searchQuery.toLowerCase();
                return (
                  tx.fromId.toLowerCase().includes(query) ||
                  tx.toId.toLowerCase().includes(query) ||
                  tx.amount.toString().includes(query) ||
                  tx.status?.toLowerCase().includes(query)
                );
              })
              .map((tx) => {
                const isSent = tx.fromId === profile?.stellarId;
                return (
                  <div
                    key={tx.id}
                    onClick={() => navigate(`/transaction/${tx.id}`)}
                    className="flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSent ? 'bg-zinc-800/80 text-zinc-500' : 'bg-[#E5D5B3]/20 text-[#E5D5B3]'}`}>
                        {isSent ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-base leading-none mb-1">
                          {isSent
                            ? `To: ${names[tx.toId] || tx.toId.split('@')[0]}`
                            : `From: ${names[tx.fromId] || tx.fromId.split('@')[0]}`}
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
            {txs.filter(tx => {
              const query = searchQuery.toLowerCase();
              return (
                tx.fromId.toLowerCase().includes(query) ||
                tx.toId.toLowerCase().includes(query) ||
                tx.amount.toString().includes(query) ||
                tx.status?.toLowerCase().includes(query)
              );
            }).length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <p className="text-xs font-black uppercase tracking-widest">No matching transactions</p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
