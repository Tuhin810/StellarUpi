# ⚖️ India Regulations & PMLA

StellarUpi is designed with a "Compliance First" approach, specifically tailored for the Indian regulatory landscape of 2026.

## 🏛️ Regulatory Context
In India, the **Virtual Digital Asset (VDA)** framework and the **Prevention of Money Laundering Act (PMLA)** require strict monitoring of crypto transactions. StellarUpi is architected to operate as a **VDASP** (Virtual Digital Asset Service Provider).

## 🛡️ Key Compliance Pillars

### 1. FIU-IND Integration Readiness
Our architecture supports the reporting standards required by the **Financial Intelligence Unit - India**.
*   **STR (Suspicious Transaction Reporting)**: AI-driven triggers identify and flag unusual transaction volumes or rapid-fire P2P movements.
*   **CTR (Cash Transaction Reporting)**: While we don't handle cash, our Fiat Gateway (Onramp.money) maintains logs for cumulative INR movements above ₹10 Lakhs.

### 2. Identity Verification (KYC)
We implement a multi-layer KYC process:
*   **Level 1 (Basic)**: PIN and Email verification.
*   **Level 2 (Active)**: Government ID verification.
*   **Privacy-Preserving OCR**: We use **Tesseract.js** to process PAN and Aadhaar cards *locally* on the user's device. The raw image is never uploaded; only the extracted, verified data is sent to our compliance vault.

### 3. Anti-Money Laundering (AML)
*   **Address Screening**: We screen recipient addresses against known global sanction lists (OFAC, etc.) before allowing a transaction to be signed.
*   **Proof of Funds**: For high-value transactions, the app prompts users to provide simple declarations of source of wealth.

## 💼 The VDASP Framework
*   **Reporting Entity**: StellarUpi operates with a registered FIU-IND entity ID.
*   **Nodal Officers**: Dedicated compliance officers oversee the automated fraud detection engines.
*   **Data Retention**: In accordance with the IT Act, we maintain encrypted transaction logs for 5 years to assist in law enforcement inquiries.

---

> 📘 **Note:** Compliance doesn't mean a lack of privacy. We use industry-standard encryption to ensure that only authorized regulatory bodies (with a valid warrant) or the user themselves can access detailed PII (Personally Identifiable Information).
