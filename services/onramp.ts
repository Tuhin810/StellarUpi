import { OnrampWebSDK } from '@onramp.money/onramp-web-sdk';

// Onramp.money Configuration
// For testing, use '1'. For production, replace with your actual App ID
const ONRAMP_APP_ID = 1;

interface PurchaseConfig {
  walletAddress: string;
  email?: string;
  amount?: number;
}

/**
 * Open Onramp.money widget directly in the app (Overlay SDK)
 */
export const openBuyWidget = (config: PurchaseConfig) => {
  const { walletAddress, amount } = config;

  console.log('Opening Onramp SDK overlay with wallet:', walletAddress, 'amount:', amount);

  const onramp = new OnrampWebSDK({
    appId: ONRAMP_APP_ID,
    walletAddress: walletAddress,
    network: 'stellar',
    coinCode: 'XLM',
    fiatType: 1, // INR
    flowType: 1, // Buy
    fiatAmount: amount,
  } as any);

  onramp.show();
  return onramp;
};

/**
 * Open Sale Widget (Off-ramp)
 */
export const openSellWidget = (config: PurchaseConfig) => {
  const { walletAddress, amount } = config;

  const onramp = new OnrampWebSDK({
    appId: ONRAMP_APP_ID,
    walletAddress: walletAddress,
    network: 'stellar',
    coinCode: 'XLM',
    fiatType: 1, // INR
    flowType: 2, // Sell
    fiatAmount: amount,
  } as any);

  onramp.show();
  return onramp;
};

/**
 * Get estimated XLM amount for given INR
 */
export const getXlmRate = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=inr');
    const data = await response.json();
    return data.stellar?.inr || 8.42;
  } catch (e) {
    console.error('Failed to fetch XLM rate:', e);
    return 8.42;
  }
};
