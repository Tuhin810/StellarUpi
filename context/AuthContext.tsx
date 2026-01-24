
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getProfile } from '../services/db';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useWeb3ModalAccount } from '../services/web3';
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

    // Use Web3Modal's account hook
    const { address, isConnected } = useWeb3ModalAccount();

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

    const loadWeb3Profile = async () => {
        try {
            const loggedAddress = localStorage.getItem('web3_address');
            if (!loggedAddress) {
                setLoading(false);
                return;
            }

            // Always try to sign in anonymously to Firebase if not already
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }

            // Only logout if there is a DEFINITIVE mismatch
            if (isConnected && address) {
                if (address.toLowerCase() !== loggedAddress.toLowerCase()) {
                    console.warn("Address mismatch detected. Expected:", loggedAddress, "Got:", address);
                    localStorage.removeItem('web3_address');
                    localStorage.removeItem('temp_vault_key'); // Also clean up vault key
                    setProfile(null);
                    setLoading(false);
                    return;
                }
            }

            // If we have a logged address, setup listener
            const unsub = setupProfileListener(loggedAddress);
            return unsub;
        } catch (e) {
            console.error("Session restore failed", e);
            setLoading(false);
        }
    };


    useEffect(() => {
        let unsub: (() => void) | undefined;
        loadWeb3Profile().then(cleanup => {
            if (typeof cleanup === 'function') {
                unsub = cleanup;
            }
        });
        return () => {
            if (unsub) unsub();
        };
    }, [isConnected, address]);

    // Handle account changes from injected wallet
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                const storedAddress = localStorage.getItem('web3_address');
                if (accounts.length === 0 || (accounts[0] && accounts[0].toLowerCase() !== storedAddress)) {
                    setProfile(null);
                    localStorage.removeItem('web3_address');
                    sessionStorage.removeItem('temp_vault_key');
                    window.location.reload();
                }
            };
            //@ts-ignore
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            return () => {
                //@ts-ignore
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
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
