// Ethereum fallback is handled by ethers BrowserProvider casting

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

// WalletConnect Project ID - Get one free at https://cloud.walletconnect.com
const projectId = '50852508e4819bee415eac1fda478758';

// Ethereum Mainnet config
const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://rpc.ankr.com/eth' // More reliable public RPC
};

// Metadata for the dApp shown in wallets
const metadata = {
  name: 'StellarPay',
  description: 'The New Web3 UPI Payment System',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://stellarupi.netlify.app',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/icon-192.png` : 'https://stellarupi.netlify.app/icon-192.png']
};

// Create the Web3Modal with ethers config
const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  rpcUrl: mainnet.rpcUrl,
  defaultChainId: 1
});

// Initialize Web3Modal
createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  featuredWalletIds: [
    'c57caac7112c3e66d5850ee853e2300d65bf254d198758830250fc57ae813e33', // MetaMask
    '4622a2b2d6ad1397f42f7661cdc2ad121a0077227005f560abba7482811a2f1a', // Trust Wallet
    '8a0ee150a058da363f4a007bc4436679b09bafe062a2d48066c617eb3698282e', // Omni
  ],
  allWallets: 'SHOW', // Ensure all wallets are searchable if detection fails
  themeVariables: {
    '--w3m-accent': '#E5D5B3',
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 40,
    '--w3m-z-index': 9999
  }
});

export { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';

export const getMetaMaskProvider = () => {
  if (typeof window.ethereum !== 'undefined' && window.ethereum) {
    return new BrowserProvider(window.ethereum as any);
  }
  return null;
};

export const connectWallet = async () => {
  const provider = getMetaMaskProvider();
  if (!provider) throw new Error("MetaMask not found");

  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, signer };
};

export const signMessage = async (signer: JsonRpcSigner, message: string) => {
  return await signer.signMessage(message);
};

export const generateUPIFromAddress = (address: string) => {
  // Use first 6 and last 4 characters to make a unique-ish ID
  const clean = address.toLowerCase();
  return `${clean.substring(0, 6)}${clean.substring(clean.length - 4)}@stellar`;
};
