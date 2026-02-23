<p align="center">
  <img src="https://api.dicebear.com/7.x/shapes/svg?seed=StellarPay&backgroundColor=E5D5B3&size=128" alt="StellarUpi Logo" width="120" height="120" />
</p>

<h1 align="center">StellarUpi (Stellar Pay)</h1>

<p align="center">
  <strong>Bridging Decentralized Finance with the Familiarity of UPI</strong>
  <br />
  <em>The Next-Generation Web3 Payment System built on the Stellar Blockchain</em>
</p>

<p align="center">
  <a href="#-vision">Vision</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-legal--compliance">Compliance</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Blockchain-7C3AED?style=for-the-badge&logo=stellar&logoColor=white" alt="Stellar Blockchain" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PWA-Ready-009688?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA Ready" />
</p>

---

## 🌟 Vision

**StellarUpi** (formerly known as Ching Pay) aims to revolutionize the adoption of blockchain technology in India and beyond by mapping the complex world of Web3 onto the highly successful, intuitive **UPI (Unified Payments Interface)** model. 

Our mission is to eliminate the friction of long, hexadecimal wallet addresses and replace them with human-readable IDs (e.g., `user@stellar`), making cross-border and local crypto transactions as easy as scanning a QR code or sending a text message.

---

## ✨ Features

### 🔐 **Advanced Web3 & Wallet Ecosystem**
- **Wallet-agnostic Login**: Connect using **MetaMask**, **WalletConnect**, or **Coinbase Wallet** via Web3Modal.
- **Freighter Integration**: Native support for **Freighter Wallet** including **SEP-7** standard for seamless QR-based "Send" transactions.
- **Auto-Generated UPI IDs**: Your Ethereum address automatically maps to a user-friendly Stellar ID (e.g., `0xab12...cd@stellar`).
- **Signature-based Encryption**: Your Stellar private keys are encrypted client-side using your Web3 wallet's signature.

### 💸 **Seamless Payments**
- **UPI-Style Transfers**: Send XLM and other Stellar assets using simple `name@stellar` handles.
- **Sonic Transfer (Nearby Sync)**: Send and receive payments using **Sound-based Pairing** (GGWave). No internet pairing or manual entry needed for nearby devices.
- **Universal QR Ecosystem**: Scan any Stellar-compatible QR code or generate SEP-7 compliant codes for instant payments.
- **Accountless Onboarding**: Send money to non-users via **Claimable Balances**. They receive a "Viral Link" to claim funds once they join.
- **Path Payments**: Automatic path-finding for the best exchange rates (e.g., Send USDC, Recipient receives XLM).

### 🏦 **Automated Finance & Savings**
- **Gullak (Piggy Bank)**: Goal-based automated savings. Small "chillar" (round-ups) from your daily payments are automatically moved to a secure vault.
- **Yield-Bearing Streaks**: Earn passive yield on your Gullak balance based on your daily usage streak. Tiers range from Starter to Pro Saver (MAX APR).
- **Scheduled & AutoPay**: Set up recurring payments for rent, subscriptions, or family allowances.
- **Family Vaults**: Master vaults for parents with granular spending limits and real-time tracking for dependents.

### 👨‍👩‍👧‍👦 **Social & Shared Economy**
- **Group Bill Splitting**: Create groups, chat in real-time, and split expenses equally or with custom amounts.
- **Shared Wallets**: Multi-signature pools for shared expenses (e.g., roommates, travel teams).
- **Integrated Group Chat**: Discuss transactions and settle debts without leaving the app.

### 🤖 **Raze AI Assistant**
- **Neural Financial Intelligence**: Powered by **Gemini 1.5 Flash**, Raze provides instant insights into your spending habits.
- **Voice-to-Action**: Send money or check balances using natural voice commands.
- **Automated Identity Resolution**: Raze resolves names to Stellar addresses instantly from chat context.

### 🛡️ **Premium Security & Privacy**
- **Biometric Auth (WebAuthn)**: Authorize transactions using **FaceID**, **TouchID**, or Windows Hello.
- **Hardware-Level Protection**: FIDO2 standards ensure your transactions are tamper-proof.
- **In-App Notifications**: Real-time custom notification system for payment alerts, group invites, and savings goals.
- **On-Device KYC**: Secure identity verification using Tesseract.js for private, locally processed OCR.

### 💳 **Fiat Gateway**
- **Buy XLM with INR**: Direct UPI/NetBanking integration via Onramp.money.
- **Global Off-ramp**: Withdraw to bank accounts via Transak integration.
- **Live Market Data**: Real-time XLM/INR rates via CoinGecko.

---

## 🛠️ Tech Stack

### **Frontend & UI**
- **Core**: React 19, TypeScript 5.8, Vite 6
- **Styling**: Vanilla CSS (Premium Aesthetics), Framer Motion (Micro-interactions)
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin for offline-first experience

### **Core Infrastructure**
- **Blockchain**: Stellar SDK, Horizon API, Soroban (coming soon)
- **Communications**: GGWave (Sonic Data Transfer)
- **Web3**: Web3Modal, Ethers.js 6, Freighter SDK
- **Database**: Firebase Firestore (Real-time updates)
- **Identity**: Tesseract.js (OCR), WebAuthn API (Biometrics)

---

## 🏗️ Architecture

### **Data Flow**
1. **Auth**: Web3 Wallet Sign → AES Key Generation → Stellar Vault Unlock.
2. **Payment**: User Input → Stellar Path Finding → Transaction Signing → Horizon Submission.
3. **Storage**: Firebase stores encrypted metadata, transaction history, and group states.

### **Directory Structure**
```text
/src
├── components/   # Atomic UI components (Sonic, QR, AI)
├── context/      # Global state (Auth, Network, Notifications)
├── hooks/        # Reusable logic (useSonic, useStellar)
├── pages/        # Route-level views (Gullak, Send, SharedWallet)
├── services/     # API & Blockchain logic (Claimable, Scheduled)
├── utils/        # Helper functions
└── types.ts      # Global TS interfaces
```

---

## ⚖️ Legal & Compliance

StellarUpi is designed to operate as a **Virtual Digital Asset Service Provider (VDASP)** under the PMLA guidelines.

- **FIU-IND Ready**: Architecture supports reporting of suspicious transactions.
- **TDS Compliance**: Automated 1% TDS calculation logic for sell/swap events.
- **Taxation Support**: Generates annual tax statements for 30% flat capital gains reporting.
- **Identity Verification**: Multi-layer KYC (PAN/Aadhaar) with on-device processing.

> For detailed policy, see [public/legal_compliance_policy.md](public/legal_compliance_policy.md)

---

## 🚀 Roadmap

### **Phase 1: Foundation (Completed)**
- [x] Web3 Authentication & Stellar Vault
- [x] P2P Payments & QR Scanner
- [x] Family Wallet System
- [x] Initial Raze AI Integration

### **Phase 2: Growth (Q1 2026 - Current)**
- [x] **Sonic Transfer**: Sound-based payment pairing.
- [x] **Gullak Savings**: Automated round-ups and yield-bearing streaks.
- [x] **Accountless Onboarding**: Viral payment links via Claimable Balances.
- [x] **Freighter SEP-7**: Full support for hardware-linked mobile payments.
- [x] **Scheduled Payments**: Recurring transfers and subscriptions.

### **Phase 3: Scaling (Q2 2026)**
- [ ] **Soroban Smart Contracts**: Move shared wallet logic to on-chain smart contracts for trustless escrow.
- [ ] **Merchant SDK**: Simplified API for local vendors to accept Stellar payments.
- [ ] **AI Receipt Scanning**: Full integration of Gemini OCR for group expense automation.

---

## 📦 Getting Started

### **1. Prerequisites**
- Node.js 18.x or 20.x
- A Web3 Wallet (MetaMask, Rabby, etc.)
- A WalletConnect Project ID (Free from [WalletConnect Cloud](https://cloud.walletconnect.com))

### **2. Setup**
```bash
# Clone the repo
git clone https://github.com/Tuhin810/StellarUpi.git
cd StellarUpi

# Install dependencies
npm install

# Create .env file
echo "VITE_WALLETCONNECT_PROJECT_ID=your_id_here" > .env
```

### **3. Run Development**
```bash
npm run dev
```

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRUBUTING.md](CONTRIBUTING.md) (coming soon) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ for the Stellar Global Hackathon</strong>
  <br />
  <em>Empowering the next billion users with Decentralized Finance.</em>
</p>
