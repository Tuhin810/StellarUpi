
import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, FamilyMember } from '../types';
import { getFamilyMembers, addFamilyMember, removeFamilyMember } from '../services/db';
import { ArrowLeft, Plus, User, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { decryptSecret, encryptSecret } from '../services/encryption';
import { getUserById } from '../services/db';

interface Props {
  profile: UserProfile | null;
}

const FamilyManager: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [newMemberId, setNewMemberId] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchMembers = async () => {
    if (profile) {
      const m = await getFamilyMembers(profile.uid);
      setMembers(m);
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
      const vaultKey = sessionStorage.getItem('temp_vault_key');
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
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.stellarId}`}
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

      {/* Add Member Form (Slide down) */}
      {showAddForm && (
        <div className="px-6 mb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Member Stellar ID"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm placeholder:text-white/30 outline-none focus:border-[#E5D5B3]/30 transition-all"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">₹</span>
                <input
                  type="number"
                  placeholder="Daily Limit"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm placeholder:text-white/30 outline-none focus:border-[#E5D5B3]/30 transition-all"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-rose-400 text-xs px-2">{error}</p>
              )}
              <button
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#E5D5B3] text-black font-bold text-sm hover:bg-[#d4c4a2] transition-all disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>
        </div>
      )}

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
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.stellarId}`}
                    className="w-full h-full object-cover"
                    alt={member.stellarId}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{member.stellarId.split('@')[0]}</p>
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
