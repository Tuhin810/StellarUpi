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
- **Phone Number Login**: No seed phrases. Users authenticate via SMS OTP (MSG91 integration) to instantly provision a non-custodial wallet.
- **Auto-Generated Stellar IDs**: Users automatically receive a human-readable identifier (e.g., `user@stellar`).
- **PAN Verification / KYC**: Secure identity verification bridging the trust gap between fiat and crypto systems.

### 💸 Universal & Private Payments
- **Zero-Knowledge (ZK) Incognito Mode**: Toggle "Incognito Mode" to leverage ZK proofs for payments. Settle instantly on the public Stellar network while keeping financial details strictly private.
- **Universal QR Scanner**: Scan *any* standard payment QR code (EVM or Stellar) to seamlessly pay directly from your native balance via cross-chain interoperability.
- **Direct Fiat Onramp**: Buy XLM natively using INR via an integrated Onramp SDK overlay. No need to visit external exchanges.
- **Scheduled Payments**: Set-and-forget recurring payments powered by programmable logic.

### 👨‍👩‍👧‍👦 Social Finance & Shared Economy
- **Integrated Social Chat**: Chat directly with friends, send money, or trigger a **Payment Request** seamlessly within the messaging interface.
- **Group Payments & Split Bills**: Create groups, divide expenses equally or customize splits, and settle debts instantly in crypto.
- **Family Vaults**: Shared economy features allowing parents to set up master vaults, add dependents, and assign configurable spending limits.

### 🤖 Raze AI Assistant
- **Neural Financial Intelligence**: Powered by **Gemini API**, Raze provides instant insights into your spending habits.
- **Voice-to-Action**: Send money or check balances using natural voice commands.

---

## 🏗️ System Architecture & Data Flows

### 1. High-Level System Architecture

```mermaid
graph TD
    subgraph Client Application [Ching Frontend - React/Vite]
        UI[User Interface]
        AuthCtx[Auth & State Context]
        ZK[ZK Core / snarkjs]
        QR[Universal QR Scanner]
        AI[Raze AI Assistant / Gemini]
    end

    subgraph Backend Services
        FB_Auth[Firebase Auth & OTP]
        FB_DB[Firestore DB]
        MSG91[MSG91 SMS Gateway]
    end

    subgraph Blockchain Infrastructure
        Stellar[Stellar Horizon API]
        Soroban[Soroban Smart Contracts]
        Onramp[Onramp.money SDK]
    end

    UI <--> AuthCtx
    AuthCtx <--> FB_Auth
    FB_Auth <--> MSG91
    AuthCtx <--> FB_DB
    
    UI <--> QR
    UI <--> ZK
    ZK -.->|Generates Proof| Stellar
    
    UI <--> Stellar
    UI <--> Soroban
    UI <--> Onramp
    
    UI <--> AI
```

### 2. Frictionless Onboarding Flow (Web2 to Web3)

```mermaid
sequenceDiagram
    participant User
    participant App as Ching App
    participant SMS as MSG91 / Firebase
    participant DB as Firestore DB
    participant Stellar as Stellar Network

    User->>App: Enters Phone Number
    App->>SMS: Request OTP
    SMS-->>User: Delivers SMS OTP
    User->>App: Inputs OTP
    App->>SMS: Validate OTP
    SMS-->>App: Authentication Success
    App->>App: Generate ECDSA Keypair (Background)
    App->>DB: Encrypt & Store Keys safely
    App->>Stellar: Provision Account & Fund (Sponsorship)
    Stellar-->>App: Account Ready
    App-->>User: Dashboard Unlocked (No Seed Phrase!)
```

### 3. ZK "Incognito" Payment Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as App Interface
    participant ZK as ZK Prover (Client)
    participant Core as Stellar Network

    User->>UI: Toggle 'Incognito Mode' & Tap Send
    UI->>ZK: Initialize zk-SNARK circuit with payment inputs
    Note over ZK: Generates cryptographic proof locally<br/>hiding sender, receiver, and amount.
    ZK-->>UI: Return ZK Proof & Public Signals
    UI->>Core: Submit Transaction Payload + ZK Proof
    Note over Core: Validates Proof without<br/>revealing underlying logic
    Core-->>UI: Transaction Confirmed (Private)
    UI-->>User: Success Notification
```

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript 5.8, Vite 6
- **State & Data**: Firebase Auth & Firestore, React Router
- **Cryptography & Privacy**: `snarkjs`, `circomlibjs`, Ethers.js
- **Blockchain**: Stellar SDK (`@stellar/stellar-sdk`), Freighter API (`@stellar/freighter-api`)
- **UI/UX & Animation**: Tailwind CSS, Framer Motion, Lucide React, LottieFiles
- **Integrations**: Onramp (Fiat), MSG91 (SMS OTP), Tesseract.js (OCR), Gemini API (AI)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.x or v20.x)
- Firebase Project Setup
- (Optional) MSG91 API Keys for SMS OTP, Onramp keys for Fiat.

### Installation

```bash
# Clone the repository
git clone https://github.com/Tuhin810/StellarUpi.git
cd StellarUpi

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in your Firebase, Stellar, and Onramp keys
```

### Development

```bash
# Start the local development server
npm run dev
```

---

## ⚖️ Legal, Security & Compliance

- **FIDO2 / WebAuthn**: Supports hardware-standard biometric transaction signing.
- **KYC & PAN Integration**: Designed to be compliant for regional Virtual Digital Asset Service Provider (VDASP) operations.
- **Non-Custodial**: Private keys are encrypted locally and never exposed to the server in plaintext.

---

<p align="center">
  <strong>Built with ❤️ for the Stellar Community Fund</strong>
  <br />
  <em>Empowering the next billion users with Decentralized Finance.</em>
</p>
