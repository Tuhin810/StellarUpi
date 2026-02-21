
import React, { useState, useEffect } from 'react';
import { UserProfile, FamilyMember } from '../types';
import { getProfile, getUserById, updateFamilySpend, recordTransaction } from '../services/db';
import { sendPayment } from '../services/stellar';
import { decryptSecret } from '../services/encryption';
import { KYCService } from '../services/kycService';
import { NotificationService } from '../services/notification';

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Send, CreditCard } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Props {
  profile: UserProfile | null;
}

const SharedWallet: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [familyPermission, setFamilyPermission] = useState<FamilyMember | null>(null);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkPermission = async () => {
      if (profile) {
        const q = query(collection(db, 'family'), where('uid', '==', profile.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFamilyPermission({ id: snap.docs[0].id, ...snap.docs[0].data() } as FamilyMember);
        }
      }
    };
    checkPermission();
  }, [profile]);

  const handleSharedPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !familyPermission) return;
    setLoading(true);
    setError('');

    const amtNum = parseFloat(amount);
    if (familyPermission.spentToday + amtNum > familyPermission.dailyLimit) {
      setError("Daily spending limit exceeded");
      setLoading(false);
      return;
    }

    try {
      // 1. Resolve Target
      const recipient = await getUserById(recipientId);
      if (!recipient) throw new Error("Recipient ID not found");

      // 2. Fetch Owner's Encrypted Key
      // NOTE: In this simplified demo, the member needs to know the owner's vault key OR we'd use a more complex encryption sharing.
      // For the sake of a working demo, we assume the shared account uses a known key or the member has been granted the owner's secret via app-logic.
      // REAL WORLD: Use multisig or a signing proxy. Here, we retrieve the owner profile.
      const ownerRef = (await getDocs(query(collection(db, 'users'), where('uid', '==', (familyPermission as any).ownerUid)))).docs[0];
      const ownerData = ownerRef.data() as UserProfile;

      let ownerSecret: string;
      if ((familyPermission as any).sharedSecret) {
        ownerSecret = decryptSecret((familyPermission as any).sharedSecret, profile.uid.toLowerCase());
      } else {
        const vaultKey = KYCService.deriveEncryptionKey(localStorage.getItem('ching_phone') || '', profile.pin || '0000');
        if (!vaultKey) throw new Error("Family authorization missing. Please ask the parent account to remove and re-add you.");
        ownerSecret = decryptSecret(ownerData.encryptedSecret, vaultKey);
      }

      if (!ownerSecret || !ownerSecret.startsWith('S')) {
        throw new Error("Invalid Authorization Key. The family owner may need to re-authorize your access.");
      }

      const xlmAmount = (amtNum / 8.42).toFixed(7);

      // 3. Execute Tx
      const hash = await sendPayment(ownerSecret, recipient.publicKey, xlmAmount, `FamilySpend: ${profile.stellarId}`);

      // 4. Update Limits & Records
      await updateFamilySpend(familyPermission.id, amtNum);
      await recordTransaction({
        fromId: ownerData.stellarId,
        toId: recipientId,
        fromName: ownerData.stellarId,
        toName: recipientId,
        amount: amtNum,
        currency: 'INR',
        status: 'SUCCESS',
        txHash: hash,
        isFamilySpend: true,
        spenderId: profile.stellarId
      });

      // Trigger in-app notification
      NotificationService.sendInAppNotification(
        recipientId,
        "Payment Received",
        `You received ₹${amtNum} from ${ownerData.displayName || ownerData.stellarId.split('@')[0]} (Family Wallet)`,
        'payment'
      );

      navigate('/transactions');

    } catch (err: any) {
      setError(err.message || "Shared payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-12 px-6 flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/")} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900">Shared Spending</h2>
      </div>

      <div className="px-6">
        {!familyPermission ? (
          <div className="bg-white p-10 rounded-[3rem] text-center shadow-sm">
            <Shield size={64} className="mx-auto text-gray-200 mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Shared Wallets</h3>
            <p className="text-gray-500 font-medium">Ask a family member to add you to their wallet with a spending limit.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <CreditCard size={32} className="mb-4" />
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Shared Limit</p>
                <h3 className="text-3xl font-black mt-1">₹{familyPermission.dailyLimit - familyPermission.spentToday}</h3>
                <p className="text-xs font-bold mt-4 bg-white/20 inline-block px-3 py-1 rounded-full">Remaining for Today</p>
              </div>
              <div className="absolute bottom-0 right-0 p-6 opacity-10">
                <Shield size={120} />
              </div>
            </div>

            <form onSubmit={handleSharedPay} className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-400">Recipient</label>
                <input
                  type="text"
                  placeholder="name@stellar"
                  required
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-rose-500 font-bold"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-400">Amount to Spend (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  className="w-full px-5 py-5 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-rose-500 text-2xl font-black"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

              <button
                disabled={loading}
                className="w-full bg-rose-500 text-white py-5 rounded-3xl font-black text-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : <>Pay from Shared A/C <Send size={20} /></>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedWallet;
