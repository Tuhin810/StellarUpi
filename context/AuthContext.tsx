
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getProfile } from '../services/db';
import { getMetaMaskProvider } from '../services/web3';
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

            // Check if MetaMask is connected and the address matches
            const accounts = await provider.send("eth_accounts", []);
            if (accounts.length > 0 && accounts[0].toLowerCase() === loggedAddress.toLowerCase()) {
                await signInAnonymously(auth);
                const p = await getProfile(loggedAddress.toLowerCase());
                setProfile(p);
            } else {
                // Session mismatch, logout
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
