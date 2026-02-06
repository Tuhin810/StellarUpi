# Sonic Pulse Technology - StellarPay UPI

## 1. Introduction
**Sonic Pulse™** is StellarPay’s proprietary near-field communication (NFC) alternative that uses ultra-high frequency acoustic waves to transfer payment identities between devices. It eliminates the need for scanning QR codes or physical NFC chips, allowing users to "send" their identity through the air via sound.

## 2. The StellarPulse™ Protocol
The core logic resides in a custom implementation of **Frequency Shift Keying (FSK)** designed specifically for mobile device speakers and microphones.

### 2.1 Technical Specifications
- **Frequency Range**: 10kHz to 16kHz (Near-ultrasonic).
    - Base Frequency: 10,000 Hz.
    - Start Pulsation: 16,000 Hz.
- **Data Encoding**: 
    - Maps 40 characters (`0-9`, `a-z`, `@`, `.`, `_`) to specific frequency bins.
    - Uses a 150Hz frequency step between characters to minimize interference.
- **Transmission Speed**: 350ms per character (Bit Duration), optimized for range and environmental noise tolerance.
- **Hardware Requirement**: Standard mobile speaker and microphone with 44.1kHz or higher sample rate.

## 3. How It Works

### 3.1 Transmission (Sonic Send)
1. **Payload Extraction**: The app extracts the unique part of the user's UPI handle (e.g., `alex` from `alex@stellar`).
2. **Frequency Mapping**: The `StellarPulse.encode()` function converts the string into a sequence of frequencies.
3. **Sound Generation**: Using the **Web Audio API**, the app creates a series of Sine Wave oscillators.
4. **Acousitc Envelope**: To prevent "clicks" or "pops" that would confuse the receiver, each bit is wrapped in a linear gain envelope (fade-in/fade-out).
5. **Acoustic Broadcast**: The sequence is played at high volume through the device speaker.

### 3.2 Reception (Sonic Receive)
1. **High-Pass Filtering**: The receiving device applies a **BiquadFilter** to filter out all noise below 8kHz (human speech, traffic, wind).
2. **FFT Analysis**: A 4096-bin Fast Fourier Transform (FFT) analyzer continuously monitors the microphone input.
3. **Peak Detection**: The `getDominantFrequency()` algorithm identifies the strongest frequency spike in the near-ultrasonic range.
4. **Handshake Logic**: 
    - The receiver waits for the "Start Pulse" (16kHz).
    - It captures incoming frequencies and maps them back to characters using the `CHAR_MAP`.
    - It uses a "Hit Counter" (Majority Voting) requiring multiple consistent detections per bit to ensure accuracy.
5. **Auto-Termination**: The `@` character acts as a universal terminator, signaling the end of the transfer.

## 4. Key Advantages
- **No Line-of-Sight Required**: Unlike QR codes, Sonic Pulse works even if the phone is in a pocket or the screen is dirty.
- **Universal Compatibility**: Works on any device with a browser, speaker, and mic; no specialized NFC hardware required.
- **Futuristic UX**: Provides a "magical" experience of syncing devices through invisible pulses, accompanied by vibrant CSS animations and haptic feedback.

## 5. Security Measures
- **Short Range**: Naturally limited by the physics of sound; transmission typically drops off beyond 2-3 meters, preventing long-distance eavesdropping.
- **Character Filtering**: Only valid Stellar ID characters are processed; malicious strings are discarded by the protocol.
- **Confirmation Prompt**: The receiver must manually approve the detected identity before any transaction can be initiated.
