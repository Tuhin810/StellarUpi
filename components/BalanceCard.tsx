
import React, { useEffect, useState } from 'react';
import { getBalance } from '../services/stellar';
import { RefreshCcw } from 'lucide-react';

interface Props {
  publicKey: string;
  stellarId?: string;
}

const BalanceCard: React.FC<Props> = ({ publicKey, stellarId }) => {
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    setRefreshing(true);
    const b = await getBalance(publicKey);
    setBalance(b);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey]);

  // Static conversion for demo purposes (1 XLM ~ 8 INR)
  const inrBalance = (parseFloat(balance) * 8.42).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'INR'
  });

  // Format public key for display
  const formattedKey = publicKey
    ? `${publicKey.substring(0, 4)} ${publicKey.substring(4, 8)} ${publicKey.substring(8, 12)} ${publicKey.substring(12, 16)}`
    : 'XXXX XXXX XXXX XXXX';

  return (
    <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-6 shadow-2xl overflow-hidden">
      {/* Card Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Card Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1">
            <div className="w-8 h-8 bg-red-500 rounded-full opacity-80" />
            <div className="w-8 h-8 bg-yellow-500 rounded-full opacity-80 -ml-3" />
          </div>
          <button
            onClick={fetchBalance}
            className={`p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={18} className="text-white" />
          </button>
        </div>

        <div className="mb-3">
          <p className="text-gray-400 text-xs mb-1">Balance</p>
          <p className="text-white font-bold text-2xl tracking-wide">
            {loading ? '...' : inrBalance}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {parseFloat(balance).toLocaleString()} XLM
          </p>
        </div>

        <div className="m">
          <p className="text-gray-400 text-xs mb-1">Account Number</p>
          <p className="text-white font-mono text-lg tracking-widest">
            {formattedKey}
          </p>
        </div>


      </div>
    </div>
  );
};

export default BalanceCard;
