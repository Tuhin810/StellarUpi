
import React, { useEffect, useState } from 'react';
import { UserProfile, TransactionRecord } from '../types';
import { getTransactions } from '../services/db';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  profile: UserProfile | null;
}

const Transactions: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      getTransactions(profile.stellarId).then(res => {
        setTxs(res);
        setLoading(false);
      });
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="pt-12 px-6 flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900">Transaction History</h2>
      </div>

      <div className="px-6 space-y-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold">Loading transactions...</div>
        ) : txs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold">No transactions yet</div>
        ) : txs.map((tx) => {
          const isSent = tx.fromId === profile?.stellarId;
          return (
            <div key={tx.id} className="bg-white p-5 rounded-[2rem] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isSent ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                  {isSent ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{isSent ? `To: ${tx.toId}` : `From: ${tx.fromId}`}</p>
                  <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    {tx.timestamp?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • 
                    {tx.isFamilySpend && <span className="flex items-center gap-0.5 text-indigo-500"><Shield size={10} /> Family Wallet</span>}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-lg ${isSent ? 'text-gray-900' : 'text-green-600'}`}>
                  {isSent ? '-' : '+'}₹{tx.amount.toLocaleString()}
                </p>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{tx.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Transactions;
