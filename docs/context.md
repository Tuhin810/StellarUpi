# Software Context - StellarPay UPI

## 1. Project Background
StellarPay UPI is a specialized fintech application built during the transition toward decentralized finance (DeFi). It leverages the Stellar blockchain's speed and low cost to provide a practical alternative to traditional payment systems like UPI in India.

## 2. Technical Architecture
The application follows a **Decentralized Frontend-Heavy** architecture:
- **Frontend**: React 19 (Vite) acting as the primary transaction orchestrator.
- **Blockchain**: Stellar Network (Horizon API) handles all value transfers.
- **Backend/State**: Firebase Firestore handles social metadata (chats, group names, profile info) and non-sensitive transaction records.
- **Security**: AES-256 client-side encryption. The "Master Key" is derived from a Web3 wallet signature, ensuring the service providers never have access to user funds.

## 3. Tech Stack Components
- **Framework**: React 19 + TypeScript 5.8
- **Styling**: Tailwind CSS (Dark/Gold Theme)
- **Icons**: Lucide React
- **Blockchain SDK**: `stellar-sdk`
- **Wallet Auth**: `@web3modal/ethers` + `ethers` (v6)
- **Database**: Firebase (Cloud Firestore, Auth, FCM)
- **Utilities**: `crypto-js` (Encryption), `html5-qrcode` (Scanning)

## 4. Key Workflows

### 4.1 Onboarding
1. User connects MetaMask/WalletConnect.
2. App requests a signature of a standard message.
3. Signature is used as a cryptographic key to encrypt/decrypt a Stellar secret key.
4. If new, a Stellar account is created and funded (on Testnet) or requires funding (on Mainnet).

### 4.2 Payments
1. User enters a handle (e.g., `bob@stellar`).
2. App queries Firestore to find the Stellar Public Key associated with that handle.
3. Transaction is built, signed locally with the decrypted Stellar secret, and submitted to Horizon.
4. Upon confirmation, a record is written to Firestore for history and a push notification is sent.

### 4.3 Family Management
1. Owner UID creates a `FamilyMember` record.
2. Owner's secret is re-encrypted with a shared key or specific member identifier to allow delegation without exposing the raw secret.

## 5. Development Standards
- **Naming Convention**: PascalCase for components, camelCase for functions and variables.
- **File Structure**: Feature-based organization within `pages/` and `components/`.
- **State Management**: Context API for global states (Auth, Network).
- **Responsive Design**: Mobile-first, targetting a maximum width of 448px (standard mobile viewport) on desktop.

## 6. Project Constraints
- **Network**: Operates on Stellar Public (Mainnet) or Testnet (configured in settings).
- **Environment**: Requires `VITE_WALLETCONNECT_PROJECT_ID` for Web3 connectivity.
- **Dependencies**: Relies on CoinGecko for real-time INR conversion; may have rate limits on free tier.
