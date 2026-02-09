<p align="center">
  <img src="https://api.dicebear.com/7.x/shapes/svg?seed=Ching Pay&backgroundColor=E5D5B3&size=128" alt="Ching Pay Logo" width="100" height="100" />
</p>

<h1 align="center">Ching Pay UPI</h1>

<p align="center">
  <strong>The Next-Generation Web3 UPI Payment System</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Blockchain-7C3AED?style=for-the-badge&logo=stellar&logoColor=white" alt="Stellar Blockchain" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

## 📖 Overview

**Ching Pay UPI** is a decentralized payment application that bridges the familiar UPI experience with the power of the Stellar blockchain. It enables instant, secure, and near-zero-cost transactions using XLM (Lumens), while providing a UPI-like experience with human-readable payment addresses (e.g., `alex@stellar`).

The application supports Web3 wallet authentication, family spending controls, group expense splitting, real-time chat with payment capabilities, and seamless fiat on/off-ramp integration.

---

## ✨ Features

### 🔐 **Web3 Authentication**
- **MetaMask & WalletConnect Integration** - Connect using any Web3 wallet via the universal Web3Modal
- **Signature-Based Vault Encryption** - Stellar private keys are encrypted using your wallet's cryptographic signature
- **Auto-Generated UPI IDs** - Human-readable payment IDs derived from your Ethereum address (e.g., `0xab12cd@stellar`)
- **Session Persistence** - Secure session management with automatic wallet change detection

### 🔔 **Native Push Notifications**
- **Real-Time Payment Alerts** - Get notified instantly when you receive money, even if the app is in the foreground or background.
- **Group Split Notifications** - Stay updated when a new split expense is created in one of your groups.
- **Service Worker Integration** - Background notification handling using Firebase Cloud Messaging (FCM).
- **Foreground Alert System** - In-app notification banners for active users.
- **Custom Haptics & Branding** - Notifications include the Ching Pay logo and vibration support for a native feel.

### 💸 **Send & Receive Payments**
- **UPI-Style Transfers** - Send money using simple `name@stellar` addresses
- **QR Code Payments** - Generate and scan QR codes for instant payments
- **Deep-Link Payment URLs** - Shareable payment links with pre-filled recipient and amount
- **Transaction Categories** - Categorize payments (Shopping, Food, Travel, Bills, Entertainment, Other)
- **Transaction Memos** - Add custom notes to your payments
- **Real-Time Balance Updates** - Live XLM balance with INR conversion

### 👨‍👩‍👧‍👦 **Family Wallet System**
- **Shared Family Vault** - Parents can share wallet access with family members
- **Daily Spending Limits** - Set configurable daily spending caps for each member
- **Spend Tracking** - Monitor real-time spending against daily limits with progress bars
- **Multi-Family Support** - Members can belong to multiple family wallets
- **Seamless Authorization** - Encrypted secret sharing without exposing the master key

### 👥 **Group Expense Splitting**
- **Create Split Groups** - Form groups with multiple members for shared expenses
- **Equal Split** - Automatically divide expenses equally among selected participants
- **Custom Split Amounts** - Specify exact amounts for each participant
- **Real-Time Group Chat** - Communicate within groups with integrated messaging
- **Expense Activity Feed** - View chronological history of splits and messages
- **Settlement Tracking** - Track pending and paid amounts for each participant

### 💬 **In-App Chat & Payment Requests**
- **Peer-to-Peer Messaging** - Real-time chat with any Ching Pay user
- **Payment Request System** - Request money from contacts with one tap
- **Transaction History in Chat** - View all payments with a contact inline
- **Quick Pay from Chat** - Send payments directly from conversation threads

### 💳 **Fiat On/Off-Ramp**
- **Buy XLM with INR** - Integrated Onramp.money widget for purchasing XLM
  - Supports UPI, Credit/Debit Cards, and Bank Transfers
  - One-time KYC verification
  - Real-time exchange rate display
- **Sell XLM for INR** - Integrated Transak widget for withdrawals
  - Direct bank account transfers
  - 1-2 day settlement time
- **Live Exchange Rates** - CoinGecko API integration for real-time XLM/INR rates

### 🔄 **AutoPay & Recurring Payments**
- **Subscription Management** - Setup automated payments for bills and subscriptions
- **Frequency Options** - Daily, weekly, or monthly payment schedules
- **Next Payment Preview** - View upcoming scheduled payments

### 🛡️ **Security Features**
- **4-Digit Transaction PIN** - Optional PIN protection for all transactions
- **AES-256 Encryption** - Military-grade encryption for Stellar private keys
- **Client-Side Key Management** - Private keys never leave your device
- **Personal Spending Limits** - Set daily transaction limits for self-control
- **Account Verification Status** - Display verified account badges

### 🌐 **Network Flexibility**
- **Mainnet & Testnet Support** - Toggle between Stellar networks
- **Automatic Friendbot Funding** - Test wallet funding on Testnet
- **Network-Aware UI** - Visual indicators for current network

### 📱 **Progressive Web App (PWA)**
- **Installable Application** - Add to home screen on mobile devices
- **Offline Capabilities** - Basic functionality without network
- **Native App Feel** - Full-screen mode with custom status bar styling
- **Apple iOS Optimization** - Web app capable with black-translucent status bar

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **React 19** | UI library with concurrent features |
| **TypeScript 5.8** | Type-safe JavaScript |
| **Vite 6** | Next-generation build tool |
| **React Router 7** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Modern icon library |

### **Blockchain**
| Technology | Purpose |
|------------|---------|
| **Stellar SDK 14.x** | Stellar blockchain interaction |
| **Horizon API** | Transaction submission & queries |
| **Web3Modal** | Universal wallet connection |
| **Ethers.js 6** | Ethereum wallet integration |

### **Backend Services**
| Service | Purpose |
|---------|---------|
| **Firebase Firestore** | Real-time NoSQL database |
| **Firebase Auth** | Anonymous authentication |
| **Firebase Analytics** | Usage tracking |

### **Third-Party Integrations**
| Service | Purpose |
|---------|---------|
| **Onramp.money** | INR → XLM purchases |
| **Transak** | XLM → INR withdrawals |
| **CoinGecko API** | Real-time exchange rates |
| **DiceBear Avatars** | Dynamic avatar generation |
| **HTML5 QrCode** | QR code scanning |
| **CryptoJS** | AES encryption utilities |

---

## 🏗️ Architecture

### **Project Structure**

```
Ching Pay-upi/
├── index.html              # PWA-enabled entry point
├── index.tsx               # React app bootstrap
├── index.css               # Global styles with gold gradient
├── App.tsx                 # Root component with providers
├── types.ts                # TypeScript interfaces
├── vite.config.ts          # Vite + PWA configuration
│
├── context/
│   ├── AuthContext.tsx     # Web3 authentication state
│   └── NetworkContext.tsx  # Stellar network management
│
├── pages/
│   ├── Login.tsx           # Web3 wallet connection
│   ├── Dashboard.tsx       # Main home screen
│   ├── SendMoney.tsx       # Payment flow with family support
│   ├── ReceiveMoney.tsx    # QR code generation
│   ├── QRScanner.tsx       # Camera-based QR scanning
│   ├── Transactions.tsx    # Transaction history
│   ├── TransactionDetail.tsx # Individual transaction view
│   ├── ChatPage.tsx        # P2P messaging with payments
│   ├── GroupPage.tsx       # Group expense management
│   ├── FamilyManager.tsx   # Family wallet administration
│   ├── Profile.tsx         # User settings & security
│   ├── AddMoney.tsx        # Fiat on-ramp interface
│   ├── Withdraw.tsx        # Fiat off-ramp interface
│   ├── AutoPay.tsx         # Recurring payments
│   ├── PaymentLink.tsx     # Deep-link payment handler
│   └── SharedWallet.tsx    # Shared wallet interface
│
├── components/
│   ├── BalanceCard.tsx     # Balance display widget
│   ├── BottomNav.tsx       # Navigation bar
│   ├── ContactSelector.tsx # Contact picker
│   ├── CreateGroupModal.tsx # Group creation UI
│   ├── DashboardHeader.tsx # App header
│   ├── PeopleList.tsx      # Contacts & groups list
│   ├── ProtectedRoute.tsx  # Auth guard wrapper
│   ├── QuickActions.tsx    # Action buttons grid
│   ├── ReceiveQRModal.tsx  # QR code modal
│   ├── SideDrawer.tsx      # Navigation drawer
│   ├── SuccessScreen.tsx   # Payment success animation
│   ├── UpiDrawer.tsx       # UPI ID input drawer
│   └── Group/
│       ├── SplitExpenseDrawer.tsx  # Create split UI
│       ├── ManageMembersDrawer.tsx # Group member management
│       └── ActivityItem.tsx        # Group activity feed item
│
├── services/
│   ├── stellar.ts          # Stellar blockchain operations
│   ├── firebase.ts         # Firebase initialization
│   ├── db.ts               # Firestore data operations
│   ├── encryption.ts       # AES encryption utilities
│   ├── web3.ts             # Web3Modal configuration
│   ├── onramp.ts           # Onramp.money integration
│   └── transak.ts          # Transak integration
│
└── routes/
    └── AppRoutes.tsx       # Route definitions
```

### **Data Models**

#### UserProfile
```typescript
interface UserProfile {
  uid: string;              // Ethereum address (lowercase)
  email: string;            // Generated email identifier
  stellarId: string;        // UPI-style ID (e.g., "alex@stellar")
  publicKey: string;        // Stellar public key
  encryptedSecret: string;  // AES-encrypted Stellar secret
  isFamilyOwner: boolean;   // Can manage family members
  ownerId?: string;         // Parent account UID (if family member)
  displayName?: string;     // Custom display name
  avatarSeed?: string;      // DiceBear avatar seed
  pin?: string;             // Transaction PIN
  dailyLimit?: number;      // Personal spending limit
  spentToday?: number;      // Today's spending amount
  lastSpentDate?: string;   // Last spend date for reset
}
```

#### TransactionRecord
```typescript
interface TransactionRecord {
  id: string;
  fromId: string;           // Sender's stellarId
  toId: string;             // Recipient's stellarId
  fromName: string;         // Sender display name
  toName: string;           // Recipient display name
  amount: number;           // Amount in INR
  currency: string;         // 'INR' or 'XLM'
  timestamp: Timestamp;     // Firestore timestamp
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  memo?: string;            // Transaction note
  txHash?: string;          // Stellar transaction hash
  isFamilySpend: boolean;   // Family wallet transaction
  spenderId?: string;       // Actual spender's stellarId
  category?: 'Shopping' | 'Food' | 'Travel' | 'Bills' | 'Entertainment' | 'Other';
}
```

#### SplitGroup
```typescript
interface SplitGroup {
  id: string;
  name: string;
  members: string[];        // Array of stellarIds
  createdBy: string;        // Creator's stellarId
  avatarSeed: string;       // Group avatar seed
  timestamp: Timestamp;
}
```

#### SplitExpense
```typescript
interface SplitExpense {
  id: string;
  groupId: string;
  description: string;
  totalAmount: number;
  paidBy: string;           // Who paid initially
  splitType: 'equal' | 'percentage';
  participants: {
    stellarId: string;
    amount: number;         // Their share
    status: 'PENDING' | 'PAID';
    txHash?: string;
  }[];
  timestamp: Timestamp;
}
```

### **Authentication Flow**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Opens    │────▶│   Web3Modal      │────▶│  Sign Message   │
│   Application   │     │   Connection     │     │   (MetaMask)    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Dashboard     │◀────│   Store Address  │◀────│  Create/Load    │
│   Displayed     │     │   & Signature    │     │   Stellar Vault │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### **Payment Flow**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Select Contact │────▶│   Enter Amount   │────▶│  Select Source  │
│  or Scan QR     │     │   & Category     │     │  (Wallet/Family)│
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌──────────────────┐              ▼
                        │  PIN Validation  │◀────┬────────────────┐
                        │  (if enabled)    │     │ Confirm Payment│
                        └────────┬─────────┘     └────────────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Success Screen  │◀────│ Record to Firebase│◀────│  Stellar TX     │
│ with Animation  │     │ & Update Limits  │     │  Submission     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **npm 9+**
- **MetaMask** browser extension or mobile app
- **Modern browser** with WebCrypto API support

### Installation

```bash
# Clone the repository
git clone https://github.com/Tuhin810/StellarUpi.git
cd Ching Pay-upi

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

> **Note:** Get your WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com)

### Building for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

---

## 📚 API Reference

### Stellar Service (`services/stellar.ts`)

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `createWallet()` | - | `Promise<{publicKey, secret}>` | Creates new Stellar keypair, auto-funds on Testnet |
| `getBalance(publicKey)` | `publicKey: string` | `Promise<string>` | Returns XLM balance |
| `sendPayment(...)` | `senderSecret, recipientPublicKey, amount, memo` | `Promise<string>` | Submits payment, returns tx hash |
| `isAccountFunded(publicKey)` | `publicKey: string` | `Promise<boolean>` | Checks if account exists on network |

### Database Service (`services/db.ts`)

| Function | Description |
|----------|-------------|
| `saveUser(profile)` | Creates/updates user profile and ID mapping |
| `getProfile(uid)` | Fetches user profile by UID |
| `getProfileByStellarId(stellarId)` | Fetches profile by UPI-style ID |
| `recordTransaction(tx)` | Stores transaction record |
| `getTransactions(stellarId)` | Fetches last 20 transactions |
| `addFamilyMember(...)` | Adds member with spending limit |
| `getFamilyMembers(ownerUid)` | Lists all family members |
| `updateFamilySpend(...)` | Updates member's daily spend |
| `createGroup(groupData)` | Creates new split group |
| `getGroups(stellarId)` | Lists user's groups |
| `recordSplitExpense(expense)` | Records group expense |
| `searchUsers(searchTerm)` | Searches by stellarId, publicKey, or name |

### Encryption Service (`services/encryption.ts`)

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `encryptSecret(secret, password)` | `string, string` | `string` | AES-encrypts Stellar secret |
| `decryptSecret(encrypted, password)` | `string, string` | `string` | Decrypts Stellar secret |
| `hashPassword(password)` | `string` | `string` | SHA-256 hash |

---

## 🎨 UI/UX Features

### Design System

- **Color Palette:**
  - Primary Gold: `#E5D5B3`
  - Background: `#0a0f0a` → `#0d1210` gradient
  - Card Background: `zinc-900` with `backdrop-blur`
  - Success: `emerald-500`
  - Error: `rose-500`

- **Typography:** Inter font family (400-800 weights)

- **Animations:**
  - `animate-in` / `fade-in` / `zoom-in-95` for modals
  - `animate-spin` for loaders
  - `animate-pulse` for status indicators
  - `active:scale-[0.98]` for button feedback

### Responsive Design

- Maximum width container (`max-w-md`) for mobile-first experience
- Safe area insets for iPhone notch/Dynamic Island
- Touch-optimized button sizes (minimum 44px)
- Smooth scrolling with `-webkit-overflow-scrolling: touch`

---

## 🔒 Security Considerations

1. **Private Key Storage** - Stellar secrets are AES-256 encrypted client-side using the user's MetaMask signature as the encryption key. The plaintext secret never touches any server.

2. **Session Security** - Encryption keys are stored in `sessionStorage` and cleared on tab close. Wallet address is persisted in `localStorage` for session restoration.

3. **Transaction Authorization** - Optional 4-digit PIN adds an additional authentication layer before payments.

4. **Family Secret Sharing** - When adding family members, the owner's encrypted secret is re-encrypted using the member's UID, allowing controlled access without exposing the original key.

5. **Content Security Policy** - Strict CSP headers limit script sources and API connections.

---

## 📱 PWA Capabilities

| Feature | Support |
|---------|---------|
| Add to Home Screen | ✅ iOS, Android, Desktop |
| Standalone Display | ✅ Full-screen mode |
| Theme Color | ✅ `#0a0f0a` |
| Status Bar Style | ✅ Black Translucent (iOS) |
| Offline Basic UI | ✅ Cached assets |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Stellar Development Foundation](https://stellar.org) for the blockchain infrastructure
- [Firebase](https://firebase.google.com) for real-time database capabilities
- [WalletConnect](https://walletconnect.com) for Web3 connectivity
- [Onramp.money](https://onramp.money) & [Transak](https://transak.com) for fiat gateway services

---

<p align="center">
  <strong>Built with ❤️ for the Stellar Ecosystem</strong>
</p>

<p align="center">
  <a href="https://stellar.org">
    <img src="https://img.shields.io/badge/Powered_by-Stellar-7C3AED?style=flat-square" alt="Powered by Stellar" />
  </a>
</p>
