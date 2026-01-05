
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getProfile } from '../services/db';
import { useWeb3ModalAccount } from '../services/web3';
import { UserProfile } from '../types';

interface AuthContextType {
    profile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Use Web3Modal's account hook
    const { address, isConnected } = useWeb3ModalAccount();

    const loadWeb3Profile = async () => {
        try {
            const loggedAddress = localStorage.getItem('web3_address');
            if (!loggedAddress) {
                setLoading(false);
                return;
            }

            // Check if Web3Modal is connected and the address matches
            if (isConnected && address && address.toLowerCase() === loggedAddress.toLowerCase()) {
                await signInAnonymously(auth);
                const p = await getProfile(loggedAddress.toLowerCase());
                setProfile(p);
            } else if (!isConnected) {
                // Check localStorage for session - user might have refreshed page
                // Try to restore session even without active connection
                await signInAnonymously(auth);
                const p = await getProfile(loggedAddress.toLowerCase());
                if (p) {
                    setProfile(p);
                } else {
                    // No profile found, clear storage
                    localStorage.removeItem('web3_address');
                    sessionStorage.removeItem('temp_vault_key');
                    setProfile(null);
                }
            } else {
                // Address mismatch, logout
                localStorage.removeItem('web3_address');
                sessionStorage.removeItem('temp_vault_key');
                setProfile(null);
            }
        } catch (e) {
            console.error("Session restore failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWeb3Profile();
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

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, []);

    const value = {
        profile,
        loading,
        isAuthenticated: !!profile,
        refreshProfile: loadWeb3Profile
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
