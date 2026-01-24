
import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, FamilyMember } from '../types';
import { getFamilyMembers, addFamilyMember, removeFamilyMember, getProfileByStellarId } from '../services/db';
import { ArrowLeft, Plus, User, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { decryptSecret, encryptSecret } from '../services/encryption';
import { getAvatarUrl } from '../services/avatars';
import { getUserById } from '../services/db';

interface Props {
  profile: UserProfile | null;
}

const FamilyManager: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
  const [newMemberId, setNewMemberId] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchMembers = async () => {
    if (profile) {
      const m = await getFamilyMembers(profile.uid);
      setMembers(m);

      const profiles: Record<string, UserProfile> = {};
      await Promise.all(m.map(async (member) => {
        const p = await getProfileByStellarId(member.stellarId);
        if (p) profiles[member.stellarId] = p;
      }));
      setMemberProfiles(profiles);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [profile]);

  // Calculate total spent by all family members
  const totalFamilySpent = useMemo(() => {
    return members.reduce((sum, member) => sum + (member.spentToday || 0), 0);
  }, [members]);

  // Calculate total daily limit
  const totalDailyLimit = useMemo(() => {
    return members.reduce((sum, member) => sum + (member.dailyLimit || 0), 0);
  }, [members]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError('');
    try {
      const vaultKey = localStorage.getItem('temp_vault_key');
      if (!vaultKey) throw new Error("Vault locked. Unlock your own vault first.");

      const rawSecret = decryptSecret(profile.encryptedSecret, vaultKey);
      const memberInfo = await getUserById(newMemberId);
      if (!memberInfo) throw new Error("Target member not found");

      const sharedEncryptedSecret = encryptSecret(rawSecret, memberInfo.uid.toLowerCase());

      await addFamilyMember(profile.uid, newMemberId, parseFloat(newLimit), sharedEncryptedSecret);
      setNewMemberId('');
      setNewLimit('');
      setShowAddForm(false);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!window.confirm('Remove this family member?')) return;
    try {
      await removeFamilyMember(memberId);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col">
      {/* Header */}
      <div className="pt-5 px-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Family Vault</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E5D5B3]/20 text-[#E5D5B3] hover:bg-[#E5D5B3]/30 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Centered Circular Balance Card */}
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E5D5B3]/20 via-transparent to-[#E5D5B3]/10 blur-xl scale-110"></div>

          {/* Main circular card */}
          <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-[#1a2520] via-[#0d1510] to-[#1a2520] border border-white/10 flex flex-col items-center justify-center shadow-2xl">
            {/* Inner subtle ring */}
            <div className="absolute inset-4 rounded-full border border-white/5"></div>

            {/* Content */}
            <p className="text-white/40 text-sm font-medium mb-2">Family Spending</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              ₹{totalFamilySpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-white/30 text-xs mt-2">Today's Usage</p>

            {/* Member avatars at bottom */}
            <div className="flex items-center mt-6 -space-x-2">
              {members.slice(0, 3).map((member, idx) => (
                <div
                  key={member.id}
                  className="w-9 h-9 rounded-full border-2 border-[#0d1510] overflow-hidden bg-zinc-800"
                >
                  <img
                    src={getAvatarUrl(memberProfiles[member.stellarId]?.avatarSeed || member.stellarId)}
                    className="w-full h-full object-cover"
                    alt={member.stellarId}
                  />
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-9 h-9 rounded-full border-2 border-[#0d1510] bg-[#E5D5B3]/20 flex items-center justify-center text-[10px] font-bold text-[#E5D5B3]">
                  +{members.length - 3}
                </div>
              )}
              {members.length === 0 && (
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                  <Users size={14} className="text-white/30" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats below circle */}
        <div className="flex gap-8 mt-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{members.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Members</p>
          </div>
          <div className="w-px bg-white/10"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#E5D5B3]">₹{totalDailyLimit.toLocaleString('en-IN')}</p>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Daily Limit</p>
          </div>
        </div>
      </div>

      {/* Add Member Bottom Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${showAddForm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAddForm(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2rem] transition-transform duration-300 ease-out ${showAddForm ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ height: '50vh', minHeight: '380px' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-zinc-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 pt-3">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Add Family Member</h3>
              <p className="text-[14px] font-black text-zinc-500 mt-1">Share your wallet access</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleAdd} className="px-6 flex flex-col gap-5">
            {/* Member ID Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <User size={20} className="text-zinc-500" />
              </div>
              <input
                type="text"
                placeholder="Member Stellar ID"
                required
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                autoFocus={showAddForm}
                className="w-full pl-12 pr-4 py-4 bg-zinc-800/60 border border-white/10 rounded-2xl text-white text-lg font-medium placeholder-zinc-600 focus:outline-none focus:border-[#E5D5B3]/40 focus:ring-2 focus:ring-[#E5D5B3]/20 transition-all"
              />
            </div>

            {/* Daily Limit Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <span className="text-zinc-500 text-xl font-medium">₹</span>
              </div>
              <input
                type="number"
                placeholder="Daily Limit"
                required
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-zinc-800/60 border border-white/10 rounded-2xl text-white text-lg font-medium placeholder-zinc-600 focus:outline-none focus:border-[#E5D5B3]/40 focus:ring-2 focus:ring-[#E5D5B3]/20 transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-rose-400 text-sm font-medium px-2">{error}</p>
            )}

            {/* Add Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full gold-gradient text-black py-4 rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={20} />
                  <span>Add Member</span>
                </>
              )}
            </button>

            {/* Hint Text */}
            <p className="text-zinc-500 text-xs font-medium text-center">
              Member will be able to spend from your wallet within the daily limit
            </p>
          </form>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 px-6 pb-32">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">Active Members</p>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Users size={32} className="text-white/20 mb-3" />
            <p className="text-white/40 text-sm">No family members yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-[#E5D5B3] text-sm font-medium"
            >
              + Add your first member
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white/[0.07] transition-all"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                  <img
                    src={getAvatarUrl(memberProfiles[member.stellarId]?.avatarSeed || member.stellarId)}
                    className="w-full h-full object-cover"
                    alt={member.stellarId}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{memberProfiles[member.stellarId]?.displayName || member.stellarId.split('@')[0]}</p>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">@{member.stellarId.split('@')[0]}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#E5D5B3] text-xs font-medium">₹{member.spentToday.toLocaleString()}</span>
                    <span className="text-white/20 text-xs">/</span>
                    <span className="text-white/40 text-xs">₹{member.dailyLimit.toLocaleString()}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#E5D5B3] to-[#c4b493] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((member.spentToday / member.dailyLimit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyManager;
