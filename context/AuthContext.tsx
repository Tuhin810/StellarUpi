
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
    profile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    refreshProfileSync: (uid: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const setupProfileListener = (uid: string) => {
        return onSnapshot(doc(db, 'upiAccounts', uid.toLowerCase()), (snap) => {
            if (snap.exists()) {
                setProfile(snap.data() as UserProfile);
            } else {
                setProfile(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Profile listen error", err);
            setLoading(false);
        });
    };

    const loadSession = async () => {
        try {
            const phone = localStorage.getItem('ching_phone');
            if (!phone) {
                setLoading(false);
                return;
            }

            // Ensure Firebase anonymous auth for Firestore access
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }

            // Setup real-time profile listener using phone as uid
            const unsub = setupProfileListener(phone);
            return unsub;
        } catch (e) {
            console.error("Session restore failed", e);
            setLoading(false);
        }
    };

    useEffect(() => {
        let unsub: (() => void) | undefined;
        loadSession().then(cleanup => {
            if (typeof cleanup === 'function') {
                unsub = cleanup;
            }
        });
        return () => {
            if (unsub) unsub();
        };
    }, []);

    const value = {
        profile,
        loading,
        isAuthenticated: !!profile,
        refreshProfileSync: setupProfileListener
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
