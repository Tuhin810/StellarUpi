# 📅 Scheduled & AutoPay

Never miss a bill payment again. **AutoPay** allows you to schedule recurring transfers for rent, subscriptions, or family allowances, directly from your Stellar wallet.

## ✨ Features

### 1. Multi-Frequency
Schedule payments on a **Weekly**, **Monthly**, or **Yearly** basis. For testing, we also support a "Minutely" frequency.

### 2. Automatic Conversion
Set your budget in **INR**. Our background worker automatically converts the value to the equivalent **XLM** or **USDC** at the time of execution, ensuring the recipient always gets the exact fiat value expected.

### 3. Subscription Management
View all your active AutoPay plans in one place. You can pause, resume, or cancel any recurring payment with a single click.

## 🛠️ How it Works

### The Worker Pattern
StellarUpi uses a Client-Side Worker (or Cloud Function in Production) to monitor due dates.

1.  **Registry**: When you set up AutoPay, the details (amount, recipient, frequency) are stored in Firestore.
2.  **Triggers**: The app checks for "Due" payments.
3.  **Liquidity Guard**: Before executing, the app checks if your wallet balance is above the **Liquidity Threshold** to ensure a recurring payment doesn't leave you unable to pay network fees.
4.  **Execution**: The payment is signed automatically using your encrypted vault secret and submitted to the Stellar network.

## 🛡️ Security & Consent
*   **Encrypted Authorization**: AutoPay uses the same signature-based vault. You grant permission once, and the app uses a restricted derivation of your secret to execute pre-authorized payments.
*   **Notifications**: You receive an in-app notification every time an AutoPay transaction successfully completes or fails due to low funds.

---

| Term | Description |
| :--- | :--- |
| **Due Date** | The next scheduled timestamp for payment execution. |
| **Merchant ID** | The @stellar ID of the entity receiving the funds. |
| **Liquidity Buffer** | The minimum XLM required to keep the wallet active. |

---

> 📘 **Tip:** Use AutoPay for your **Netflix** or **Spotify** subscriptions by setting the frequency to Monthly and the recipient to the service's Stellar gateway.
