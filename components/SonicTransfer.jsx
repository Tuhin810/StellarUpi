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

const SonicTransfer = ({ initialMode = 'send', payload = '' }) => {
    const { isReady, startRecording, stopRecording } = useSonic();
    const navigate = useNavigate();

    // State management
    const [mode, setMode] = useState(initialMode);
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

            let charSequence = "";
            let startDetected = false;
            let lastConfirmedChar = "";
            let charHits = 0;
            const REQUIRED_HITS = 2;

            const detect = () => {
                analyser.getFloatFrequencyData(dataArray);
                const freq = StellarPulse.getDominantFrequency(dataArray, context.sampleRate, analyser.fftSize);
                const char = StellarPulse.decodeFrequency(freq);

                if (char === 'START_END') {
                    if (!startDetected) {
                        startDetected = true;
                        charSequence = "";
                        console.log("StellarPulse: Scanning...");
                    }
                } else if (startDetected && char) {
                    if (char === lastConfirmedChar) {
                        charHits++;
                        if (charHits === REQUIRED_HITS) {
                            if (charSequence[charSequence.length - 1] !== char) {
                                // If we hit '@', we finish immediately
                                if (char === '@') {
                                    handleSuccess(charSequence + "@stellar");
                                    return;
                                }
                                charSequence += char;
                                setDecodedString(charSequence);
                            }
                        }
                    } else {
                        lastConfirmedChar = char;
                        charHits = 1;
                    }
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
            {/* Mode Toggle */}
            <div className="w-full flex p-1 bg-zinc-950 rounded-2xl border border-zinc-800/50">
                <button
                    onClick={() => { handleStop(); setMode('send'); }}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${mode === 'send' ? 'bg-zinc-100 text-zinc-900 shadow-xl' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Broadcast
                </button>
                <button
                    onClick={() => { handleStop(); setMode('receive'); }}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${mode === 'receive' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Receive
                </button>
            </div>

            {/* Visual Header */}
            <div className="relative group">
                <div className={`absolute -inset-4 rounded-full blur-3xl transition-all duration-700 opacity-20 ${status === 'sending' ? 'bg-cyan-500 animate-pulse' :
                    status === 'listening' ? 'bg-purple-500 animate-pulse' :
                        status === 'success' ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}></div>
                <div className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${status === 'sending' ? 'border-cyan-500 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.5)]' :
                    status === 'listening' ? 'border-purple-500 scale-110 shadow-[0_0_20px_rgba(168,85,247,0.5)]' :
                        status === 'success' ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-zinc-700'
                    }`}>
                    {status === 'sending' && (
                        <>
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div>
                            <div className="absolute -inset-4 bg-cyan-500/10 rounded-full animate-ping [animation-delay:0.2s]"></div>
                        </>
                    )}
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

            <button
                onClick={() => {
                    const ctx = initAudio();
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.frequency.value = 880; // High A note
                    g.gain.setValueAtTime(0, ctx.currentTime);
                    g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
                    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
                    osc.connect(g);
                    g.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.5);
                    console.log("Audio Test Triggered. Context State:", ctx.state);
                }}
                className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 underline decoration-zinc-800 underline-offset-4"
            >
                🔇 Verify Device Audio (Test Beep)
            </button>

            {/* Action Area */}
            <div className="w-full pt-4">
                {mode === 'send' ? (
                    <div className="space-y-4">
                        {isSending ? (
                            <div className="p-4 bg-zinc-900 border border-cyan-500/30 rounded-2xl text-center animate-pulse">
                                <span className="text-xs text-cyan-500 block mb-1">BROADCASTING ID...</span>
                                <span className="text-xl font-mono text-cyan-400 tracking-wider">
                                    {payload}
                                </span>
                            </div>
                        ) : (
                            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center opacity-60">
                                <span className="text-xs text-zinc-600 block mb-1">READY TO SYNC</span>
                                <span className="text-lg font-mono text-zinc-400">
                                    {payload}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={handleSend}
                            disabled={isSending || !payload}
                            className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ${isSending
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                : 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]'
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
                    </div>
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
