# 💰 Payments & QR

StellarUpi facilitates two types of payments: **Direct Transfers** and **Path Payments**.

## 1. Direct Transfers
When you send XLM to someone who also wants XLM, we use a simple payment operation.
*   **Speed**: ~3-5 seconds.
*   **Fees**: Negligible (0.00001 XLM).

## 2. Path Payments (Atomic Swaps)
This is the "Magic" of the Stellar network. You can send one asset (e.g., **USDC**) and the recipient can receive another (e.g., **XLM**) in a single atomic step.
*   **Automatic Pathfinding**: StellarUpi automatically finds the best exchange rate across the Stellar Decentralized Exchange (DEX).
*   **Multi-Asset Support**: Seamlessly move between USDC, XLM, and local anchors.

## 🤳 QR Ecosystem
We support two standards of QR codes:

### A. Universal Stellar (SEP-7)
Standard links that can be scanned by any Stellar wallet (like Freighter or Lobstr).
*   Format: `web+stellar:pay?destination=G...&amount=10`

### B. UPI-Style (StellarUpi Native)
Optimized for the Indian market, these QRs resolve human-readable IDs (`name@stellar`) and can even embed "Chillar" round-up instructions.

---

> 📘 **Tip:** You can download your personal "Payment Poster" from the **Profile** page to accept payments at your physical shop or stall.
