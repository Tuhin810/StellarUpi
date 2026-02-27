import { OnrampWebSDK } from '@onramp.money/onramp-web-sdk';
import { getLivePrice } from './priceService';

// Onramp.money Configuration
// For testing, use '1'. For production, replace with your actual App ID
const ONRAMP_APP_ID = 1;

interface PurchaseConfig {
  walletAddress: string;
  email?: string;
  partnerOrderId?: string;
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
    merchantOrderId: config.partnerOrderId, // Onramp uses merchantOrderId
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
    merchantOrderId: config.partnerOrderId, // Onramp uses merchantOrderId
  } as any);

  onramp.show();
  return onramp;
};

/**
 * Get estimated XLM rate for given fiat currency
 */
export const getXlmRate = async (currency: string = 'inr'): Promise<number> => {
  return getLivePrice('stellar', currency);
};
