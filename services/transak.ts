
import { Transak } from '@transak/ui-js-sdk';
import { getNetworkConfig } from '../context/NetworkContext';

// Transak API Key - Replace with your actual key from dashboard.transak.com
const TRANSAK_API_KEY = '22ef1dc6-1aff-4780-acef-8a145b72403c';

/**
 * Builds the Transak widget URL based on environment and parameters
 */
const buildTransakUrl = (params: Record<string, string | number | boolean | undefined>) => {
  const config = getNetworkConfig();
  const isMainnet = config.name === 'Mainnet';
  const baseUrl = isMainnet ? 'https://global.transak.com' : 'https://global-stg.transak.com';
  
  const queryParams = new URLSearchParams();
  queryParams.append('apiKey', TRANSAK_API_KEY);
  
  // Add all other params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  return `${baseUrl}?${queryParams.toString()}`;
};

interface TransakConfig {
  walletAddress: string;
  email?: string;
  partnerOrderId?: string;
}

/**
 * Open Transak widget to buy XLM
 */
export const openBuyWidget = (config: TransakConfig) => {
  const { walletAddress, email, partnerOrderId } = config;
  
  const widgetUrl = buildTransakUrl({
    cryptoCurrencyCode: 'XLM',
    network: 'stellar',
    walletAddress: walletAddress,
    fiatCurrency: 'INR',
    countryCode: 'IN',
    email: email,
    partnerOrderId: partnerOrderId,
    themeColor: 'E5D5B3',
    hideMenu: 'true',
  });

  const transak = new Transak({
    widgetUrl,
    themeColor: 'E5D5B3',
    widgetHeight: '625px',
    widgetWidth: '450px',
  });

  transak.init();

  // Handle events using static listener or emitted events
  // Based on SDK source, we can use Transak.on for global events
  Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
    console.log('Transak widget closed');
    transak.close();
  });

  Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
    console.log('Order successful:', orderData);
    transak.close();
    window.location.reload();
  });

  Transak.on(Transak.EVENTS.TRANSAK_ORDER_FAILED, (orderData: any) => {
    console.error('Order failed:', orderData);
  });

  return transak;
};

/**
 * Open Transak widget to sell XLM
 */
export const openSellWidget = (config: TransakConfig) => {
  const { walletAddress, email, partnerOrderId } = config;
  
  const widgetUrl = buildTransakUrl({
    cryptoCurrencyCode: 'XLM',
    network: 'stellar',
    walletAddress: walletAddress,
    fiatCurrency: 'INR',
    countryCode: 'IN',
    email: email,
    partnerOrderId: partnerOrderId,
    themeColor: 'E5D5B3',
    hideMenu: 'true',
    productsAvailed: 'SELL',
  });

  const transak = new Transak({
    widgetUrl,
    themeColor: 'E5D5B3',
    widgetHeight: '625px',
    widgetWidth: '450px',
  });

  transak.init();

  Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
    console.log('Transak widget closed');
    transak.close();
  });

  Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
    console.log('Sell order successful:', orderData);
    transak.close();
    window.location.reload();
  });

  Transak.on(Transak.EVENTS.TRANSAK_ORDER_FAILED, (orderData: any) => {
    console.error('Sell order failed:', orderData);
  });

  return transak;
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
