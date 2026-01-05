
declare global {
  interface Window {
    ethereum: any;
  }
}

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

// WalletConnect Project ID - Get one free at https://cloud.walletconnect.com
const projectId = '50852508e4819bee415eac1fda478758'; // TODO: Replace with your Project ID

// Ethereum Mainnet config
const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
};

// Metadata for the dApp shown in wallets
const metadata = {
  name: 'StellarPay UPI',
  description: 'The New Web3 UPI Payment System',
  url: window.location.origin,
  icons: [`${window.location.origin}/icon-192.png`]
};

// Create the Web3Modal with ethers config
const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true, // Enables injected wallets (MetaMask, etc)
  enableInjected: true,
  enableCoinbase: true,
  enableWalletConnect: true, // Enables WalletConnect for mobile
});

// Initialize Web3Modal
createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#E5D5B3',
  }
});

export { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';

export const getMetaMaskProvider = () => {
  if (typeof window.ethereum !== 'undefined') {
    return new BrowserProvider(window.ethereum);
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
