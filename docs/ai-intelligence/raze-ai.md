# 🤖 Raze AI Assistant

**Raze AI** is your neural financial advisor, powered by **Gemini 1.5 Flash**. It lives at the heart of StellarUpi, turning a simple wallet into a smart, conversational financial engine.

## ✨ High-Level Capabilities

### 1. Conversational Payments
Instead of navigating complex menus, you can just tell Raze what to do:
*   *"Send 100 XLM to Tuhin."*
*   *"Pay 500 rupees to my roommate for electricity."*
*   *"Split tonight's dinner bill equally among the group."*

### 2. Spending Insights
Raze analyzes your transaction history locally to provide instant feedback on your habits:
*   *"How much did I spend on food this week?"*
*   *"Why is my balance lower than usual?"*
*   *"Predict my expenses for next month."*

### 3. Voice-to-Action
On mobile, you can tap the microphone icon to execute any of the above commands using natural language.

## 🛠️ Technical Architecture

### 1. Neural Identity Resolution
Raze doesn't just look for public keys. It understands context. 
*   **Prompt**: *"Send money to John."*
*   **Resolution**: Raze queries your contact registry and group memberships to find the specific "John" you interact with most frequently.

### 2. Tool Calling (Function Calling)
We use Gemini's **Tool Calling** feature to securely connect the AI to our internal services:
1.  **Intent Discovery**: Raze identifies that the user wants to `send_payment`.
2.  **Parameter Extraction**: It extracts the `recipient`, `amount`, and `currency`.
3.  **UI Feedback**: It presents a "Transaction Preview" card to the user. **Raze never sends money without a final manual user confirmation (Click/Biometric).**

### 3. Real-Time Market Data
Raze has access to real-time price feeds via CoinGecko and Stellar Lumens price services, allowing it to perform conversions (XLM <-> INR) instantly in the chat.

## 🔒 Privacy
Your chat history is private. Raze's analysis happens within your authenticated session. We do not use your financial data to train external models; we only provide the relevant context to the Gemini model at the time of your specific query to generate a response.

---

> 📘 **Pro Tip:** Ask Raze: *"What's my Gullak streak?"* to see how close you are to the next yield tier!
