
import React, { useEffect, useState } from 'react';
import { UserProfile, FamilyMember } from '../types';
import { getFamilyMembers, addFamilyMember } from '../services/db';
import { ArrowLeft, UserPlus, Shield, User, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      await addFamilyMember(profile.uid, newMemberId, parseFloat(newLimit));
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
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="pt-12 px-6 flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900">Family Wallet</h2>
      </div>

      <div className="px-6 space-y-8">
        <form onSubmit={handleAdd} className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl text-white">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={24} />
            <h3 className="text-lg font-bold">Add Family Member</h3>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
              <input
                type="text"
                placeholder="Member ID (name@stellar)"
                required
                className="w-full pl-12 pr-4 py-4 bg-white/10 border-0 rounded-2xl focus:ring-2 focus:ring-white/50 text-white font-bold placeholder:text-white/50"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 font-bold">₹</span>
              <input
                type="number"
                placeholder="Daily Limit"
                required
                className="w-full pl-8 pr-4 py-4 bg-white/10 border-0 rounded-2xl focus:ring-2 focus:ring-white/50 text-white font-bold placeholder:text-white/50"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
              />
            </div>
            {error && <p className="text-red-200 text-xs font-bold">{error}</p>}
            <button
              disabled={loading}
              className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Authorize Member'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <h4 className="text-lg font-bold text-gray-900 px-1">Authorized Members</h4>
          {members.length === 0 ? (
            <p className="text-center py-10 text-gray-400 font-bold">No members added yet</p>
          ) : members.map((member) => (
            <div key={member.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                  <User size={30} />
                </div>
                <div>
                  <p className="font-extrabold text-gray-900">{member.stellarId}</p>
                  <p className="text-xs font-bold text-indigo-600">₹{member.spentToday} / ₹{member.dailyLimit} daily</p>
                  <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${Math.min((member.spentToday/member.dailyLimit)*100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-orange-50 p-6 rounded-[2rem] flex gap-4 border border-orange-100">
          <AlertCircle className="text-orange-500 shrink-0" />
          <div>
            <p className="text-orange-900 font-bold text-sm">How it works</p>
            <p className="text-orange-700 text-xs font-medium leading-relaxed mt-1">
              Authorized members can spend directly from your Stellar wallet up to their daily limit. You can revoke access at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyManager;
