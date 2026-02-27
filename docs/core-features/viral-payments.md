# 🔗 Viral Payments (Claimable)

How do you send money to someone who doesn't have a crypto wallet yet? **Viral Payments** (powered by Stellar Claimable Balances) allow you to send funds via a simple link (WhatsApp/DM).

## 💡 The Problem
In traditional crypto, the recipient *must* have a wallet before you can send them money. This is a massive friction point for onboarding new users.

## 🛠️ The Solution: Claimable Balances
StellarUpi leverages the native **Claimable Balance** feature of the Stellar network to "park" funds in an escrow-like state until the recipient claims them.

### The Flow:
1.  **Creation**: You enter an amount and click "Send via Link". 
2.  **Escrow**: StellarUpi creates a temporary, random Stellar account and moves your funds there with a condition: *"Only this specific temporary key can claim these funds."*
3.  **Viral Link**: The app generates a link containing the temporary secret key (e.g., `stellarupi.app/claim?id=CB_123&key=S...`).
4.  **Claiming**: When the recipient clicks the link, they are prompted to create a StellarUpi account. Once logged in, the app uses the secret in the link to "sweep" the funds into their new wallet.

## 🛡️ Trust & Security
*   **Sender Reclaim**: If the recipient never clicks the link, the sender can set a "Reclaim" condition to pull the funds back after a certain period (e.g., 7 days).
*   **One-Time Use**: Once claimed, the specific balance ID is marked as spent on the blockchain.
*   **End-to-End Encryption**: The secret key transmitted in the link is only accessible to the person with the link. StellarUpi's servers never see this temporary key.

## 🚀 Viral Growth
This feature acts as a powerful onboarding tool. Every payment becomes an invitation to join the StellarUpi ecosystem, making crypto as shareable as a viral video.

---

> 🚧 **Warning:** Anyone with the Viral Link can claim the funds. Only share the link with the intended recipient via secure messaging channels.
