
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import AppRoutes from './routes/AppRoutes';
import BottomNav from './components/BottomNav';
import PWAInstallPrompt from './components/PWAInstallPrompt';

import { NotificationService } from './services/notification';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, profile } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && profile) {
      // 1. Initialize OneSignal and login user
      NotificationService.init(profile.stellarId);

      // 2. Request permission (OneSignal Slidedown)
      NotificationService.requestPermission();

      // 3. Setup real-time listeners for payments/splits (Firestore logic remains)
      const cleanup = NotificationService.setupRealtimeNotifications(profile.stellarId);

      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [isAuthenticated, profile]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E5D5B3] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#1A1A1A] text-white max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-white/5">
        <AppRoutes />
        {isAuthenticated && <BottomNav />}
        <PWAInstallPrompt />
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <NetworkProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NetworkProvider>
  );
};

export default App;
