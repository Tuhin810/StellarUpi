# 🏁 Quick Start

Get up and running with StellarUpi in less than 2 minutes.

## 1. Connect a Wallet
Launch the app and click **"Connect Wallet"**. StellarUpi supports:
*   **MetaMask / Rabby** (via Web3Modal)
*   **Freighter Wallet** (Native Stellar support)
*   **WalletConnect** (Mobile wallets)

> 📘 **Note:** Even though we use an Ethereum-style wallet for login, your funds will be stored and moved on the **Stellar Network**.

## 2. Set Up Your Vault
On your first login, the app will ask you to sign a message. 
1.  **Sign the Request**: This signature is used locally to derive an encryption key.
2.  **Generate Stellar Account**: The app will automatically generate a new Stellar public/private keypair.
3.  **Encrypted Storage**: Your Stellar private key is encrypted with your signature and stored in our database. **We never see your plaintext key.**

## 3. Claim Your @stellar ID
Once logged in, go to your **Profile** to see your auto-generated ID (e.g., `0x123...abc@stellar`). You can share this ID with others to receive payments instantly.

## 4. Fund Your Wallet
To start sending money, you need a small amount of **XLM** (Stellar Lumens) to activate your account on the network.
*   **Testnet**: We automatically fund your account with test XLM.
*   **Mainnet**: Use the **"Add Money"** feature to buy XLM via UPI using **Onramp.money**.

## 5. Your First Payment
1.  Click **"Send"** on the Dashboard.
2.  Enter a recipient's `@stellar` ID or scan their QR code.
3.  Enter the amount in **INR**.
4.  Confirm the transaction.

---

## 🚀 Next Steps
*   Learn how [Web3 Authentication](core-features/web3-auth.md) secures your funds.
*   Set up your [Gullak Savings 🐷](core-features/gullak-savings.md).
