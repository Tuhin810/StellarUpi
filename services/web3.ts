
declare global {
  interface Window {
    ethereum: any;
  }
}

import { BrowserProvider, JsonRpcSigner } from 'ethers';

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
