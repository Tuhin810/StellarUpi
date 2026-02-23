# 📡 Sonic Transfer (Nearby Sync)

**Sonic Transfer** is a revolutionary "offline-first" pairing mechanism that allows two devices to exchange payment details using **sound waves**. No internet pairing, Bluetooth, or manual typing of IDs is required.

## 🚀 The Use Case
Imagine paying a street vendor in a crowded market where mobile data is spotty, or splitting a bill with a friend sitting next to you. Instead of reading out your ID or scanning a QR code (which requires good lighting), you just emit a "Sonic Pulse".

## 🛠️ How it Works

### 1. Acoustic Data Encoding (GGWave)
We use the **GGWave** protocol to encode a user's Stellar ID into a sequence of ultrasonic (or near-ultrasonic) frequencies. 
*   **Format**: The data is packed into a small, Reed-Solomon error-corrected acoustic packet.

### 2. The Pairing Flow
1.  **Sender**: Clicks "Sonic Send". Their phone starts emitting a subtle, chirping sound (the Pulse).
2.  **Receiver**: Clicks "Sonic Receive". Their phone's microphone listens for specific frequency patterns.
3.  **Sync**: Once the receiver's device decodes the packet, it instantly resolves the sender's identity and opens the payment screen.

## 🔒 Security & Privacy
*   **Encrypted Payloads**: The data transmitted via sound is only a pointer to the identity (Stellar ID). No private keys or sensitive financial data are ever broadscasted.
*   **Proximity Bound**: Sound naturally attenuates with distance. This ensures that only devices within a few meters can participate in the transfer, preventing remote eavesdropping.
*   **Noise Filtering**: Our implementation includes high-pass filters to ignore background city noise, wind, and human speech, focusing purely on the high-frequency pairing bands.

## 📱 Hardware Compatibility
Sonic Transfer works on any device with a standard speaker and microphone. 
*   **Verification**: Users can run a "Hardware Compatibility Test" inside the app to ensure their speakers support the high frequencies required for optimal performance.

---

> 📘 **Tip:** For the fastest sync, hold the devices within 2 feet of each other and avoid covering the microphone or speaker.
