
import { BrowserProvider, parseEther, formatEther, Contract, JsonRpcProvider } from 'ethers';
import { getMetaMaskProvider } from './web3';

const CELO_RPC = 'https://forno.celo.org';
const ALFAJORES_RPC = 'https://alfajores-forno.celo-testnet.org';

/**
 * Get the current Celo balance for an address
 */
export const getCeloBalance = async (address: string, isMainnet: boolean = true): Promise<string> => {
  try {
    const rpc = isMainnet ? CELO_RPC : ALFAJORES_RPC;
    const provider = new JsonRpcProvider(rpc);
    const balance = await provider.getBalance(address);
    return formatEther(balance);
  } catch (error) {
    console.error("Error getting Celo balance:", error);
    return '0.00';
  }
};

/**
 * Send CELO payment
 */
export const sendCeloPayment = async (
  recipientAddress: string,
  amount: string
): Promise<string> => {
  const provider = getMetaMaskProvider();
  if (!provider) throw new Error("Wallet not connected");

  const signer = await provider.getSigner();
  
  const tx = await signer.sendTransaction({
    to: recipientAddress,
    value: parseEther(amount)
  });

  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction failed");
  
  return receipt.hash;
};

/**
 * Check if the user is on the correct Celo network
 */
export const checkCeloNetwork = async (isMainnet: boolean = true): Promise<boolean> => {
  const provider = getMetaMaskProvider();
  if (!provider) return false;

  const network = await provider.getNetwork();
  const targetChainId = isMainnet ? 42220n : 44787n;
  
  return network.chainId === targetChainId;
};

/**
 * Switch to Celo network if not active
 */
export const switchToCelo = async (isMainnet: boolean = true) => {
  const ethereum = (window as any).ethereum;
  if (!ethereum) return;

  const targetChainId = isMainnet ? '0xa4ec' : '0xaef3'; // 42220, 44787
  const chainName = isMainnet ? 'Celo Mainnet' : 'Celo Alfajores Testnet';
  const rpcUrl = isMainnet ? CELO_RPC : ALFAJORES_RPC;
  const explorerUrl = isMainnet ? 'https://celoscan.io' : 'https://alfajores.celoscan.io';

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: targetChainId,
              chainName: chainName,
              nativeCurrency: {
                name: 'CELO',
                symbol: 'CELO',
                decimals: 18,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: [explorerUrl],
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add Celo network:", addError);
      }
    }
  }
};
