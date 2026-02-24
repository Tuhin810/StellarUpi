<p align="center">
  <img src="https://api.dicebear.com/7.x/shapes/svg?seed=StellarPay&backgroundColor=E5D5B3&size=128" alt="StellarUpi Logo" width="120" height="120" />
</p>

<h1 align="center">Ching (StellarUPI)</h1>

<p align="center">
  <strong>The "UPI for Crypto" — Bridging Decentralized Finance with the Familiarity of Everyday Payments</strong>
  <br />
  <em>Next-Generation Web3 Payment System built on the Stellar Blockchain</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Blockchain-7C3AED?style=for-the-badge&logo=stellar&logoColor=white" alt="Stellar Blockchain" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/ZK--Proofs-Privacy-000000?style=for-the-badge" alt="ZK Proofs" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
</p>

---

## 🌟 Vision

**Ching (StellarUPI)** is designed to revolutionize the mass adoption of blockchain technology by mapping the complex world of Web3 onto the highly successful, intuitive **UPI (Unified Payments Interface)** model.

We eliminate the friction of 12-word seed phrases, gas fee calculations, and long hexadecimal addresses. Instead, users onboard with just a phone number and transact using human-readable IDs, bringing fractions-of-a-cent fees and sub-five-second finality of the **Stellar Network** to everyday users.

---

## ✨ Core Features

### 🔐 Frictionless Web2-to-Web3 Onboarding
*   📱 **Phone Number Login**: Eliminate seed phrases completely. Users authenticate via SMS OTP (powered by MSG91) to instantly provision a secure, non-custodial wallet.
*   🆔 **Auto-Generated Stellar Handles**: Automatically assigns human-readable identifiers (e.g., `username@stellar`) to replace complex public keys.
*   🛡️ **Embedded KYC & PAN Verification**: Secure, government-backed identity verification bridging the gap between fiat regulations and crypto ecosystems.
*   🔑 **Biometric Authentication (WebAuthn)**: Hardware-level security utilizing FaceID, TouchID, or Windows Hello to sign transactions locally without exposing private keys.

### 💸 Universal & Private Payments
*   🕵️ **Zero-Knowledge (ZK) "Incognito Mode"**: Toggle privacy on demand. Uses `snarkjs` to generate ZK proofs locally, hiding sender, receiver, and transaction amounts while settling publicly on Stellar.
*   📸 **Universal QR Scanner**: Scan *any* standard payment QR code (EVM or Stellar). The app automatically parses the payload and handles cross-chain routing on the backend.
*   🦊 **Pay with Freighter & Web3 Wallets**: Full interoperability. Users can seamlessly connect Freighter or EVM wallets to process direct transactions instantly.
*   💵 **Purchase XLM (Direct Fiat Onramp)**: Buy XLM natively using local fiat (INR) via an integrated Onramp SDK overlay. Users never leave the app to top up their balance.
*   🏦 **Withdraw to Bank (Offramp)**: Effortlessly withdraw crypto balances directly to traditional bank accounts securely using integrated offramp gateways.
*   📅 **Scheduled Payments**: Set-and-forget transaction logic utilizing Soroban Smart Contracts to pay rent, subscriptions, or salaries automatically.
*   💱 **Automated Path Payments**: Built-in Stellar path-finding logic automatically swaps assets (e.g., USDC to XLM) to get the best exchange rate behind the scenes during a transfer.

### 👨‍👩‍👧‍👦 Social Finance & Shared Economy
*   💬 **Real-time Chat P2P**: Discuss transactions, share media, and interact socially in real-time without leaving the payment app. Firebase powers instant message sync.
*   📥 **In-Chat Payment Requests**: Easily drop a "Request Money" card perfectly integrated into a conversation thread. One tap to pay and settle on-chain instantly.
*   🍕 **Group Ledgers & Split Bills**: Create groups for dinners, trips, or shared rent. Divide expenses equally or customize amounts, and track who owes what seamlessly.
*   🏺 **Gullak (Savings Vault)**: A dedicated vault mimicking traditional "Gullak" (piggy banks) to encourage micro-savings safely secured on the blockchain.
*   🧑‍🧑‍🧒 **Family Vaults**: Empower financial literacy. Parents can create a master family vault, add dependents, and set granular daily, weekly, or monthly spending limits.

### 🤖 Raze AI Assistant
*   🧠 **Neural Financial Intelligence**: Powered by Google's Gemini API, Raze provides proactive, instant insights into your spending habits and transaction history.
*   🎙️ **Voice-to-Action Processing**: Use natural language to interact. Simply say "Send 50 XLM to Alice" or "What is my balance?" and Raze executes the command.
*   🧾 **AI Receipt Scanner (OCR)**: Utilize integrated Tesseract.js to scan physical receipts, itemize purchases, and automatically split the bill amongst group members.

---

## 🏗️ Deep Tech Analysis & Architecture

### 1. The "Ching Vault" — Non-Custodial Architecture
Ching employs a unique security model to maintain high usability without compromising on-chain sovereignty.
- **Key Generation**: Upon phone verification, an ECDSA/Ed25519 keypair is generated client-side.
- **Signature-Based Encryption**: The Stellar private key is encrypted using a key derived from the user's phone number + PIN.
- **Cloud Synchronization**: Encrypted keys are stored in Firebase Firestore. Ching never has access to the plaintext secrets.
- **Recovery**: If a user switches devices, they re-authenticate via OTP and provide their PIN to decrypt and re-instantiate their local wallet.

### 2. Zero-Knowledge "Incognito" Core
The privacy layer leverages **zk-SNARKs** (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge).
- **Circuit Logic**: Computes a hash of the transaction details (sender, receiver, amount) and generates a cryptographic proof.
- **Proof Generation**: Performed locally using `snarkjs`.
- **Public Signals**: Includes only the proof and specific obfuscated public markers.
- **Verification**: The proof is submitted to the Stellar network (or verified via a Soroban contract), confirming the transaction's validity and authorization without revealing the internal state.

### 3. Background Automation & Scheduled Payments
The `ScheduledPayService` acts as a distributed "Crontab" for the Stellar network.
- **Worker Pattern**: In-app background worker polls Firestore for payments whose `scheduledDate` has passed.
- **Atomic Locking**: Uses an in-memory `processingIds` lock + immediate Firestore status updates to `completed` before execution to prevent double-spending or race conditions.
- **Fault Tolerance**: If a transaction fails (e.g., op_underfunded), the system records the exact `failReason` for user recovery.

### 4. Raze AI: Neural Function Calling
Integration with **Gemini 1.5 Flash** enables a sophisticated conversational layer.
- **System Instruction**: Enforces "Identity Resolution Protocols," preventing the AI from generic responses and forcing it to look up IDs via `search_user`.
- **Multimodal**: Supports audio-to-text transcription via `audio/webm` inline data.
- **Recursive Tooling**: The AI can chains multiple function calls (e.g., `search_user` -> `get_financial_summary`) to answer complex queries.

### 5. Gullak & Protocol Yield Engine
The high-yield savings vault (Gullak) is driven by a Streak-based yield engine.
- **Chillar Deposits**: Atomic Stellar transactions that send main payments to merchants and round-ups to the Gullak vault in a single ledger entry.
- **Yield Logic**: APR is calculated daily based on the user's `streakLevel`:
  - **Orange**: 3.6% APR (~0.0001 daily)
  - **Blue**: 11% APR (~0.0003 daily)
  - **Purple**: 18% APR (~0.0005 daily)
- **Compounding**: Calculated on-the-fly and applied to the Firestore balance mapping.

---

## � Project Structure

```text
├── App.tsx             # Root application logic & background workers
├── context/            # Global state (Auth, Network, Notifications)
├── services/           # CORE LOGIC
│   ├── stellar.ts      # Blockchain operations (P2P, Chillar, Path Payments)
│   ├── zkProofService.ts # ZK-SNARK proof generation & verification
│   ├── aiService.ts    # Gemini AI integration & tool definitions
│   ├── db.ts           # Firestore data management & yield logic
│   ├── scheduledPayService.ts # Background payment worker
│   ├── kycService.ts   # PAN verification & encryption key derivation
│   └── panScannerService.ts # In-browser Tesseract OCR scanner
├── pages/              # Route components (Dashboard, Gullak, Chat, etc.)
├── components/         # Reusable atomic UI components
└── types.ts            # Global TypeScript interface definitions
```

---

## 🛠️ Tech Stack & Advanced Dependencies

*   **UI/UX**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS, Framer Motion
*   **Blockchain**: `@stellar/stellar-sdk`, `@stellar/freighter-api`
*   **Privacy**: `snarkjs`, `crypto-js`, `circomlibjs`
*   **AI/OCR**: `@google/generative-ai`, `tesseract.js`
*   **Backend/Realtime**: `firebase/firestore`, `firebase/auth`
*   **Integration**: Onramp SDK, MSG91 (OTP)

---

<p align="center">
  <strong>Built with ❤️ for the Stellar Community Fund</strong>
  <br />
  <em>Empowering the next billion users with Decentralized Finance.</em>
</p>
