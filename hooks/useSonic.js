import { useState, useEffect } from 'react';

/**
 * useSonic Hook
 * Initializes the ggwave WASM module from the global window.ggwave_factory.
 * Provides { ggwave, isReady } to components.
 */
export const useSonic = () => {
    const [ggwave, setGgwave] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const initGgwave = async () => {
            // Check if ggwave_factory exists (provided by the CDN script in index.html)
            if (typeof window.ggwave_factory === 'function') {
                try {
                    const instance = await window.ggwave_factory();
                    if (isMounted) {
                        setGgwave(instance);
                        setIsReady(true);
                        console.log('✅ Sonic Handshake (ggwave) WASM initialized');
                    }
                } catch (error) {
                    console.error('❌ Failed to initialize ggwave WASM:', error);
                }
            } else {
                // If script hasn't loaded yet, try again in a few intervals
                let retries = 0;
                const interval = setInterval(async () => {
                    retries++;
                    if (typeof window.ggwave_factory === 'function') {
                        clearInterval(interval);
                        try {
                            const instance = await window.ggwave_factory();
                            if (isMounted) {
                                setGgwave(instance);
                                setIsReady(true);
                                console.log('✅ Sonic Handshake (ggwave) WASM initialized (delayed)');
                            }
                        } catch (error) {
                            console.error('❌ Failed to initialize ggwave WASM on retry:', error);
                        }
                    } else if (retries > 20) {
                        clearInterval(interval);
                        console.error('❌ ggwave_factory not found after 10 seconds');
                    }
                }, 500);
            }
        };

        initGgwave();

        return () => {
            isMounted = false;
        };
    }, []);

    return { ggwave, isReady };
};
