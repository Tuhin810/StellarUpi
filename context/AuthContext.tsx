
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile } from '../types';
import { normalizePhone } from '../services/db';

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
        const normalized = normalizePhone(uid);
        return onSnapshot(doc(db, 'upiAccounts', normalized), async (snap) => {
            if (snap.exists()) {
                const data = snap.data() as UserProfile;
                setProfile(data);
                setLoading(false);

                // Automatic initial detection if missing
                if (!data.preferredCurrency || !data.countryCode) {
                    try {
                        const { detectLocation } = await import('../services/locationService');
                        const { updateUserDetails } = await import('../services/db');
                        const loc = await detectLocation();

                        // Only update if still missing to avoid overwriting manual changes 
                        // that might have happened in another tab/session
                        await updateUserDetails(normalized, {
                            preferredCurrency: loc.currency,
                            countryCode: loc.countryCode
                        });
                    } catch (err) {
                        console.error("Failed to auto-detect location:", err);
                    }
                }
            } else {
                // Fallback: try 91-prefixed doc (backward compat)
                onSnapshot(doc(db, 'upiAccounts', '91' + normalized), (snap91) => {
                    if (snap91.exists()) {
                        setProfile(snap91.data() as UserProfile);
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                });
            }
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
