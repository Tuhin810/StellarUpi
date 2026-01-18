
import { OnrampWebSDK } from '@onramp.money/onramp-web-sdk';

// Onramp.money App ID - Get yours from https://onramp.money/main/partner
// For testing, use '1' as the appId (sandbox mode)
const ONRAMP_APP_ID = 1; // Replace with your production appId after registration

interface OnrampConfig {
  walletAddress: string;
  email?: string;
}

/**
 * Open Onramp.money widget to buy XLM with INR (SDK overlay version)
 */
export const openBuyWidget = (config: OnrampConfig) => {
  const { walletAddress } = config;

  console.log('Opening Onramp widget with wallet:', walletAddress);

  const onramp = new OnrampWebSDK({
    appId: ONRAMP_APP_ID,
    walletAddress: walletAddress,
    network: 'stellar',
    coinCode: 'XLM',
    fiatType: 1, // INR
    flowType: 1, // Buy
  } as any);

  onramp.show();
  return onramp;
};

/**
 * Open Onramp.money widget to sell XLM for INR
 */
export const openSellWidget = (config: OnrampConfig) => {
  const { walletAddress } = config;

  const onramp = new OnrampWebSDK({
    appId: ONRAMP_APP_ID,
    walletAddress: walletAddress,
    network: 'stellar',
    coinCode: 'XLM',
    fiatType: 1, // INR
    flowType: 2, // Sell
  } as any);

  onramp.show();
  return onramp;
};

/**
 * Get estimated XLM amount for given INR (using CoinGecko API)
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
