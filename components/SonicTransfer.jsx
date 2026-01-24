import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSonic } from '../hooks/useSonic';
import { Radio, Volume2, Mic, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const SonicTransfer = ({ payload = "alex@stellar", initialMode = 'send' }) => {
    const navigate = useNavigate();
    const { ggwave, isReady, error } = useSonic();
    const [mode, setMode] = useState(initialMode); // 'send' | 'receive'
    const [isListening, setIsListening] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'error'
    const [message, setMessage] = useState('');

    const audioContextRef = useRef(null);
    const scriptProcessorRef = useRef(null);
    const streamRef = useRef(null);

    /**
     * CRITICAL iOS FIX: Initialize/Resume AudioContext inside user gesture.
     * Browsers (especially Safari) block audio until a user interaction occurs.
     */
    const initAudioContext = () => {
        try {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            return audioContextRef.current;
        } catch (err) {
            console.error("AudioContext initialization failed:", err);
            return null;
        }
    };

    /**
     * Send Mode Logic:
     * Encodes the payload string into an audio waveform and plays it via Web Audio API.
     */
    const handleSend = async () => {
        if (!isReady || !ggwave) return;

        try {
            const context = initAudioContext();
            if (!context) throw new Error("AudioContext not available");

            setIsSending(true);
            setStatus('idle');

            console.log("Encoding payload:", payload);
            console.log("GGWave properties:", Object.keys(ggwave));

            // Try to find protocol ID from the object if possible
            const protocols = ggwave.ProtocolId || {};
            console.log("Available Protocols:", protocols);
            const protocolId = protocols.GGWAVE_PROTOCOL_AUDIBLE_NORMAL || 1;

            let waveform;
            try {
                if (ggwave.GGWave) {
                    console.log("Found GGWave class, instantiating...");
                    const ggInstance = new ggwave.GGWave();
                    waveform = ggInstance.encode(payload, protocolId, 10);
                } else {
                    console.log("Trying direct encode call...");
                    waveform = ggwave.encode(payload, protocolId, 10);
                }
            } catch (e1) {
                console.warn("Standard encode failed, trying bytes-array...", e1);
                try {
                    const encodedPayload = new TextEncoder().encode(payload);
                    if (ggwave.GGWave) {
                        const ggInstance = new ggwave.GGWave();
                        waveform = ggInstance.encode(encodedPayload, protocolId, 10);
                    } else {
                        waveform = ggwave.encode(encodedPayload, protocolId, 10);
                    }
                } catch (e2) {
                    console.error("All encode attempts failed.", e2);
                    throw e2;
                }
            }

            // Generate audio buffer
            const buffer = context.createBuffer(1, waveform.length, context.sampleRate);
            buffer.getChannelData(0).set(waveform);

            const source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);

            source.onended = () => {
                setIsSending(false);
                setStatus('success');
                setMessage('UPI ID broadcasted via sound!');
            };

            source.start();
        } catch (err) {
            console.error("Transmission failed:", err);
            if (err.name === 'BindingError') {
                console.error("Binding Error details. Payload:", payload, "GGWave Object:", ggwave);
            }
            setStatus('error');
            setMessage(`Failed to send sound: ${err.message || 'Binding Error'}`);
            setIsSending(false);
        }
    };

    /**
     * Receive Mode Logic:
     * Listens to microphone, processes audio via ScriptProcessorNode, and decodes with ggwave.
     */
    const handleReceive = async () => {
        if (!isReady || !ggwave) return;

        try {
            const context = initAudioContext();
            if (!context) throw new Error("AudioContext not available");

            if (isListening) {
                stopListening();
                return;
            }

            setStatus('idle');
            setMessage('');

            // Request microphone with try/catch to handle denials gracefully
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                }
            });

            streamRef.current = stream;
            setIsListening(true);

            const source = context.createMediaStreamSource(stream);

            // ScriptProcessorNode for real-time decoding
            // 4096 is a safe buffer size for most devices
            const processor = context.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const result = ggwave.decode(inputData);

                if (result) {
                    console.log("Handshake Decoded:", result);

                    // Stop listening immediately on success
                    stopListening();

                    // Vibrate the phone (Native feel for PWA)
                    if ('vibrate' in navigator) {
                        navigator.vibrate(200);
                    }

                    setStatus('success');
                    setMessage(`Received: ${result}`);

                    // Alert as requested
                    setTimeout(() => {
                        if (window.confirm(`Sonic Handshake Success!\nReceived ID: ${result}\n\nDo you want to pay this user?`)) {
                            navigate(`/send?to=${result}`);
                        }
                    }, 100);
                }
            };

            source.connect(processor);
            processor.connect(context.destination);

        } catch (err) {
            console.error("Microphone access failed:", err);
            setStatus('error');
            setMessage('Microphone access denied or failed.');
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsListening(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopListening();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 rounded-3xl border border-red-500/20 backdrop-blur-sm">
                <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
                <p className="text-red-500 text-sm font-bold">Sonic Engine Failed</p>
                <p className="text-zinc-500 text-[10px] mt-2 text-center">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-zinc-800 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                    Retry Load
                </button>
            </div>
        );
    }

    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-3xl border border-zinc-800 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
                <p className="text-zinc-400 text-sm italic">Initializing Sonic Engine...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-zinc-900/90 rounded-[2.5rem] border border-zinc-800 shadow-2xl backdrop-blur-xl transition-all duration-500">
            {/* Tab Switcher */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-zinc-800/50">
                <button
                    onClick={() => { setMode('send'); stopListening(); setStatus('idle'); }}
                    className={`flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'send' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Send ID
                </button>
                <button
                    onClick={() => { setMode('receive'); setStatus('idle'); }}
                    className={`flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'receive' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Mic className="w-4 h-4 mr-2" />
                    Receive
                </button>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[240px]">
                {mode === 'send' ? (
                    <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-700 ${isSending ? 'bg-green-500/20 animate-pulse scale-110' : 'bg-zinc-800'}`}>
                            <Radio className={`w-10 h-10 ${isSending ? 'text-green-500' : 'text-zinc-400'}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Sonic Handshake</h3>
                        <p className="text-zinc-400 text-sm mb-6 px-4">Tap to broadcast your UPI ID to nearby devices using sound waves.</p>

                        <div className="px-5 py-4 bg-black/40 rounded-2xl border border-zinc-800 mb-8 group overflow-hidden">
                            <span className="text-green-400 font-mono text-lg tracking-wider block truncate">{payload}</span>
                        </div>

                        <button
                            disabled={isSending}
                            onClick={handleSend}
                            className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center ${isSending ? 'bg-zinc-800 text-zinc-500 translate-y-1' : 'bg-white text-black hover:bg-zinc-200'}`}
                        >
                            {isSending ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Volume2 className="w-6 h-6 mr-2" />}
                            {isSending ? 'BROADCASTING...' : 'SEND VIA SOUND'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-700 ${isListening ? 'bg-blue-500/20 animate-pulse scale-110' : 'bg-zinc-800'}`}>
                            <Mic className={`w-10 h-10 ${isListening ? 'text-blue-500' : 'text-zinc-400'}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Ready to Receive</h3>
                        <p className="text-zinc-400 text-sm mb-8 px-4">Stay close to the sender. We'll decode the sound waves automatically.</p>

                        <button
                            onClick={handleReceive}
                            className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center shadow-xl ${isListening ? 'bg-red-500/10 text-red-500 border border-red-500/40' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'}`}
                        >
                            {isListening ? 'STOP LISTENING' : 'START LISTENING'}
                        </button>
                    </div>
                )}
            </div>

            {/* Status Indicators */}
            {status !== 'idle' && (
                <div className={`mt-8 p-4 rounded-2xl flex items-center animate-in slide-in-from-top-4 transition-all ${status === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {status === 'success' ? <CheckCircle className="w-5 h-5 mr-3 shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 shrink-0" />}
                    <span className="text-sm font-bold tracking-tight">{message}</span>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-zinc-800/50 flex items-center justify-between opacity-40">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Secure Transfer</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-zinc-600" />)}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Sonic Protocol 1.0</span>
            </div>
        </div>
    );
};

export default SonicTransfer;
