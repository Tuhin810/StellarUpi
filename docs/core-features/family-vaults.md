# 👨‍👩‍👧‍👦 Family Spend Limits

**Family Vaults** allow parents to share their wealth with dependents (children, elders) while maintaining absolute control and safety.

## 🛠️ The Architecture
We use a **Parent-Child Wallet** model:
1.  **Parent (Master)**: The primary funded wallet.
2.  **Child (Sub-account)**: A restricted Stellar account managed by the parent.

## ✨ Key Features

### 1. Spending Limits
Parents can set **Daily** or **Weekly** spending caps.
*   *Example*: A child is allowed to spend only ₹200/day for school lunches.
*   **Enforcement**: Transactions that exceed the limit are automatically rejected by the StellarUpi middleware before they hit the network.

### 2. Real-Time Tracking
Every transaction made by a family member is piped to the parent's dashboard in real-time via Firebase notifications.

### 3. Remote Authorization
For high-value purchases, a child can "Request Approval". The parent receives a notification and can authorize the payment from their own phone.

---

## 🔒 Security
The parent holds the "Master Key" to all family sub-accounts. If a child's phone is lost, the parent can instantly freeze the sub-account and move the remaining funds back to the master vault.
