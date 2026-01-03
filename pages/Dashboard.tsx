
import React, { useState, useEffect } from 'react';
import { UserProfile, TransactionRecord } from '../types';
import BalanceCard from '../components/BalanceCard';
import SideDrawer from '../components/SideDrawer';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Menu,
  Bell,
  ChevronRight,
  Shield
} from 'lucide-react';
import { getTransactions, getProfileByStellarId } from '../services/db';

interface Props {
  profile: UserProfile | null;
}

const Dashboard: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;

      try {
        const res = await getTransactions(profile.stellarId);
        const uniqueTxs = res.slice(0, 20);
        setTxs(uniqueTxs);

        // Extract unique contact IDs
        const uniqueContactIds = Array.from(new Set(uniqueTxs.map(tx =>
          tx.fromId === profile.stellarId ? tx.toId : tx.fromId
        ))).filter(id => id !== profile.stellarId);

        // Fetch profiles for these contacts
        const contactProfiles = await Promise.all(uniqueContactIds.map(async (id) => {
          const p = await getProfileByStellarId(id);
          return {
            id,
            name: p?.displayName || id.split('@')[0],
            avatarSeed: p?.avatarSeed || id
          };
        }));

        setContacts(contactProfiles);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="pb-32 pt-5 px-6 bg-[#1A1A1A] min-h-screen text-white relative overflow-x-hidden">
      <SideDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        profileName={profile.displayName || profile.stellarId.split('@')[0]}
        stellarId={profile.stellarId}
        avatarSeed={profile.avatarSeed}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <button className="p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell size={24} />
        </button>
      </div>

      <BalanceCard publicKey={profile.publicKey} stellarId={profile.stellarId} />

      {/* Recent Contacts (Circles) */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold tracking-tight">Send Money Again</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-zinc-500 text-sm font-bold"
          >
            View All
          </button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
          {loading ? (
            <div className="flex gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full"></div>
                  <div className="h-3 bg-zinc-800 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="w-full text-center py-6 bg-zinc-900/30 rounded-3xl border border-white/5">
              <p className="text-zinc-500 text-sm font-bold">No recent contacts</p>
            </div>
          ) : contacts.map((contact: any) => (
            <button
              key={contact.id}
              onClick={() => navigate(`/send?to=${contact.id}`)}
              className="flex flex-col items-center gap-3 min-w-[72px] group"
            >
              <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-white/5 overflow-hidden group-hover:border-[#E5D5B3]/50 transition-all shadow-xl">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.avatarSeed}`}
                  alt={contact.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-bold text-zinc-400 capitalize truncate w-16 text-center">
                {contact.name}
              </span>
            </button>
          ))}
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
