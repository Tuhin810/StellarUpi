
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getProfile } from './services/db';
import { UserProfile } from './types';
import { getMetaMaskProvider } from './services/web3';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import QRScanner from './pages/QRScanner';
import Transactions from './pages/Transactions';
import FamilyManager from './pages/FamilyManager';
import SharedWallet from './pages/SharedWallet';

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
        const p = await getProfile(loggedAddress.toLowerCase());
        setProfile(p);
      } else {
        // mismatched or disconnected
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

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0 || accounts[0].toLowerCase() !== localStorage.getItem('web3_address')) {
          setProfile(null);
          localStorage.removeItem('web3_address');
          sessionStorage.removeItem('temp_vault_key');
          window.location.reload();
        }
      });
    }
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-indigo-600">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
    </div>
  );

  const isAuthenticated = !!profile;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-gray-200">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

          <Route path="/" element={isAuthenticated ? <Dashboard profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/send" element={isAuthenticated ? <SendMoney profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/scan" element={isAuthenticated ? <QRScanner /> : <Navigate to="/login" />} />
          <Route path="/transactions" element={isAuthenticated ? <Transactions profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/family" element={isAuthenticated ? <FamilyManager profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/shared" element={isAuthenticated ? <SharedWallet profile={profile} /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
