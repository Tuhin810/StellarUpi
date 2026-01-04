
import React, { useEffect, useState } from 'react';
import { UserProfile, FamilyMember } from '../types';
import { getFamilyMembers, addFamilyMember } from '../services/db';
import { ArrowLeft, UserPlus, Shield, User, XCircle, AlertCircle, TrendingUp, Wallet, Settings } from 'lucide-react';
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

  const fetchMembers = async () => {
    if (profile) {
      const m = await getFamilyMembers(profile.uid);
      setMembers(m);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError('');
    try {
      // Create a shared secret for the member using their UID as the encryption key
      // This allows the member to pay "seamlessly" while keeping the key secure-ish
      const vaultKey = sessionStorage.getItem('temp_vault_key');
      if (!vaultKey) throw new Error("Vault locked. Unlock your own vault first.");

      const rawSecret = decryptSecret(profile.encryptedSecret, vaultKey);
      const memberInfo = await getUserById(newMemberId);
      if (!memberInfo) throw new Error("Target member not found");

      const sharedEncryptedSecret = encryptSecret(rawSecret, memberInfo.uid.toLowerCase());

      await addFamilyMember(profile.uid, newMemberId, parseFloat(newLimit), sharedEncryptedSecret);
      setNewMemberId('');
      setNewLimit('');
      fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      {/* Header */}
      <div className="pt-14 px-6 flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/")} className="p-3 bg-zinc-900/80 rounded-2xl text-zinc-400 hover:text-white border border-white/5 shadow-xl transition-all active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Family</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5D5B3] opacity-60">Authorized Vaults</p>
          </div>
        </div>
        <button className="p-3 bg-zinc-900/80 rounded-2xl text-zinc-400 border border-white/5 shadow-xl">
          <Settings size={20} />
        </button>
      </div>

      <div className="flex-1 px-6 pb-24 overflow-y-auto no-scrollbar space-y-10">
        {/* Authorization Form */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 mt-4 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5D5B3]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#E5D5B3]/10 border border-[#E5D5B3]/20 flex items-center justify-center text-[#E5D5B3]">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Access Control</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Authorize spending limits</p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Member Stellar ID"
                required
                className="w-full pl-14 pr-4 py-5 bg-zinc-800/40 border border-white/5 rounded-2xl focus:border-[#E5D5B3]/20 outline-none text-sm font-bold placeholder:text-zinc-700 transition-all shadow-inner"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
              />
            </div>

            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors font-black text-xs">₹</div>
              <input
                type="number"
                placeholder="Daily Spending Limit"
                required
                className="w-full pl-14 pr-4 py-5 bg-zinc-800/40 border border-white/5 rounded-2xl focus:border-[#E5D5B3]/20 outline-none text-sm font-bold placeholder:text-zinc-700 transition-all shadow-inner"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 font-bold text-xs">
                <XCircle size={14} /> {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full gold-gradient py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-black shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Authorize Vault Access'}
            </button>
          </form>
        </div>

        {/* Members List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600">Active Permissions</h4>
            <TrendingUp size={16} className="text-zinc-700" />
          </div>

          {members.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-zinc-900/20 border border-dashed border-white/5 rounded-[2.5rem]">
              <Wallet size={48} className="text-zinc-800 mb-4" />
              <p className="text-zinc-500 text-sm font-bold">Secure your family's future</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mt-2">No active members found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {members.map((member, idx) => (
                <div
                  key={member.id}
                  className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-[#E5D5B3]/20 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-[2rem] bg-zinc-800 border border-white/5 flex items-center justify-center p-1.5 shadow-xl relative overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.stellarId}`} className="w-full h-full object-cover rounded-2xl" />
                      <div className="absolute inset-0 bg-gold-gradient opacity-10"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-base truncate tracking-tight">{member.stellarId.split('@')[0]}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate mb-3">{member.stellarId}</p>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end text-[10px] font-bold">
                          <span className="text-[#E5D5B3]">₹{member.spentToday.toLocaleString()}</span>
                          <span className="text-zinc-600">/ ₹{member.dailyLimit.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/[0.02]">
                          <div
                            className="h-full gold-gradient shadow-[0_0_10px_rgba(229,213,179,0.3)]"
                            style={{ width: `${Math.min((member.spentToday / member.dailyLimit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="ml-4 p-4 text-zinc-700 hover:text-rose-500 transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-[#E5D5B3]/5 border border-[#E5D5B3]/10 p-8 rounded-[3rem] flex gap-6 animate-in fade-in zoom-in duration-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 gold-gradient opacity-[0.03] blur-3xl -mr-10 -mt-10"></div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[#E5D5B3] group-hover:scale-110 transition-transform shadow-xl">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-xs uppercase tracking-[0.2em] mb-2">Vault Protocol</p>
            <p className="text-zinc-400 text-xs font-bold leading-relaxed">
              Authorized members spend directly from your parent wallet up to their daily allocation. Limit resets automatically at GMT 00:00.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyManager;
