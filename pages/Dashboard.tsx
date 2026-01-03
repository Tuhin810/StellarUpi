
import React, { useState, useEffect } from 'react';
import { UserProfile, TransactionRecord } from '../types';
import BalanceCard from '../components/BalanceCard';
import SideDrawer from '../components/SideDrawer';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Shield,
  QrCode,
  Send,
  Download,
  Menu,
  Bell,
  Users,
  Plus,
  UserPlus,
  Check
} from 'lucide-react';
import { getTransactions, getProfileByStellarId, createGroup, getGroups } from '../services/db';

interface Props {
  profile: UserProfile | null;
}

const Dashboard: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

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

        // Fetch Groups
        const userGroups = await getGroups(profile.stellarId);

        const groupItems = userGroups.map((g: any) => ({
          id: g.id,
          name: g.name,
          avatarSeed: g.avatarSeed || g.name,
          isGroup: true
        }));

        setContacts([...groupItems, ...contactProfiles]);
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

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-4 mt-10">
        {[
          { icon: <QrCode size={20} />, label: 'Scan', path: '/scan' },
          { icon: <Send size={20} />, label: 'Send', path: '/send' },
          { icon: <Download size={20} />, label: 'Receive', path: '/receive' },
          { icon: <Users size={20} />, label: 'Family', path: '/family' }
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 bg-zinc-900/80 border border-white/5 rounded-2xl flex items-center justify-center text-[#E5D5B3] shadow-lg hover:bg-zinc-800 transition-all active:scale-90">
              {action.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Contacts (Circles) */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black tracking-tight">Send Money Again</h3>
          <button className="text-[#E5D5B3] text-xs font-black uppercase tracking-widest opacity-60">View All</button>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
          {/* Create Group Button */}
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex flex-col items-center gap-3 min-w-[72px] group"
          >
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-[#E5D5B3]/20 flex items-center justify-center text-[#E5D5B3] group-hover:bg-[#E5D5B3] group-hover:text-black transition-all shadow-xl">
              <UserPlus size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E5D5B3]">New Group</span>
          </button>

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
              onClick={() => navigate(contact.isGroup ? `/group/${contact.id}` : `/chat/${contact.id}`)}
              className="flex flex-col items-center gap-3 min-w-[72px] group"
            >
              <div className={`w-16 h-16 rounded-3xl bg-zinc-800 border border-white/5 overflow-hidden group-hover:border-[#E5D5B3]/50 transition-all shadow-xl ${contact.isGroup ? 'p-1' : ''}`}>
                <img
                  src={`https://api.dicebear.com/7.x/${contact.isGroup ? 'identicon' : 'avataaars'}/svg?seed=${contact.avatarSeed}`}
                  alt={contact.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors truncate w-16 text-center">{contact.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCreateGroup(false)}></div>
          <div className="relative w-full max-w-sm bg-zinc-900 rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
            <h3 className="text-xl font-black mb-1">Create Group</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">Split expenses with friends</p>

            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 font-bold text-sm mb-6 outline-none focus:border-[#E5D5B3]/20"
            />

            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4 px-2">Select Members</p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 -mx-2 px-2">
              {contacts.filter(c => !c.isGroup).map(c => {
                const isSelected = selectedMembers.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (isSelected) setSelectedMembers(prev => prev.filter(id => id !== c.id));
                      else setSelectedMembers(prev => [...prev, c.id]);
                    }}
                    className="flex flex-col items-center gap-2 min-w-[60px] relative"
                  >
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[#E5D5B3] scale-90' : 'border-transparent opacity-40'}`}>
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatarSeed}`} className="w-full h-full" />
                    </div>
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-5 h-5 bg-[#E5D5B3] rounded-full flex items-center justify-center text-black">
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-tighter truncate w-14 text-center">{c.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowCreateGroup(false)} className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-500">Cancel</button>
              <button
                disabled={!groupName || selectedMembers.length === 0 || isCreating}
                onClick={async () => {
                  setIsCreating(true);
                  try {
                    const id = await createGroup({
                      name: groupName,
                      members: [profile.stellarId, ...selectedMembers],
                      createdBy: profile.stellarId,
                      avatarSeed: groupName
                    });
                    navigate(`/group/${id}`);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsCreating(false);
                  }
                }}
                className="flex-[2] py-4 gold-gradient text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30 flex items-center justify-center"
              >
                {isCreating ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

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
