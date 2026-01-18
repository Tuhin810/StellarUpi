
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkContextType {
    isMainnet: boolean;
    networkName: string;
    horizonUrl: string;
    networkPassphrase: string;
    toggleNetwork: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Network configuration
const NETWORKS = {
    testnet: {
        name: 'Testnet',
        horizonUrl: 'https://horizon-testnet.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015',
        friendbotUrl: 'https://friendbot.stellar.org'
    },
    mainnet: {
        name: 'Mainnet',
        horizonUrl: 'https://horizon.stellar.org',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
        friendbotUrl: null // No friendbot on mainnet
    }
};

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load initial state from localStorage, default to testnet
    const [isMainnet, setIsMainnet] = useState<boolean>(() => {
        const stored = localStorage.getItem('stellar_network');
        return stored === 'mainnet';
    });

    // Persist network selection
    useEffect(() => {
        localStorage.setItem('stellar_network', isMainnet ? 'mainnet' : 'testnet');
    }, [isMainnet]);

    const toggleNetwork = () => {
        setIsMainnet(prev => !prev);
        // Reload the page to reset all balances and connections
        window.location.reload();
    };

    const currentNetwork = isMainnet ? NETWORKS.mainnet : NETWORKS.testnet;

    const value: NetworkContextType = {
        isMainnet,
        networkName: currentNetwork.name,
        horizonUrl: currentNetwork.horizonUrl,
        networkPassphrase: currentNetwork.networkPassphrase,
        toggleNetwork
    };

    return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};

// Export network configs for use in stellar.ts
export const getNetworkConfig = () => {
    const stored = localStorage.getItem('stellar_network');
    return stored === 'mainnet' ? NETWORKS.mainnet : NETWORKS.testnet;
};

export { NETWORKS };
