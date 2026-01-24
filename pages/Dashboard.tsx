
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, TransactionRecord } from '../types';
import BalanceCard from '../components/BalanceCard';
import SideDrawer from '../components/SideDrawer';
import DashboardHeader from '../components/DashboardHeader';
import QuickActions from '../components/QuickActions';
import PeopleList from '../components/PeopleList';
import ReceiveQRModal from '../components/ReceiveQRModal';
import CreateGroupModal from '../components/CreateGroupModal';
import { getTransactions, getProfileByStellarId, getGroups } from '../services/db';

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
      />

      <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />

      <BalanceCard publicKey={profile.publicKey} stellarId={profile.stellarId} />

      <QuickActions onReceiveClick={() => navigate('/receive')} />

      <PeopleList
        contacts={contacts}
        loading={loading}
        onCreateGroupClick={() => setShowCreateGroup(true)}
      />

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
