
export interface LocationData {
    countryCode: string;
    currency: string;
}

const DEFAULT_LOCATION: LocationData = {
    countryCode: 'IN',
    currency: 'INR'
};

const CURRENCY_MAP: Record<string, string> = {
    'IN': 'INR',
    'US': 'USD',
    'GB': 'GBP',
    'EU': 'EUR',
    'DE': 'EUR',
    'FR': 'EUR',
    'JP': 'JPY',
    'CA': 'CAD',
    'AU': 'AUD',
    'SG': 'SGD',
    'AE': 'AED',
    'BR': 'BRL',
    'NG': 'NGN',
    // Add more as needed
};

/**
 * Detects the user's location and currency based on IP
 */
export const detectLocation = async (): Promise<LocationData> => {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.country) {
            return {
                countryCode: data.country,
                currency: data.currency || CURRENCY_MAP[data.country] || 'USD'
            };
        }
    } catch (error) {
        console.warn('Location detection failed, using defaults:', error);
    }

    return DEFAULT_LOCATION;
};
