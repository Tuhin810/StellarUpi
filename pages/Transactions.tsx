
import React, { useEffect, useState } from 'react';
import { UserProfile, TransactionRecord } from '../types';
import { getTransactions, getProfileByStellarId, getProfileByPublicKey } from '../services/db';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Shield, Search, Calendar, ShoppingBag, Utensils, Plane, Receipt, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';

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
  const [activeCategory, setActiveCategory] = useState<TransactionRecord['category'] | 'All'>('All');

  useEffect(() => {
    if (profile) {
      getTransactions(profile.stellarId).then(async (res) => {
        setTxs(res);

        // Resolve names for all unique IDs
        const uniqueIds = Array.from(new Set(res.flatMap(tx => [tx.fromId, tx.toId])))
          .filter(id => id !== profile.stellarId);

        const nameMap: Record<string, string> = {};
        await Promise.all(uniqueIds.map(async (id) => {
          // 1. Try resolving by Stellar ID
          let p = await getProfileByStellarId(id);

          // 2. If not found and it looks like a public key, try resolving by public key
          if (!p && id.startsWith('G') && id.length === 56) {
            p = await getProfileByPublicKey(id);
          }

          if (p?.displayName) nameMap[id] = p.displayName;
        }));

        setNames(nameMap);
        setLoading(false);
      });
    }
  }, [profile]);

  const exportToCSV = () => {
    if (txs.length === 0) return;

    const headers = ['Date', 'From', 'To', 'Amount', 'Currency', 'Category', 'Status', 'ID'];
    const rows = txs.map(tx => [
      tx.timestamp?.toDate().toLocaleString(),
      tx.fromId,
      tx.toId,
      tx.amount,
      tx.currency,
      tx.category || 'Other',
      tx.status,
      tx.id
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ching Pay_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white pb-32">
      {/* Header */}
      <div className="pt-5 px-3 flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">

          {/* <h2 className="text-3xl font-black tracking-tighter">History</h2> */}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="p-2 text-zinc-400 hover:text-[#E5D5B3] transition-colors"
          >
            <Download size={24} />
          </button>
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

      {/* Category Filter */}
      <div className="px-5 mb-8 flex gap-3 overflow-x-auto no-scrollbar">
        {(['All', 'Shopping', 'Food', 'Travel', 'Bills', 'Entertainment', 'Other'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === cat
              ? 'bg-[#E5D5B3] text-black border-[#E5D5B3]'
              : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/10'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

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
          <div className="space-y-4">
            {txs
              .filter(tx => !tx.isIncognito)
              .filter(tx => {
                const query = searchQuery.toLowerCase();
                const matchesSearch = (
                  tx.fromId.toLowerCase().includes(query) ||
                  tx.toId.toLowerCase().includes(query) ||
                  tx.amount.toString().includes(query) ||
                  tx.status?.toLowerCase().includes(query) ||
                  tx.memo?.toLowerCase().includes(query)
                );
                const matchesCategory = activeCategory === 'All' || tx.category === activeCategory;
                return matchesSearch && matchesCategory;
              })
              .map((tx) => {
                const isSent = tx.fromId === profile?.stellarId;
                const otherId = isSent ? tx.toId : tx.fromId;
                const displayName = names[otherId] || (otherId.length > 15 ? `${otherId.substring(0, 6)}...${otherId.slice(-4)}` : otherId.split('@')[0]);
                const isStellarId = otherId.includes('@');
                const isRawKey = !isStellarId && otherId.startsWith('G');

                return (
                  <div
                    key={tx.id}
                    onClick={() => navigate(`/transaction/${tx.id}`)}
                    className="flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer active:scale-[0.98] transition-all py-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSent ? 'bg-zinc-900 border border-white/5 text-zinc-500' : 'bg-[#E5D5B3]/10 border border-[#E5D5B3]/20 text-[#E5D5B3]'}`}>
                        {tx.category === 'Shopping' && <ShoppingBag size={18} />}
                        {tx.category === 'Food' && <Utensils size={18} />}
                        {tx.category === 'Travel' && <Plane size={18} />}
                        {tx.category === 'Bills' && <Receipt size={18} />}
                        {tx.category === 'Entertainment' && <Play size={18} />}
                        {(tx.category === 'Other' || !tx.category) && (isSent ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />)}
                      </div>
                      <div>
                        <p className={`font-bold ${isRawKey && !names[otherId] ? 'text-xs' : 'text-sm'} leading-none mb-1 truncate`}>
                          {isSent ? `To: ${displayName}` : `From: ${displayName}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                            {tx.timestamp?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                          {tx.category && (
                            <>
                              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                              <p className="text-[9px] font-bold text-[#E5D5B3]/60 uppercase tracking-widest">{tx.category}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-base tracking-tight ${isSent ? 'text-white' : 'text-[#E5D5B3]'}`}>
                        {isSent ? '-' : '+'}₹{tx.amount.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${tx.status === 'SUCCESS' ? 'text-emerald-500/60' : 'text-rose-500'}`}>
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
