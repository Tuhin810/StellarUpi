# 🔐 Web3 Authentication

StellarUpi implements a unique **Signature-Based Vault** system. This allows users to enjoy the security of a hardware wallet or non-custodial wallet without the friction of managing the specific keys for the Stellar network manually.

## 🚀 The Philosophy
Most users find managing multiple seed phrases (one for ETH, one for Stellar, one for Sol) exhausting. StellarUpi allows your **Ethereum signature** to act as the "Master Key" for your Stellar funds.

## 🛠️ How it Works

### 1. Key Derivation
When you log in, we don't ask for a password. Instead, you sign a unique, human-readable string:
`"Sign this to unlock your encrypted StellarUpi vault. This signature is never sent to our server."`

### 2. Encryption (AES-256-GCM)
We use the **PBKDF2** algorithm to turn your signature into a strong cryptographic key. This key is used to encrypt your Stellar private key (`S...`) using **AES-256**.

### 3. Decryption (Zero-Knowledge)
*   **The Server's Role**: Our database stores only the **encrypted** ciphertext. Even if our database is breached, the attacker cannot decrypt your Stellar key because they lack your signature.
*   **Local Execution**: The decryption happens strictly in your browser's memory (RAM). The decrypted secret is never written to disk or sent across the network.

## 📱 Biometric Enhancement (Passkeys)
For users on mobile or desktop with biometrics (FaceID, TouchID, Windows Hello), we offer **WebAuthn** integration.

*   **Fingerprint Sign**: You can link your vault to a hardware-bound passkey.
*   **Fast Unlock**: Subsequent transactions can be authorized with a fingerprint/face scan instead of re-signing with your Web3 wallet.

## 🚧 Safety Features
*   **Auto-Wipe**: On logout or session timeout, all sensitive keys in memory are wiped.
*   **PIN Fallback**: For legacy devices, a secondary 4-digit PIN is derived and encrypted alongside the main vault for ultra-fast transactions within the app.

---

> 📘 **Security Tip:** Because the decryption happens locally, your funds are only as secure as your computer. Avoid using public computers to access your StellarUpi vault.
