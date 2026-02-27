# 🛠️ API Reference

StellarUpi exposes a set of localized service modules that developers can use to build on top of the ecosystem.

## 🌟 Stellar Service (`services/stellar.ts`)

### `sendPayment(secret, destination, amount, memo)`
Sends a native XLM payment.
*   **secret**: The decrypted S-key.
*   **destination**: Recipient's public key.
*   **amount**: Amount in XLM string.
*   **memo**: (Optional) Text memo.

### `sendChillarPayment(...)`
Atomic transaction that handles both the main payment and the Gullak round-up.

## 🐷 Gullak Service (`services/db.ts`)

### `applyGullakYield(uid)`
Calculates and applies the daily yield bonus based on the user's current streak level.

### `recordGullakWithdrawal(uid, amount)`
Processes a withdrawal and resets the on-chain/off-chain counters.

## 🤖 AI Service (`services/aiService.ts`)

### `processCommand(prompt, context)`
The main entry point for the Raze AI engine. Uses Gemini 1.5 Flash to parse and execute user intents.

## 🔐 Encryption Service (`services/encryption.ts`)

### `encryptSecret(plaintext, key)` / `decryptSecret(ciphertext, key)`
Core AES-256-GCM logic for vault management.

---

## 📂 Data Models

### User Profile
```typescript
interface UserProfile {
    uid: string;
    stellarId: string; // e.g. user@stellar
    publicKey: string;
    encryptedSecret: string;
    gullakPublicKey?: string;
    currentStreak: number;
    totalSavingsINR: number;
}
```

### Transaction Record
```typescript
interface TransactionRecord {
    fromId: string;
    toId: string;
    amount: number;
    currency: 'INR' | 'XLM' | 'USDC';
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    txHash: string;
    chillarAmount?: number;
}
```
