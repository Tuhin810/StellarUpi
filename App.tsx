
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import AppRoutes from './routes/AppRoutes';
import BottomNav from './components/BottomNav';

import { NotificationService } from './services/notification';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, profile } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && profile) {
      // 1. Request permission and register token
      NotificationService.requestPermission(profile.uid);

      // 2. Setup real-time listeners for payments/splits
      const cleanup = NotificationService.setupRealtimeNotifications(profile.stellarId);

      // 3. Listen for direct foreground FCM messages
      const unsubForeground = NotificationService.onForegroundMessage((payload) => {
        NotificationService.sendLocalNotification(
          payload.notification?.title || "New Update",
          payload.notification?.body || "Check your vault."
        );
      });

      return () => {
        if (cleanup) cleanup();
        if (unsubForeground) unsubForeground();
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
