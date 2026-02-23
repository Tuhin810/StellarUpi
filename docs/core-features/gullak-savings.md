# 🐷 Gullak (Savings Vault)

**Gullak** is an automated savings and micro-investment feature inspired by the traditional Indian piggy bank. It helps users save "Chillar" (loose change) from every transaction they make.

## ✨ How it Works

### 1. Auto Round-ups
Every payment you make via StellarUpi is rounded up to the nearest **₹10**. 
*   **Example**: You pay ₹142 for coffee. 
*   **Transaction**: StellarUpi sends ₹142 to the merchant and **₹8** to your Gullak vault.
*   **Total Cost**: ₹150.

### 2. Dedicated Vault Activation
To ensure the security and separation of savings, every user has a dedicated **Gullak Stellar Account**.
*   **Activation**: To start saving, you must activate the vault with a one-time transfer of **1.5 XLM**.
*   **Why?**: This covers the Stellar network's base reserve (1 XLM) and leaves a pool for transaction fees and sub-entries.

### 3. Yield-Bearing Streaks
Saving is gamified via **Streaks**. The longer you maintain your daily savings habit, the higher the APY (Annual Percentage Yield) you earn on your Gullak balance.

| Tier | Streak | Base Yield (APR) | Benefit |
| :--- | :--- | :--- | :--- |
| **Starter** | 1-5 Days | 3.6% | Basic Savings |
| **Saver** | 6-14 Days | 11.0% | Enhanced Yield |
| **Pro Saver** | 15+ Days | 18.0% | Maximum Wealth Creation |

## 🔓 Withdrawals
You can withdraw your savings back to your main wallet at any time.
*   **Verification**: All withdrawals require biometric auth or your Transaction PIN.
*   **Merge Logic**: When you withdraw, we use the Stellar `mergeAccount` operation to sweep all funds, including the base reserve, back to your main wallet.

## 🛠️ Technical Implementation
*   **Atomic Transactions**: The round-up is bundled with the main payment in a single Stellar transaction envelope. If the payment fails, the saving is also rolled back.
*   **Firestore Sync**: We track streaks and legacy INR values in Firestore for real-time dashboard updates, while the actual capital stays on-chain in the Gullak vault.

---

> 💡 **Tip:** Keep your streak alive to move from the Orange tier to the Purple (Pro) tier for 5x more daily yield!
