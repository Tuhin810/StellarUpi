# Product Requirements Document (PRD) - Ching Pay UPI

## 1. Product Overview
**Ching Pay UPI** is a decentralized payment application that brings the seamless user experience of India's Unified Payments Interface (UPI) to the Stellar blockchain. It enables users to send and receive funds using human-readable handles (e.g., `user@stellar`) instead of complex blockchain addresses, while maintaining the security and decentralization of Web3.

## 2. Problem Statement
Despite the growth of blockchain technology, peer-to-peer payments remain complex for the average user due to:
- Long, non-human-readable public keys.
- High transaction fees on many networks.
- Complexity in managing private keys.
- Lack of integrated social features like group splitting or family controls.
- Friction in converting fiat (INR) to crypto and vice-versa.

## 3. Goals & Objectives
- **Simplicity**: Provide a UPI-like experience for Web3 payments.
- **Security**: Ensure private keys are never exposed to the server through client-side encryption.
- **Social Integration**: Build features for families and groups to manage shared expenses.
- **Accessibility**: Provide seamless fiat on/off-ramp for the Indian market (INR).
- **Utility**: Support recurring payments and automated spending controls.

## 4. Target Audience
- **Tech-savvy Indian users** looking for alternatives to traditional banking.
- **Web3 Enthusiasts** who want a decentralized yet usable payment tool.
- **Families** who want to manage shared budgets with spending limits.
- **Groups** who frequently split expenses (friends, roommates).

## 5. Functional Requirements

### 5.1 Authentication & Wallet Management
- **Web3 Login**: Integration with MetaMask and WalletConnect.
- **Stellar Vault**: Automatic creation of Stellar accounts mapped to the Web3 identity.
- **Encrypted Storage**: Client-side AES-256 encryption of Stellar secrets using signed messages.
- **Identity Mapping**: Mapping Ethereum addresses to `name@stellar` handles in a decentralized registry.

### 5.2 Payment Features
- **Send/Receive**: Instant XLM transfers via Stellar handles or QR codes.
- **Transaction History**: Real-time activity feed with INR value conversion.
- **Categories & Memos**: Ability to categorize spending and add notes to transactions.
- **Success Notifications**: Instant visual and haptic feedback on successful payments.

### 5.3 Family Wallet System
- **Shared Access**: Parent accounts can share wallet access with children/members.
- **Spending Caps**: Configurable daily limits for each family member.
- **Observation**: Parents can track real-time spending of sub-accounts.

### 5.4 Group Splitting & Chat
- **Group Creation**: Create persistent groups for sharing expenses.
- **Equal/Custom Splits**: Split bills among group members.
- **In-App Messaging**: Real-time chat integrated with payment requests.
- **Settlement Tracking**: Visual indicators for who owes what.

### 5.5 Fiat Gateway
- **On-Ramp**: Integration with Onramp.money for buying XLM with UPI/Net Banking.
- **Off-Ramp**: Integration with Transak for selling XLM to bank accounts.
- **Live Rates**: Real-time XLM/INR price feed via CoinGecko.

### 5.6 Advanced Features
- **AutoPay**: Recurring payments for subscriptions (daily, weekly, monthly).
- **Push Notifications**: FCM-based alerts for payments, requests, and group activities.
- **PWA**: Installable web application for a native mobile experience.

## 6. Non-Functional Requirements
- **Security**: No unencrypted private keys stored anywhere.
- **UI/UX**: Premium "Gold & Obsidian" design system with smooth animations.
- **Performance**: Transaction finality under 5 seconds (Stellar Network).
- **Compliance**: Integration with KYC-compliant ramps for fiat transactions.

## 7. Future Roadmap (Hackathon Goals)
- **"Accountless" Onboarding**: Implement Claimable Balances to allow sending money to people who haven't joined yet via shareable links.
- **Multi-Asset Path Payments**: Leverage Stellar's native DEX to allow users to pay in any asset (e.g., XLM) while the recipient receives another (e.g., USDC).
- **AI-Powered Smart Budgeting**:
    - **AI Receipt Scanner**: Integrate Gemini to parse receipt photos into group expense splits.
    - **Smart Settlement**: Use Soroban smart contracts for group escrow and decentralized voting.
    - **Spending Insights**: AI-driven analysis of transaction categories for better financial management.
- **Merchant Integration**: API for businesses to accept Ching Pay.
- **Loyalty Program**: Rewards for frequent users.
- **Cross-Chain Support**: Bridging other assets to the Stellar network.
