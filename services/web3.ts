
/**
 * Utility functions for Stellar ID generation.
 * Web3Modal/MetaMask removed — auth is now phone-based.
 */

/**
 * Generates a Stellar UPI ID from a phone number.
 * e.g. "9876543210" → "987654@stellar"
 */
export const generateStellarId = (phone: string): string => {
  const clean = phone.replace(/[^0-9]/g, '');
  // Use first 6 digits to create a unique-ish readable ID
  return `${clean.substring(0, 6)}@stellar`;
};

/**
 * @deprecated Use generateStellarId instead
 */
export const generateUPIFromAddress = (address: string): string => {
  const clean = address.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean.substring(0, 6)}${clean.substring(clean.length - 4)}@stellar`;
};
