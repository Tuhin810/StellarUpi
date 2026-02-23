# 🏁 Quick Start: StellarUpi Developer Guide

Welcome to the **StellarUpi** technical docs. This guide will help you get the project running locally and understand the core architectural decisions.

---

## 🛠️ Environment Setup

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js**: v18.18.0 or higher
- **npm**: v9.0.0 or higher
- **Web3 Wallet**: MetaMask or Rabby (for authentication)

### 2. Clerk/WalletConnect Integration
StellarUpi uses Web3Modal for seamless wallet connectivity.
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/).
2. Create a new project and copy the **Project ID**.
3. Create a `.env` file in the root directory:
```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Installation
```bash
# Clone the repository
git clone https://github.com/Tuhin810/StellarUpi.git

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 🏗️ Core Architecture

StellarUpi follows a **Client-Side First** architecture to maximize security.

### 1. The "Accountless" Auth Flow
We don't use passwords. Users authenticate by signing a cryptographic message with their Web3 wallet.
- **Input**: User Wallet Signature.
- **Process**: The signature is used as a source of entropy to derive an AES-256 key.
- **Output**: The key decrypts the Stellar secret stored in Firestore.

### 2. Stellar Network
- **Testnet**: used for development and internal testing.
- **Horizon API**: We use public Horizon nodes to submit transactions and stream live data.

### 3. Database (Firebase)
- **Users**: Profiles, encrypted secrets, and UPI mappings.
- **Groups**: Split expense configurations and real-time chat messages.
- **Transactions**: Indexed history for fast lookups.

---

## 🚀 Key Directories

- `/src/pages`: Contains all main application views (Dashboard, Send, Groups).
- `/src/services`: The "Brain" of the app.
  - `stellar.ts`: Blockchain logic.
  - `db.ts`: Firestore operations.
  - `encryption.ts`: AES/Web3 signature logic.
- `/src/context`: React contexts for Auth and Network state.

---

## 🛡️ Security Checklists
When contributing, ensure:
1.  **Secret Management**: Never store plaintext Stellar secrets in State or Context. Always keep them in the `sessionStorage` or local variables that clear on transaction completion.
2.  **Input Validation**: All UPI IDs (`user@stellar`) must be validated against the ID registry before initiating payments.
3.  **Network Awareness**: Always check if the user is on the correct network (Mainnet vs Testnet) before triggering a real-world payment.
