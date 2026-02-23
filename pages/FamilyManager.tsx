import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, FamilyMember } from '../types';
import {
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
  getProfileByStellarId,
  getUserById
} from '../services/db';
import { ArrowLeft, Plus, User, X, Users, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { decryptSecret, encryptSecret } from '../services/encryption';
import { KYCService } from '../services/kycService';
import { getAvatarUrl } from '../services/avatars';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (!profile) return;

    const m = await getFamilyMembers(profile.uid);
    setMembers(m);

    const profiles: Record<string, UserProfile> = {};
    await Promise.all(
      m.map(async (member) => {
        const p = await getProfileByStellarId(member.stellarId);
        if (p) profiles[member.stellarId] = p;
      })
    );

    setMemberProfiles(profiles);
  };

  useEffect(() => {
    fetchMembers();
  }, [profile]);

  const totalFamilySpent = useMemo(
    () => members.reduce((sum, m) => sum + (m.spentToday || 0), 0),
    [members]
  );

  const totalDailyLimit = useMemo(
    () => members.reduce((sum, m) => sum + (m.dailyLimit || 0), 0),
    [members]
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    setError('');

    try {
      const phone = localStorage.getItem('ching_phone') || '';
      const currentPin = profile.pin || '0000';

      let vaultKey = KYCService.deriveEncryptionKey(phone, currentPin);
      let rawSecret = decryptSecret(profile.encryptedSecret, vaultKey);

      if ((!rawSecret || !rawSecret.startsWith('S')) && currentPin !== '0000') {
        const fallbackKey = KYCService.deriveEncryptionKey(phone, '0000');
        rawSecret = decryptSecret(profile.encryptedSecret, fallbackKey);
      }

      if (!rawSecret || !rawSecret.startsWith('S')) {
        throw new Error(
          'Unable to access your wallet. Please logout and login again.'
        );
      }

      const memberInfo = await getUserById(newMemberId);
      if (!memberInfo) throw new Error('Target member not found');

      const sharedEncryptedSecret = encryptSecret(
        rawSecret,
        memberInfo.uid.toLowerCase()
      );

      await addFamilyMember(
        profile.uid,
        newMemberId,
        parseFloat(newLimit),
        sharedEncryptedSecret
      );

      setNewMemberId('');
      setNewLimit('');
      setShowAddForm(false);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
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
      setError(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col relative overflow-hidden">
      {/* Background Aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#E5D5B3]/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#C5B38F]/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="pt-8 px-6 flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate('/')}
          className="w-11 h-11 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-2xl active:scale-95 transition-all text-zinc-300"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Family Vault</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Shield size={10} className="text-[#C5B38F]" />
            <span className="text-[9px] font-black text-[#C5B38F]/80 uppercase tracking-widest">Secure Access Control</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="w-11 h-11 flex items-center justify-center bg-[#E5D5B3] text-black rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(229,213,179,0.2)]"
        >
          <Plus size={22} />
        </button>
      </div>

      <div className="flex-1 px-6 pt-10 pb-32 overflow-y-auto no-scrollbar relative z-10">

        {/* Main Spending Card - Project Theme Style */}
        <div className="flex flex-col items-center py-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-72 h-72 rounded-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-white/10 relative flex flex-col items-center justify-center shadow-2xl overflow-hidden"
          >
            {/* Internal Aesthetic Glows */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E5D5B3]/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -inset-10 bg-white/[0.02] blur-3xl pointer-events-none" />

            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Aggregate Spending
            </p>

            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-zinc-400">₹</span>
              <p className="text-5xl font-black tracking-tighter text-white tabular-nums">
                {Math.floor(totalFamilySpent).toLocaleString('en-IN')}
                <span className="text-2xl text-zinc-500">.{(totalFamilySpent % 1).toFixed(2).split('.')[1]}</span>
              </p>
            </div>

          </motion.div>

          <div className="flex gap-12 mt-10">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{members.length}</p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 pl-1">Members</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-black text-[#E5D5B3]">
                ₹{totalDailyLimit.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 pl-1">Daily Limit</p>
            </div>
          </div>
        </div>

        {/* Members List Header */}
        <div className="mt-12 flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Authorized Membership List</h3>
          <div className="h-px flex-1 bg-white/5 mx-4" />
          <Users size={14} className="text-zinc-800" />
        </div>

        {/* Members List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {members.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/40 border border-dashed border-white/10 rounded-3xl p-12 text-center"
              >
                <Users size={32} className="mx-auto text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                  No Active Authorized Members
                </p>
              </motion.div>
            ) : (
              members.map((member, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  key={member.id}
                  className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 hover:bg-zinc-900/80 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shadow-xl">
                      <img
                        src={getAvatarUrl(
                          memberProfiles[member.stellarId]?.avatarSeed ||
                          member.stellarId
                        )}
                        className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0"
                        alt={member.stellarId}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-black text-sm text-white/90 uppercase tracking-tight">
                          {memberProfiles[member.stellarId]?.displayName ||
                            member.stellarId.split('@')[0]}
                        </p>
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-black tabular-nums">
                        <span className="text-[#E5D5B3]">
                          ₹{member.spentToday.toLocaleString()}
                        </span>
                        <span className="text-zinc-700 uppercase tracking-widest text-[9px]">
                          Limit: ₹{member.dailyLimit.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-3 h-1.5 bg-black rounded-full overflow-hidden border border-white/[0.03]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min((member.spentToday / member.dailyLimit) * 100, 100)}%`
                          }}
                          className="h-full bg-gradient-to-r from-[#E5D5B3] to-[#C5B38F] rounded-full shadow-[0_0_10px_rgba(229,213,179,0.2)]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Member Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAddForm(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-zinc-950 rounded-t-[3rem] p-8 pb-12 border-t border-white/10"
            >
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-8" />

              <div className="mb-8">
                <h3 className="text-xl font-black text-white tracking-tight uppercase">Provision Member</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Configure individual spending authority</p>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1">
                    Member Stellar ID
                  </label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors" />
                    <input
                      type="text"
                      required
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-black outline-none focus:border-[#E5D5B3]/20 transition-all text-sm placeholder:text-zinc-800"
                      placeholder="user@domain"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1">
                    Daily Expenditure Limit (₹)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-sm group-focus-within:text-[#E5D5B3] transition-colors">₹</span>
                    <input
                      type="number"
                      required
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-black outline-none focus:border-[#E5D5B3]/20 transition-all text-sm placeholder:text-zinc-800"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E5D5B3] text-black py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full" />
                  ) : 'Grant Authorization'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyManager;