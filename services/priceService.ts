
/**
 * Service to fetch live crypto prices from CoinGecko
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3/simple/price';

export type CryptoPriceInfo = {
  id: string;
  inr: number;
};

/**
 * Fetches the live price of a specific cryptocurrency in INR
 * @param id The CoinGecko ID (e.g., 'stellar')
 * @returns The price in INR
 */
export const getLivePrice = async (id: string): Promise<number> => {
  try {
    const response = await fetch(`${COINGECKO_API_BASE}?ids=${id}&vs_currencies=inr`);
    const data = await response.json();
    
    // CoinGecko returns data in format { [id]: { inr: [price] } }
    if (data[id] && data[id].inr) {
      return data[id].inr;
    }
    
    // Fallbacks if API returns empty but no error
    if (id === 'stellar') return 15.02;
    
    return 0;
  } catch (error) {
    console.error(`Error fetching price for ${id}:`, error);
    // Hardcoded fallbacks based on recent market rates
    if (id === 'stellar') return 15.02;
    return 0;
  }
};

/**
 * Calculates how much crypto to send for a given INR amount, including a safety buffer
 * @param inrAmount The target INR amount
 * @param cryptoId The CoinGecko ID
 * @param buffer Multiplier for volatility (default 1.05 for 5%)
 */
export const calculateCryptoToSend = async (
  inrAmount: number, 
  cryptoId: string, 
  buffer: number = 1.05
): Promise<number> => {
  const livePrice = await getLivePrice(cryptoId);
  if (livePrice === 0) throw new Error(`Could not determine price for ${cryptoId}`);
  
  const amount = (inrAmount / livePrice) * buffer;
  
  // Precision adjustment: Stellar uses 7 decimals
  // 4-6 decimal places is usually plenty for UI display
  return Number(amount.toFixed(6));
};
