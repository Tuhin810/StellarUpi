# 💰 Technical Guide: Payments & Assets

StellarUpi leverages the Stellar network's unique features to provide a UPI-like experience. This page explains how we handle transactions, path-finding, and QR codes.

---

## 🔗 Human-Readable IDs (UPI Mapping)

Traditional Stellar addresses are 56 characters long (e.g., `GA2C...`). StellarUpi maps these to human-readable strings.

### Resolution Logic
When a user types `alex@stellar`, the app performs these steps:
1.  **Search**: Queries the `stellar_ids` collection in Firestore.
2.  **Resolution**: Retrieves the mapping: `alex@stellar` -> `GA2CX...`.
3.  **Validation**: Checks if the Stellar account is funded and active.

---

## 🛤️ Path Payments (The Magic of Stellar)

One of the most powerful features of Stellar Pay is the ability to send one asset and have the recipient receive another.

### How it Works
1.  **Detection**: The app identifies the sender's assets (e.g., USDC) and the recipient's requirement (e.g., XLM).
2.  **Pathfinding**: Calls the `/paths` endpoint on Horizon to find the most efficient trade path using the Stellar Decentralized Exchange (DEX).
3.  **Atomic Transaction**: The swap and the payment happen in a single, atomic ledger entry.

```typescript
// Pseudocode for Path Payment
const pathResult = await server.strictReceivePayments({
    sourceAccount: senderPubKey,
    destinationAsset: Assets.XLM,
    destinationAmount: "100",
    sourceAssets: [Assets.USDC]
}).call();
```

---

## 📱 QR Code Ecosystem

We follow a standardized format for QR codes to ensure interoperability with other wallets like Freighter.

### QR Data Structure
```json
{
  "type": "stellar_pay",
  "recipient": "GA2C...",
  "stellarId": "alex@stellar",
  "memo": "Dinner Split",
  "asset": "XLM"
}
```

- **SEP-7 Support**: We are implementing SEP-7 (Stellar Ecosystem Proposal 7) compatibility, allowing users to scan our QR codes with any Stellar-compliant wallet.

---

## 👨‍👩‍👧‍👦 Family Spend Control Logic

Family wallets are implemented using a **Delegation & Limit** pattern.

1.  **Owner**: Holds the master secret.
2.  **Member**: Holds a restricted "child" secret or is authorized via the Owner's key.
3.  **Limit Check**: Before every transaction, the app queries `spent_today` for that member.
4.  **Enforcement**: If `amount + spent_today > daily_limit`, the app blocks the transaction *before* it hits the blockchain.

> 📘 **Note:** In future versions (Phase 3), this logic will be moved to **Soroban Smart Contracts** for decentralized enforcement that cannot be bypassed even by modifying the client.
