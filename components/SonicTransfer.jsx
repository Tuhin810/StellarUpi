import React, { useState, useEffect, useRef } from 'react';
import { useSonic } from '../hooks/useSonic';
import { StellarPulse } from '../utils/StellarPulse';
import { useNavigate } from 'react-router-dom';
import {
    Wifi,
    WifiOff,
    Mic,
    MicOff,
    ShieldCheck,
    Activity,
    Smartphone,
    Share2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const SonicTransfer = ({ mode = 'send', payload = '' }) => {
    const { isReady, startRecording, stopRecording } = useSonic();
    const navigate = useNavigate();

    // State management
    const [status, setStatus] = useState('idle'); // idle, sending, listening, success, error
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [decodedString, setDecodedString] = useState('');

    // Refs for audio processing
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastDetectedChars = useRef([]); // For debouncing/majority vote

    useEffect(() => {
        return () => {
            handleStop();
        };
    }, []);

    const initAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    };

    const handleSend = async () => {
        if (!payload) return;

        try {
            const context = initAudio();
            setIsSending(true);
            setStatus('sending');
            setMessage('Transmitting identity pulse...');

            const duration = await StellarPulse.transmit(context, payload);

            setTimeout(() => {
                setIsSending(false);
                setStatus('success');
                setMessage('Broadcast complete!');

                // Reset state after a delay
                setTimeout(() => {
                    setStatus('idle');
                    setMessage('');
                }, 3000);
            }, duration);

        } catch (err) {
            console.error("Pulse transmission failed:", err);
            setStatus('error');
            setMessage('Acoustic interference. Try again.');
            setIsSending(false);
        }
    };

    const handleListen = async () => {
        try {
            const context = initAudio();
            const stream = await startRecording();
            streamRef.current = stream;

            const source = context.createMediaStreamSource(stream);
            const analyser = context.createAnalyser();
            analyser.fftSize = 2048; // Higher resolution for frequency detection
            source.connect(analyser);
            analyserRef.current = analyser;

            setStatus('listening');
            setMessage('Scanning frequencies...');
            setDecodedString('');
            lastDetectedChars.current = [];

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);

            let lastChar = null;
            let charSequence = "";
            let startDetected = false;

            const detect = () => {
                analyser.getFloatFrequencyData(dataArray);
                const freq = StellarPulse.getDominantFrequency(dataArray, context.sampleRate, analyser.fftSize);
                const char = StellarPulse.decodeFrequency(freq);

                if (char === 'START_END') {
                    if (!startDetected) {
                        startDetected = true;
                        charSequence = "";
                        console.log("StellarPulse: Frame Start Detected");
                    } else if (charSequence.length > 3) {
                        // End of frame
                        handleSuccess(charSequence);
                        return;
                    }
                } else if (startDetected && char && char !== lastChar) {
                    charSequence += char;
                    lastChar = char;
                    setDecodedString(charSequence);
                }

                animationFrameRef.current = requestAnimationFrame(detect);
            };

            detect();

        } catch (err) {
            console.error("Listening failed:", err);
            setStatus('error');
            setMessage('Microphone access required.');
        }
    };

    const handleSuccess = (result) => {
        handleStop();
        setStatus('success');
        setMessage(`Identity found: ${result}`);

        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }

        setTimeout(() => {
            if (window.confirm(`StellarPulse™ Link Detected!\nUser: ${result}\n\nProceed to payment?`)) {
                navigate(`/send?to=${result}`);
            } else {
                setStatus('idle');
                setMessage('');
            }
        }, 500);
    };

    const handleStop = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
            stopRecording(streamRef.current);
            streamRef.current = null;
        }
        setStatus('idle');
        setMessage('');
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-md mx-auto p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
            {/* Visual Header */}
            <div className="relative group">
                <div className={`absolute -inset-4 rounded-full blur-3xl transition-all duration-700 opacity-20 ${status === 'sending' ? 'bg-cyan-500 animate-pulse' :
                        status === 'listening' ? 'bg-purple-500 animate-pulse' :
                            status === 'success' ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}></div>
                <div className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${status === 'sending' ? 'border-cyan-500 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.5)]' :
                        status === 'listening' ? 'border-purple-500 scale-110 shadow-[0_0_20px_rgba(168,85,247,0.5)]' :
                            status === 'success' ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-zinc-700'
                    }`}>
                    {status === 'sending' ? (
                        <Wifi className="w-10 h-10 text-cyan-400 animate-bounce" />
                    ) : status === 'listening' ? (
                        <Activity className="w-10 h-10 text-purple-400 animate-pulse" />
                    ) : status === 'success' ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    ) : (
                        <ShieldCheck className="w-10 h-10 text-zinc-500" />
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-zinc-100">
                    {mode === 'send' ? 'Pulse Identity' : 'Listen for Pulse'}
                </h3>
                <p className="text-zinc-400 text-sm max-w-[250px] mx-auto leading-relaxed">
                    {mode === 'send'
                        ? 'Broadcasting your identity via encrypted acoustic waves.'
                        : 'Hold near another device to detect their identity pulse.'}
                </p>
            </div>

            {/* Status Feedback */}
            {message && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-zinc-800 text-zinc-300'
                    }`}>
                    {status === 'error' ? <AlertCircle className="w-4 h-4" /> :
                        status === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                            <Activity className="w-4 h-4 animate-spin" />}
                    {message}
                </div>
            )}

            {/* Action Area */}
            <div className="w-full pt-4">
                {mode === 'send' ? (
                    <button
                        onClick={handleSend}
                        disabled={isSending || !payload}
                        className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ${isSending
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-zinc-100 text-zinc-900 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                            }`}
                    >
                        {isSending ? (
                            <>
                                <Share2 className="w-6 h-6 animate-pulse" />
                                BROADCASTING...
                            </>
                        ) : (
                            <>
                                <Smartphone className="w-6 h-6" />
                                SEND PURITY PULSE
                            </>
                        )}
                    </button>
                ) : (
                    <div className="space-y-4">
                        {decodedString && (
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
                                <span className="text-xs text-zinc-500 block mb-1">DECODING PULSE...</span>
                                <span className="text-xl font-mono text-purple-400 tracking-wider">
                                    {decodedString}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={status === 'listening' ? handleStop : handleListen}
                            className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${status === 'listening'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                                    : 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 hover:bg-purple-500 hover:shadow-purple-500/50'
                                }`}
                        >
                            {status === 'listening' ? (
                                <>
                                    <MicOff className="w-6 h-6" />
                                    STOP LISTENING
                                </>
                            ) : (
                                <>
                                    <Mic className="w-6 h-6" />
                                    ACTIVATE SONIC SCAN
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Technical Labels */}
            <div className="flex items-center gap-6 pt-2 opacity-50">
                <div className="flex items-center gap-1.5 grayscale">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 grayscale">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Stellar Pulse™ v1.0</span>
                </div>
            </div>
        </div>
    );
};

export default SonicTransfer;
