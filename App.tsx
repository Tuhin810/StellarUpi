
import React from 'react';
import { HashRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import AppRoutes from './routes/AppRoutes';
import BottomNav from './components/BottomNav';
import PWAInstallPrompt from './components/PWAInstallPrompt';

import { NotificationService } from './services/notification';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import AIAssistant from './components/AIAssistant';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, profile } = useAuth();
  const { showNotification } = useNotifications();
  const location = useLocation();
  const isStreakPage = location.pathname === '/streak';

  React.useEffect(() => {
    const setupNotifications = async () => {
      if (isAuthenticated && profile) {
        try {
          // Setup real-time listeners for payments/splits/in-app notifications
          const cleanup = NotificationService.setupRealtimeNotifications(
            profile.stellarId,
            (title, message, type) => {
              showNotification(title, message, type);
            }
          );
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
  }, [isAuthenticated, profile, showNotification]);


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E5D5B3] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-white/5">
      <AppRoutes />
      {isAuthenticated && !isStreakPage && (
        <>
          <BottomNav />
          <AIAssistant />
        </>
      )}
      <PWAInstallPrompt />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <NetworkProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </NetworkProvider>
  );
};

export default App;
