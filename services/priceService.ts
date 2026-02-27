
/**
 * Service to fetch live crypto prices from CoinGecko
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3/simple/price';

export type CryptoPriceInfo = {
  id: string;
  inr: number;
};

/**
 * Fetches the live price of a specific cryptocurrency in a target currency
 * @param id The CoinGecko ID (e.g., 'stellar')
 * @param currency The target fiat currency (default: 'inr')
 * @returns The price in the target currency
 */
export const getLivePrice = async (id: string, currency: string = 'inr'): Promise<number> => {
  try {
    const cur = currency.toLowerCase();
    const response = await fetch(`${COINGECKO_API_BASE}?ids=${id}&vs_currencies=${cur}`);
    const data = await response.json();

    // CoinGecko returns data in format { [id]: { [currency]: [price] } }
    if (data[id] && data[id][cur]) {
      return data[id][cur];
    }

    // Fallbacks if API returns empty but no error
    if (id === 'stellar') {
      if (cur === 'inr') return 15.02;
      if (cur === 'usd') return 0.18;
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching price for ${id} in ${currency}:`, error);
    // Hardcoded fallbacks based on recent market rates
    if (id === 'stellar') {
      if (currency.toLowerCase() === 'inr') return 15.02;
      return 0.18; // Default to some USD value if not INR
    }
    return 0;
  }
};

/**
 * Calculates how much crypto to send for a given fiat amount, including a safety buffer
 * @param fiatAmount The target fiat amount
 * @param cryptoId The CoinGecko ID
 * @param currency The target fiat currency (default: 'inr')
 * @param buffer Multiplier for volatility (default 1.02 for 2%)
 */
export const calculateCryptoToSend = async (
  fiatAmount: number,
  cryptoId: string,
  currency: string = 'inr',
  buffer: number = 1.02
): Promise<number> => {
  const livePrice = await getLivePrice(cryptoId, currency);
  if (livePrice === 0) throw new Error(`Could not determine price for ${cryptoId} in ${currency}`);

  const amount = (fiatAmount / livePrice) * buffer;

  // Precision adjustment: Stellar uses 7 decimals
  // 4-6 decimal places is usually plenty for UI display
  return Number(amount.toFixed(6));
};
