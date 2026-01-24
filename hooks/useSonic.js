import { useState, useEffect } from 'react';

/**
 * useSonic Hook
 * Handles robust initialization of the ggwave WASM module from a local file.
 */
export const useSonic = () => {
    const [ggwave, setGgwave] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const initEngine = async () => {
            try {
                if (!window.ggwave_factory) {
                    // Wait a bit for the script to execute if it's still loading
                    let retries = 0;
                    while (!window.ggwave_factory && retries < 20) {
                        await new Promise(r => setTimeout(r, 200));
                        retries++;
                    }
                }

                if (!window.ggwave_factory) {
                    throw new Error('ggwave_factory not found. Ensure /ggwave.js is loaded.');
                }

                // Initialize ggwave instance
                const instance = await window.ggwave_factory();

                if (isMounted) {
                    setGgwave(instance);
                    setIsReady(true);
                    console.log('✅ Sonic Engine (embedded WASM) initialized');
                }
            } catch (err) {
                console.error('❌ Sonic Engine Error:', err);
                if (isMounted) {
                    setError(err.message);
                }
            }
        };

        initEngine();

        return () => {
            isMounted = false;
        };
    }, []);

    return { ggwave, isReady, error };
};
