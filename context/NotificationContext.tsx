
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'payment' | 'split';

interface InAppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    duration?: number;
}

interface NotificationContextType {
    showNotification: (title: string, message: string, type: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<InAppNotification[]>([]);

    const showNotification = useCallback((title: string, message: string, type: NotificationType, duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, title, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        }
    }, []);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}

            {/* Notification Portal */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100] pointer-events-none flex flex-col gap-3">
                <AnimatePresence>
                    {notifications.map((n) => (
                        <motion.div
                            key={n.id}
                            initial={{ y: -100, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -20, opacity: 0, scale: 0.95 }}
                            className="pointer-events-auto"
                        >
                            <NotificationItem notification={n} onClose={() => removeNotification(n.id)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

const NotificationItem: React.FC<{ notification: InAppNotification, onClose: () => void }> = ({ notification, onClose }) => {
    const { title, message, type } = notification;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="text-emerald-400" size={20} />;
            case 'error': return <AlertCircle className="text-rose-400" size={20} />;
            case 'payment': return <div className="bg-amber-500/20 p-1.5 rounded-lg"><Bell className="text-amber-500" size={16} /></div>;
            case 'split': return <div className="bg-blue-500/20 p-1.5 rounded-lg"><Bell className="text-blue-500" size={16} /></div>;
            default: return <Info className="text-zinc-400" size={20} />;
        }
    };

    return (
        <div className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-4 ring-1 ring-white/5">
            <div className="mt-0.5">
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white tracking-tight">{title}</h4>
                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors text-zinc-600"
            >
                <X size={16} />
            </button>
        </div>
    );
};
