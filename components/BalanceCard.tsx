
import React, { useEffect, useState } from 'react';
import { getBalance, isAccountFunded } from '../services/stellar';
import { getLivePrice } from '../services/priceService';
import { RefreshCcw } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
// import chip from '../assets/chip.png';
interface Props {
  publicKey: string;
  stellarId?: string;
}

const BalanceCard: React.FC<Props> = ({ publicKey, stellarId }) => {
  const { networkName, isMainnet } = useNetwork();
  const [balance, setBalance] = useState('0.00');
  const [isActivated, setIsActivated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rate, setRate] = useState(15.02);

  const fetchBalance = async () => {
    setRefreshing(true);
    try {
      const [xlmB, xRate, activated] = await Promise.all([
        getBalance(publicKey),
        getLivePrice('stellar'),
        isAccountFunded(publicKey)
      ]);
      setBalance(xlmB);
      setRate(xRate);
      setIsActivated(activated);
    } catch (e) {
      console.error("Balance fetch error:", e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey]);

  const rawInr = parseFloat(balance) * rate;
  const inrBalance = rawInr.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });

  return (


    <>

      <div className="relative gold-gradient rounded-2xl px-6 py-4 shadow-2xl overflow-hidden">
        {/* Card Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Card Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-red-500 rounded-full opacity-80" />
              <div className="w-8 h-8 bg-yellow-500 rounded-full opacity-80 -ml-3" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg text-black italic opacity-30 font-bold">STELLAR</span>
              <div className="mt-2 w-10 h-7 bg-black/10 rounded-md border border-black/5 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-zinc-400 to-zinc-600 opacity-20"></div>
              </div>
              {/* <img className='w-12 h-8 opacity-60' src={chip} alt="" /> */}
            </div>
          </div>

          <div className="mb-3 -mt-5">
            <p className="text-black/60 text-xs mb-1 ">Total Balance</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight text-black/80">₹{loading ? '...' : inrBalance}</h2>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-black/60 text-xs mb-1">Native Assets</p>
              <p className="text-black/80 font-mono tracking-wider text-sm font-bold">
                {loading ? '...' : balance} XLM
              </p>
            </div>
            <div className="text-right">
              <p className="text-black/60 text-xs mb-1">Type</p>
              <p className="text-black/80 text-sm  font-semibold capitalize">
                {networkName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isActivated && !loading && (
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-500">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <RefreshCcw size={16} className="animate-spin-slow" />
          </div>
          <div>
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Account Not Activated</p>
            <p className="text-zinc-500 text-[10px] mt-0.5">
              {isMainnet
                ? "Send at least 1 XLM to this address to activate it on Mainnet."
                : "Funding with Friendbot... Please wait."}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default BalanceCard;
