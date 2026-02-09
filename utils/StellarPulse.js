/**
 * StellarPulse™ Protocol v1.0
 * A robust, library-free acoustic data transfer engine for Ching Pay.
 * Uses Frequency Shift Keying (FSK) over Web Audio API.
 */

const CONFIG = {
    START_FREQ: 16000,  // Lowered for better distance travel
    FREQ_BASE: 10000,   // Lowered base to 10kHz (audible but extremely robust)
    FREQ_STEP: 150,     // Wider gap for clearer detection from afar
    BIT_DURATION: 0.35, // 350ms - The "Sweet Spot" for range vs speed
    MARGIN: 70          // Higher tolerance for noisy environments
};

// Binary mapping for characters (simplified for UPI IDs)
const CHAR_MAP = "0123456789abcdefghijklmnopqrstuvwxyz@._";

export const StellarPulse = {
    /**
     * Encodes a string into a sequence of frequencies
     */
    encode: (payload) => {
        const sequence = [CONFIG.START_FREQ, CONFIG.START_FREQ];
        const lowerPayload = payload.toLowerCase();

        // Only encode the unique part before @stellar
        const uniquePart = lowerPayload.split('@')[0];

        for (let char of uniquePart) {
            const index = CHAR_MAP.indexOf(char);
            if (index !== -1) {
                sequence.push(CONFIG.FREQ_BASE + (index * CONFIG.FREQ_STEP));
            }
        }

        // The '@' character is our universal terminator
        const atIndex = CHAR_MAP.indexOf('@');
        sequence.push(CONFIG.FREQ_BASE + (atIndex * CONFIG.FREQ_STEP));
        sequence.push(CONFIG.FREQ_BASE + (atIndex * CONFIG.FREQ_STEP)); // Double terminator for safety

        return sequence;
    },

    /**
     * Plays the encoded sequence using Web Audio API
     */
    transmit: async (audioContext, payload) => {
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const nyquist = audioContext.sampleRate / 2;
        console.log(`StellarPulse: Starting transmission... SampleRate: ${audioContext.sampleRate}, Nyquist: ${nyquist}`);

        const sequence = StellarPulse.encode(payload);
        const startTime = audioContext.currentTime + 0.1; // Small buffer

        // Create a master gain for the whole sequence
        const masterGain = audioContext.createGain();
        masterGain.gain.setValueAtTime(1.0, startTime); // MAX VOLUME
        masterGain.connect(audioContext.destination);

        sequence.forEach((freq, i) => {
            if (freq >= nyquist) return; // Hardware safety

            const osc = audioContext.createOscillator();
            const bitGain = audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime + (i * CONFIG.BIT_DURATION));

            // Envelope for each bit to prevent pops
            bitGain.gain.setValueAtTime(0, startTime + (i * CONFIG.BIT_DURATION));
            bitGain.gain.linearRampToValueAtTime(1, startTime + (i * CONFIG.BIT_DURATION) + 0.015);
            bitGain.gain.setValueAtTime(1, startTime + (i + 1) * CONFIG.BIT_DURATION - 0.015);
            bitGain.gain.linearRampToValueAtTime(0, startTime + (i + 1) * CONFIG.BIT_DURATION);

            osc.connect(bitGain);
            bitGain.connect(masterGain);

            osc.start(startTime + (i * CONFIG.BIT_DURATION));
            osc.stop(startTime + (i + 1) * CONFIG.BIT_DURATION);
        });

        return (sequence.length * CONFIG.BIT_DURATION + 0.2) * 1000;
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
