import { useState, useEffect } from 'react';

/**
 * Hook for Sonic features powered by StellarPulse™
 */
export const useSonic = () => {
    const [isReady, setIsReady] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // StellarPulse is pure JS, so it's always ready once the hook is mounted
    useEffect(() => {
        setIsReady(true);
        console.log('✅ StellarPulse™ Engine (Pure JS) Ready');
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            setIsListening(true);
            return stream;
        } catch (err) {
            console.error("Microphone access denied:", err);
            throw err;
        }
    };

    const stopRecording = (stream) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setIsListening(false);
    };

    return {
        isReady,
        isListening,
        startRecording,
        stopRecording
    };
};
