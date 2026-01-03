
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { getProfile } from './services/db';
import { UserProfile } from './types';
import { getMetaMaskProvider } from './services/web3';
import { Home, History, Send, ChevronUp } from 'lucide-react';

// Pages
import Login from './pages/Login';
import { auth } from './services/firebase';
import { signInAnonymously } from 'firebase/auth';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import QRScanner from './pages/QRScanner';
import Transactions from './pages/Transactions';
import FamilyManager from './pages/FamilyManager';
import SharedWallet from './pages/SharedWallet';
import Profile from './pages/Profile';
import ChatPage from './pages/ChatPage';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/send' || path.startsWith('/chat')) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/50 backdrop-blur-sm rounded-3xl p-1 px-6 flex items-center justify-between shadow-2xl z-50">
      <Link
        to="/"
        className={`flex-1 flex flex-col items-center py- rounded-2xl transition-all ${path === '/' ? 'text-black font-black' : 'text-zinc-300 font-bold'}`}
      >
        <Home size={22} />
        <span className="text-[10px] mt-1">Home</span>
      </Link>

      <div className="relative -top-10 px-2 group">
        <Link
          to="/send"
          className="w-16 h-16 gold-gradient rounded-2xl flex flex-col items-center justify-center shadow-xl group-hover:scale-105 active:scale-95 transition-all text-black border-4 border-[#1A1A1A]"
        >
          <ChevronUp size={20} className="mb-[-2px]" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Pay</span>
        </Link>
      </div>

      <Link
        to="/transactions"
        className={`flex-1 flex flex-col items-center py- rounded-2xl transition-all ${path === '/transactions' ? 'text-black font-black' : 'text-zinc-300 font-bold'}`}
      >
        <History size={22} />
        <span className="text-[10px] mt-1">Activity</span>
      </Link>
    </div>
  );
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWeb3Profile = async () => {
    try {
      const provider = getMetaMaskProvider();
      if (!provider) {
        setLoading(false);
        return;
      }

      const loggedAddress = localStorage.getItem('web3_address');
      if (!loggedAddress) {
        setLoading(false);
        return;
      }

      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0 && accounts[0].toLowerCase() === loggedAddress.toLowerCase()) {
        await signInAnonymously(auth);
        const p = await getProfile(loggedAddress.toLowerCase());
        setProfile(p);
      } else {
        localStorage.removeItem('web3_address');
        sessionStorage.removeItem('temp_vault_key');
      }
    } catch (e) {
      console.error("Session restore failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeb3Profile();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0 || (accounts[0] && accounts[0].toLowerCase() !== localStorage.getItem('web3_address'))) {
          setProfile(null);
          localStorage.removeItem('web3_address');
          sessionStorage.removeItem('temp_vault_key');
          window.location.reload();
        }
      });
    }
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#050505]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E5D5B3] border-t-transparent"></div>
    </div>
  );

  const isAuthenticated = !!profile;

  return (
    <Router>
      <div className="min-h-screen bg-[#1A1A1A] text-white max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-white/5">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

          <Route path="/" element={isAuthenticated ? <Dashboard profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/send" element={isAuthenticated ? <SendMoney profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/scan" element={isAuthenticated ? <QRScanner /> : <Navigate to="/login" />} />
          <Route path="/transactions" element={isAuthenticated ? <Transactions profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/family" element={isAuthenticated ? <FamilyManager profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/shared" element={isAuthenticated ? <SharedWallet profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/chat/:contactId" element={isAuthenticated ? <ChatPage profile={profile} /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {isAuthenticated && <BottomNav />}
      </div>
    </Router>
  );
};

export default App;
