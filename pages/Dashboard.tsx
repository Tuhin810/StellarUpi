
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, TransactionRecord } from '../types';
import BalanceCard from '../components/BalanceCard';
import SideDrawer from '../components/SideDrawer';
import DashboardHeader from '../components/DashboardHeader';
import QuickActions from '../components/QuickActions';
import RewardsCTA from '../components/RewardsCTA';
import PeopleList from '../components/PeopleList';
import ReceiveQRModal from '../components/ReceiveQRModal';
import CreateGroupModal from '../components/CreateGroupModal';
import { getTransactions, getProfileByStellarId, getGroups } from '../services/db';
import StreakFire from '../components/StreakFire';
import { Shield } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
}

interface Contact {
  id: string;
  name: string;
  avatarSeed: string;
  isGroup?: boolean;
  memberAvatars?: string[];
}

const Dashboard: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;

      try {
        const res = await getTransactions(profile.stellarId);
        const uniqueTxs = res.slice(0, 20);

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

        const groupItems = await Promise.all(userGroups.map(async (g: any) => {
          // Fetch avatars for up to 4 members
          const membersToFetch = g.members.slice(0, 4);
          const memberProfiles = await Promise.all(membersToFetch.map(async (mId: string) => {
            const p = await getProfileByStellarId(mId);
            return p?.avatarSeed || mId;
          }));

          return {
            id: g.id,
            name: g.name,
            avatarSeed: g.avatarSeed || g.name,
            isGroup: true,
            memberAvatars: memberProfiles
          };
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
    <div className="pb-32 pt-5 px-6 bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] min-h-screen text-white relative overflow-x-hidden">
      <SideDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        profileName={profile.displayName || profile.stellarId.split('@')[0]}
        stellarId={profile.stellarId}
        avatarSeed={profile.avatarSeed}
        streak={profile.currentStreak}
        streakLevel={profile.streakLevel || 'orange'}
      />

      <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />


      <BalanceCard publicKey={profile.publicKey} stellarId={profile.stellarId} />

      {/* Compact Premium Security Alert */}
      {!profile.pin && (
        <div className="relative mx-0 mt-10 mb-8 overflow-hidden rounded-[1.5rem] border border-amber-500/20 bg-zinc-900/40 p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/5 blur-[40px]"></div>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                <Shield size={20} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight text-white mb-0.5">Unsecured Vault</h4>
                <p className="text-[10px] font-medium text-zinc-500">Enable PIN for full protection</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="rounded-lg bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Secure
            </button>
          </div>
        </div>
      )}

      <QuickActions onReceiveClick={() => navigate('/receive')} />


      <PeopleList
        contacts={contacts}
        loading={loading}
        onCreateGroupClick={() => setShowCreateGroup(true)}
      />

      <RewardsCTA />


      {showCreateGroup && (
        <CreateGroupModal
          contacts={contacts}
          stellarId={profile.stellarId}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      {showQR && (
        <ReceiveQRModal
          stellarId={profile.stellarId}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
