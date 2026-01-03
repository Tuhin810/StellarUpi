
import React, { useState, useEffect } from 'react';
import { UserProfile, TransactionRecord } from '../types';
import BalanceCard from '../components/BalanceCard';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Menu,
  Bell,
  ChevronRight,
  Shield
} from 'lucide-react';
import { getTransactions } from '../services/db';

interface Props {
  profile: UserProfile | null;
}

const Dashboard: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      getTransactions(profile.stellarId).then(res => {
        setTxs(res.slice(0, 5));
        setLoading(false);
      });
    }
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="pb-32 pt-5 px-6 bg-[#1A1A1A] min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <button className="p-2 text-zinc-400">
          <Menu size={24} />
        </button>
        <button className="p-2 text-zinc-400">
          <Bell size={24} />
        </button>
      </div>

      <BalanceCard publicKey={profile.publicKey} stellarId={profile.stellarId} />

      {/* Recent Transactions Section */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold tracking-tight">Recent Transactions</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-zinc-500 text-sm font-bold"
          >
            View All
          </button>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : txs.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/50 rounded-3xl border border-white/5">
              <p className="text-zinc-500 font-bold">No recent transfers</p>
            </div>
          ) : txs.map((tx) => {
            const isSent = tx.fromId === profile.stellarId;
            return (
              <div key={tx.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSent ? 'bg-[#E5D5B3]/10 text-[#E5D5B3]' : 'bg-[#E5D5B3]/20 text-[#E5D5B3]'}`}>
                    {isSent ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-base leading-none mb-1">
                      {isSent ? `To: ${tx.toId.split('@')[0]}` : `From: ${tx.fromId.split('@')[0]}`}
                    </p>
                    <p className="text-xs font-medium text-zinc-500">
                      {tx.timestamp?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} •
                      {tx.timestamp?.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-base ${isSent ? 'text-white' : 'text-[#E5D5B3]'}`}>
                    {isSent ? '-' : '+'}₹{tx.amount.toLocaleString()}
                  </p>
                  {tx.isFamilySpend && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 justify-end mt-0.5">
                      <Shield size={8} /> Family
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Insight Card (matching bottom of image) */}
      <div className="mt-12 bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-zinc-400 leading-relaxed">
            Good Job! Your Spending have reduced by <span className="text-white">18%</span> from last month.
          </p>
        </div>
        <button className="text-[#E5D5B3] text-xs font-black uppercase tracking-widest ml-4 whitespace-nowrap">
          View Details
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
