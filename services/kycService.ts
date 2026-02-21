
import CryptoJS from 'crypto-js';

// Application salt for PAN hashing - ensures hashes are unique to this app
const APP_KYC_SALT = 'CHING_PAY_KYC_2026';

export interface KYCResult {
    valid: boolean;
    panHash: string;
    holderType: string;
    holderTypeLabel: string;
    verifiedAt: string;
    error?: string;
}

// PAN holder type mapping (4th character of PAN)
const HOLDER_TYPES: Record<string, string> = {
    'P': 'Individual',
    'C': 'Company',
    'H': 'Hindu Undivided Family',
    'A': 'Association of Persons',
    'B': 'Body of Individuals',
    'G': 'Government Agency',
    'J': 'Artificial Juridical Person',
    'L': 'Local Authority',
    'F': 'Firm / LLP',
    'T': 'Trust',
};

export class KYCService {
    /**
     * Validates PAN card format and generates a ZK-style hash.
     * 
     * PAN Format: ABCPD1234E
     * - Chars 1-3: Alphabetic series (AAA-ZZZ)
     * - Char 4: Holder type (P=Person, C=Company, etc.)
     * - Char 5: First letter of holder's last name
     * - Chars 6-9: Sequential number (0001-9999)
     * - Char 10: Alphabetic check digit
     * 
     * For production compliance, replace the body of verifyPAN()
     * with a call to Surepass/NSDL/Digilocker API.
     */
    static verifyPAN(panNumber: string, fullName: string): KYCResult {
        const now = new Date().toISOString();

        // Normalize
        const pan = panNumber.toUpperCase().trim();
        const name = fullName.trim();

        // Validate name
        if (!name || name.length < 2) {
            return {
                valid: false,
                panHash: '',
                holderType: '',
                holderTypeLabel: '',
                verifiedAt: now,
                error: 'Please enter your full name as on PAN card',
            };
        }

        // Validate PAN format
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
        if (!panRegex.test(pan)) {
            return {
                valid: false,
                panHash: '',
                holderType: '',
                holderTypeLabel: '',
                verifiedAt: now,
                error: 'Invalid PAN format. Expected: ABCPD1234E',
            };
        }

        // Extract holder type (4th character)
        const holderTypeChar = pan[3];
        const holderTypeLabel = HOLDER_TYPES[holderTypeChar] || 'Unknown';

        // For UPI payments, only individuals (P) should be allowed
        if (holderTypeChar !== 'P') {
            return {
                valid: false,
                panHash: '',
                holderType: holderTypeChar,
                holderTypeLabel,
                verifiedAt: now,
                error: `Only individual PAN cards are accepted. Detected: ${holderTypeLabel}`,
            };
        }

        // Cross-check: 5th character should match first letter of last name
        const lastNameInitial = name.split(' ').pop()?.[0]?.toUpperCase();
        if (lastNameInitial && pan[4] !== lastNameInitial) {
            // This is a soft warning, not a hard failure
            // Some users may have name mismatches
            console.warn(`PAN 5th char '${pan[4]}' doesn't match last name initial '${lastNameInitial}'`);
        }

        // Generate ZK-style hash — NEVER store the raw PAN
        const panHash = CryptoJS.SHA256(pan + APP_KYC_SALT).toString();

        return {
            valid: true,
            panHash,
            holderType: holderTypeChar,
            holderTypeLabel,
            verifiedAt: now,
        };
    }

    /**
     * Generates the encryption key from phone + PIN.
     * Used to encrypt/decrypt the Stellar secret key.
     */
    static deriveEncryptionKey(phone: string, pin: string = '0000'): string {
        return CryptoJS.SHA256(phone + pin).toString();
    }
}
