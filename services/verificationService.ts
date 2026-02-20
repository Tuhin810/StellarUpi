
const SECRET_KEY = 7;

export const decryptDataFrontend = (encoded: string): string => {
    const decoded = atob(encoded); // base64 decode
    let decrypted = '';

    for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) - SECRET_KEY);
    }

    return decrypted;
};

export const VerificationService = {
    /**
     * Sends an OTP via the Hobi SMS Server
     */
    sendOTP: async (phoneNumber: string) => {
        // Clean the number
        let formattedPhone = phoneNumber.replace(/[\s\-\+]/g, '');

        // The API expects the number as is, or maybe with 91 for Indian numbers?
        // In the example it was "8101844250" (10 digits).
        // Let's keep it as is if it's 10 digits.

        try {
            const response = await fetch('https://server.hobi.co.in/api/v1/auth/get-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: formattedPhone }),
            });

            const data = await response.json();

            if (data.result) {
                const decryptedOTP = decryptDataFrontend(data.result);
                console.log('OTP received and decrypted:', decryptedOTP);
                // We can store this in session storage for auto-fill or testing if needed
                sessionStorage.setItem('last_otp', decryptedOTP);
            }

            return data.message === "Data added successfully";
        } catch (error) {
            console.error('Error sending OTP:', error);
            return false;
        }
    },

    /**
     * Verifies the OTP via the Hobi SMS Server
     * Note: If the backend doesn't have a verify endpoint, we might need to check against the decrypted OTP
     */
    verifyOTP: async (phoneNumber: string, otp: string) => {
        // For now, let's assume we still use the old verify endpoint if it exists,
        // or check against the last sent OTP if that's what's intended.
        // But the user didn't provide a verify API, only a get-otp API.

        const lastOtp = sessionStorage.getItem('last_otp');
        if (lastOtp && otp === lastOtp) {
            return true;
        }

        // Fallback to previous logic or return false if no other way to verify
        return false;
    }
};

