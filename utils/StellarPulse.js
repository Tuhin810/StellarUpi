/**
 * StellarPulse™ Protocol v1.0
 * A robust, library-free acoustic data transfer engine for StellarPay.
 * Uses Frequency Shift Keying (FSK) over Web Audio API.
 */

const CONFIG = {
    START_FREQ: 18500, // Start of frame signal
    FREQ_BASE: 17000,  // Base frequency for data
    FREQ_STEP: 100,    // Space between bits (1bit = 100Hz)
    BIT_DURATION: 0.1, // Duration of each bit in seconds
    MARGIN: 50         // Tolerance margin for decoding
};

// Binary mapping for characters (simplified for UPI IDs)
const CHAR_MAP = "0123456789abcdefghijklmnopqrstuvwxyz@._";

export const StellarPulse = {
    /**
     * Encodes a string into a sequence of frequencies
     */
    encode: (payload) => {
        const sequence = [CONFIG.START_FREQ];
        const lowerPayload = payload.toLowerCase();

        for (let char of lowerPayload) {
            const index = CHAR_MAP.indexOf(char);
            if (index !== -1) {
                sequence.push(CONFIG.FREQ_BASE + (index * CONFIG.FREQ_STEP));
            }
        }

        sequence.push(CONFIG.START_FREQ); // Tail signal
        return sequence;
    },

    /**
     * Plays the encoded sequence using Web Audio API
     */
    transmit: async (audioContext, payload) => {
        const sequence = StellarPulse.encode(payload);
        const startTime = audioContext.currentTime;

        sequence.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime + (i * CONFIG.BIT_DURATION));

            // Smoother volume transitions to avoid clicking
            gain.gain.setValueAtTime(0, startTime + (i * CONFIG.BIT_DURATION));
            gain.gain.linearRampToValueAtTime(0.5, startTime + (i * CONFIG.BIT_DURATION) + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + (i + 1) * CONFIG.BIT_DURATION);

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.start(startTime + (i * CONFIG.BIT_DURATION));
            osc.stop(startTime + (i + 1) * CONFIG.BIT_DURATION);
        });

        return (sequence.length * CONFIG.BIT_DURATION) * 1000; // Return total duration in ms
    },

    /**
     * Detects the dominant frequency in a buffer
     */
    getDominantFrequency: (dataArray, sampleRate, fftSize) => {
        let maxVal = -Infinity;
        let maxIndex = -1;

        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > maxVal) {
                maxVal = dataArray[i];
                maxIndex = i;
            }
        }

        return maxIndex * sampleRate / fftSize;
    },

    /**
     * Maps a frequency back to its character
     */
    decodeFrequency: (freq) => {
        if (Math.abs(freq - CONFIG.START_FREQ) < CONFIG.MARGIN) return 'START_END';

        const index = Math.round((freq - CONFIG.FREQ_BASE) / CONFIG.FREQ_STEP);
        if (index >= 0 && index < CHAR_MAP.length) {
            // Verify if the actual frequency is close to the expected step
            const expectedFreq = CONFIG.FREQ_BASE + (index * CONFIG.FREQ_STEP);
            if (Math.abs(freq - expectedFreq) < CONFIG.MARGIN) {
                return CHAR_MAP[index];
            }
        }
        return null;
    }
};
