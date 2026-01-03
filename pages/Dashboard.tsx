
import React from 'react';
import { UserProfile } from '../types';
import BalanceCard from '../components/BalanceCard';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  ScanLine,
  History,
  Users,
  ChevronRight,
  PlusCircle,
  Smartphone,
  CreditCard,
  LogOut
} from 'lucide-react';
import { auth } from '../services/firebase';

interface Props {
  profile: UserProfile | null;
}

const Dashboard: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();

  if (!profile) return null;

  const quickActions = [
    { icon: <ScanLine />, label: 'Scan QR', path: '/scan', color: 'bg-indigo-600' },
    { icon: <Send />, label: 'Pay ID', path: '/send', color: 'bg-blue-600' },
    { icon: <PlusCircle />, label: 'Add Money', path: '/', color: 'bg-emerald-600' },
    { icon: <History />, label: 'History', path: '/transactions', color: 'bg-orange-600' },
  ];

  return (
    <div className="pb-24 pt-8 px-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Hi, User</h2>
          <p className="text-lg font-extrabold text-gray-900">{profile.stellarId}</p>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      <BalanceCard publicKey={profile.publicKey} stellarId={profile.stellarId} />

      <div className="grid grid-cols-4 gap-4 mt-10">
        {quickActions.map((action, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <button
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white p-4 rounded-3xl shadow-lg hover:scale-105 transition-transform active:scale-95`}
            >
              {action.icon}
            </button>
            <span className="text-[11px] font-bold text-gray-600 text-center">{action.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Manage</h3>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/family')}
            className="w-full flex items-center justify-between p-5 bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-2xl">
                <Users size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Family Wallet</p>
                <p className="text-xs font-medium text-gray-500">Shared limits & tracking</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/shared')}
            className="w-full flex items-center justify-between p-5 bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-pink-100 text-pink-600 p-3 rounded-2xl">
                <CreditCard size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Shared Spending</p>
                <p className="text-xs font-medium text-gray-500">Spend from primary A/C</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
          </button>
        </div>
      </div>

      <div className="mt-12 bg-indigo-900 rounded-[2.5rem] p-6 text-white overflow-hidden relative">
        <div className="relative z-10">
          <h4 className="font-extrabold text-xl mb-2">Refer & Earn</h4>
          <p className="text-indigo-200 text-sm font-medium mb-4">Get ₹50 for every friend who joins StellarPay.</p>
          <button className="bg-white text-indigo-900 px-6 py-2 rounded-xl font-bold text-sm shadow-xl">
            Invite Now
          </button>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Smartphone size={100} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
