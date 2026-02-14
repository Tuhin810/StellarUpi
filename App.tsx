
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
    const setupNotifications = async () => {
      if (isAuthenticated && profile) {
        try {
          // 1. Initialize OneSignal and login user
          await NotificationService.init(profile.stellarId);

          // 2. Request permission (OneSignal Slidedown)
          await NotificationService.requestPermission();

          // 3. Setup real-time listeners for payments/splits
          const cleanup = NotificationService.setupRealtimeNotifications(profile.stellarId);
          return cleanup;
        } catch (error) {
          console.error('Failed to setup notifications:', error);
        }
      }
    };

    let cleanupFn: (() => void) | undefined;
    setupNotifications().then(cleanup => {
      if (cleanup) cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
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
