# Features & Conversion Guide - Ching Pay UPI

## 1. Feature Deep-Dive

### 🔐 Web3 Authentication & Secure Vault
Ching Pay uses a unique hybrid authentication model:
- **Web3 Connector**: Users sign in using MetaMask or WalletConnect.
- **Master Signature**: Upon login, the user signs a standard message. The resulting cryptographic signature is used as the decryption key for their Stellar secret.
- **Client-Side Security**: The Stellar private key is encrypted via AES-256 and stored in Firebase. It is only decrypted in the browser's memory after the user provides their Web3 signature. This ensures the service provider never sees the raw secret key.

### 🆔 Human-Readable UPI Handles
Traditional Stellar addresses are 56-character strings (e.g., `GA...`). Ching Pay replaces these with:
- **Handle Mapping**: Every user chooses a handle like `alex@stellar`.
- **Decentralized Registry**: A Firestore-backed registry maps these handles to Stellar Public Keys.
- **Easy Lookup**: When you type a handle, the app instantly resolves it to the correct public key for the transaction.

### 👨‍👩‍👧‍👦 Family Wallet System
Designed for shared financial management:
- **Sub-Account Delegation**: Owners can add members (e.g., children) to their family vault.
- **Spending Controls**: Owners set "Daily Limits" in XLM/INR.
- **Real-Time Tracking**: Every transaction made by a family member is deducted from the shared vault and tracked against their specific limit.
- **Encrypted Sharing**: The vault's encrypted secret is re-shared using a secure delegation token mechanism.

### 👥 Group Expense Splitting
A social layer for shared costs:
- **Integrated Chat**: Real-time P2P and Group chat using Firebase.
- **One-Tap Splits**: Users can create a "Split" in a group. The app calculates the share (Equal or Custom) and sends payment requests to all members.
- **Settlement Tracking**: Visual status (Pending/Paid) for every participant in a split.

---

## 2. XLM to INR Conversion (The "How it Works")

Ching Pay provides a seamless experience for converting between XLM (Stellar's native asset) and INR (Indian Rupee).

### 📈 Real-Time Price Oracle
The application maintains a "Live Rate" to ensure users always know the exact value of their holdings:
- **API**: Uses the **CoinGecko API** (`stellar` vs `inr`).
- **Update Frequency**: Fetched on dashboard load and before every transaction to calculate the INR equivalent of XLM.
- **Logic**: 
  ```typescript
  const inrBalance = xlmAmount * currentXlmPrice;
  ```

### 💸 Instant Fiat-to-Crypto (Buy XLM)
1. **User Action**: User enters an amount in INR and clicks "Add Money".
2. **Provider**: The app initializes the **Onramp.money** or **Transak** SDK.
3. **Payment**: Users pay via **UPI** (PhonePe, Google Pay, etc.), IMPS, or Debit Card.
4. **Fulfillment**: Once the fiat payment is confirmed (instantly for UPI), the provider sends XLM to the user's Stellar public key.
5. **Confirmation**: The app detects the new balance through the Stellar Horizon API and updates the UI.

### 💰 Instant Crypto-to-Fiat (Sell/Withdraw)
1. **User Action**: User specifies XLM amount to sell and provides bank details (via the SDK).
2. **Bridge Transfer**: The app builds a Stellar transaction that sends XLM to the provider's escrow/bridge address.
3. **Internal Conversion**: The provider (Transak/Onramp) receives the XLM on-chain.
4. **INR Payout**: The provider initiates an IMPS/UPI transfer of the equivalent INR (minus fees) to the user's bank account.
5. **Speed**: While the Stellar transfer takes ~5 seconds, the bank settlement usually completes within minutes (depending on the provider's liquidity and banking rails).

### 🛠️ Technical Flow Summary
| Stage | Component | Duration |
| :--- | :--- | :--- |
| **Price Feed** | CoinGecko API | Real-time |
| **P2P Transfer** | Stellar Network (Horizon) | 3 - 5 Seconds |
| **Fiat On-Ramp** | Onramp.money / Transak | 1 - 2 Minutes (UPI) |
| **Fiat Off-Ramp** | Onramp.money / Transak | 2 - 15 Minutes |

---

## 3. Advanced Utility Features
- **AutoPay**: Smart contracts (simulated via service workers) that execute payments at set frequencies (Daily, Monthly).
- **QR Support**: Standardized QR generation that embeds both the Stellar Public Key and the Handle for cross-app compatibility.
- **Push Notifications**: Firebase Cloud Messaging (FCM) sends instant alerts for "Money Received" or "Split Requested" even when the app is closed.
