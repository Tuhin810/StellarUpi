
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getUserById, recordTransaction } from '../services/db';
import { sendPayment } from '../services/stellar';
import { decryptSecret } from '../services/encryption';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, User, Landmark } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
}

const SendMoney: React.FC<Props> = ({ profile }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [recipientId, setRecipientId] = useState(searchParams.get('to') || '');
  const [amount, setAmount] = useState(searchParams.get('amt') || '');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError('');

    try {
      // 1. Resolve ID
      const recipient = await getUserById(recipientId);
      if (!recipient) throw new Error("Recipient ID not found");

      // 2. Decrypt Secret
      const password = sessionStorage.getItem('temp_vault_key');
      if (!password) throw new Error("Vault locked. Please re-login.");
      const secret = decryptSecret(profile.encryptedSecret, password);

      // 3. Convert Amount (Stellar uses string)
      // Assuming user input is INR, we convert to XLM for blockchain
      const xlmAmount = (parseFloat(amount) / 8.42).toFixed(7);

      // 4. Submit Tx
      const hash = await sendPayment(secret, recipient.publicKey, xlmAmount, memo);

      // 5. Log DB
      await recordTransaction({
        fromId: profile.stellarId,
        toId: recipientId,
        fromName: profile.stellarId,
        toName: recipientId,
        amount: parseFloat(amount),
        currency: 'INR',
        status: 'SUCCESS',
        txHash: hash,
        isFamilySpend: false
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-indigo-600 text-white text-center">
        <CheckCircle2 size={120} className="mb-8 animate-bounce" />
        <h2 className="text-4xl font-extrabold mb-2">Success!</h2>
        <p className="text-xl font-medium text-indigo-100 mb-8">
          Sent ₹{amount} to <span className="underline">{recipientId}</span>
        </p>
        <button 
          onClick={() => navigate('/')}
          className="w-full max-w-xs bg-white text-indigo-600 py-4 rounded-3xl font-bold text-lg shadow-2xl"
        >
          Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-12 px-6 flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900">Send Money</h2>
      </div>

      <div className="px-6">
        <form onSubmit={handlePay} className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-400 ml-1">Recipient ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                <input
                  type="text"
                  required
                  placeholder="name@stellar"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-400 ml-1">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">₹</span>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-6 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-3xl font-black"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-400 ml-1">What's it for? (Optional)</label>
              <input
                type="text"
                placeholder="Rent, Dinner, Gift..."
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <Landmark size={20} />
            </div>
            <p className="text-sm font-bold text-indigo-900">Stellar Testnet Node #001</p>
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div>
            ) : (
              <>
                Confirm Payment <Send size={24} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendMoney;
