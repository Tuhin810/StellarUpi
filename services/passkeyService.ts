
import { UserProfile } from "../types";
import { updateUserDetails } from "./db";

export class PasskeyService {
    /**
     * Check if the browser supports WebAuthn/Biometrics
     */
    static isSupported(): boolean {
        return !!window.PublicKeyCredential;
    }

    /**
     * Register a new Passkey (Biometric) for the user
     */
    static async registerPasskey(user: UserProfile): Promise<boolean> {
        if (!this.isSupported()) {
            throw new Error("Biometric authentication is not supported on this device/browser.");
        }

        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const userID = Uint8Array.from(user.uid, c => c.charCodeAt(0));

            const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: "StellarUpi",
                    id: window.location.hostname,
                },
                user: {
                    id: userID,
                    name: user.email,
                    displayName: user.displayName || user.stellarId,
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" }, // ES256
                    { alg: -257, type: "public-key" }, // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    residentKey: "preferred",
                },
                timeout: 60000,
                attestation: "none",
            };

            const credential = (await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions,
            })) as PublicKeyCredential;

            if (credential) {
                // In a real app, we'd send the credential.response to the server to verify.
                // For this demo/PWA, we'll store the ID to know this device has a passkey.
                const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

                await updateUserDetails(user.uid, {
                    passkeyEnabled: true,
                    passkeyCredentialId: credentialId,
                });

                return true;
            }
            return false;
        } catch (error: any) {
            console.error("Passkey Registration Error:", error);
            if (error.name === "NotAllowedError") {
                throw new Error("Registration cancelled or timed out.");
            }
            throw error;
        }
    }

    /**
     * Authenticate using the registered Passkey (Biometric)
     */
    static async authenticatePasskey(user: UserProfile): Promise<boolean> {
        if (!user.passkeyEnabled || !user.passkeyCredentialId) {
            throw new Error("No Passkey registered for this account.");
        }

        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const credentialId = Uint8Array.from(atob(user.passkeyCredentialId), c => c.charCodeAt(0));

            const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
                challenge,
                allowCredentials: [
                    {
                        id: credentialId,
                        type: "public-key",
                    },
                ],
                userVerification: "required",
                timeout: 60000,
            };

            const assertion = (await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions,
            })) as PublicKeyCredential;

            return !!assertion;
        } catch (error: any) {
            console.error("Passkey Authentication Error:", error);
            if (error.name === "NotAllowedError") {
                throw new Error("Authentication cancelled.");
            }
            return false;
        }
    }
}
