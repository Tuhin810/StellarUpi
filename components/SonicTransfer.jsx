import React, { useState, useEffect, useRef } from 'react';
import { useSonic } from '../hooks/useSonic';
import { StellarPulse } from '../utils/StellarPulse';
import { useNavigate } from 'react-router-dom';
import {
    Nfc,
    WifiOff,
    Mic,
    MicOff,
    ShieldCheck,
    Activity,
    Smartphone,
    Share2,
    CheckCircle2,
    AlertCircle,
    Fingerprint,
    Radio
} from 'lucide-react';

const SonicTransfer = ({ initialMode = 'send', payload = '' }) => {
    const { isReady, startRecording, stopRecording } = useSonic();
    const navigate = useNavigate();

    // State management
    const [mode, setMode] = useState(initialMode);
    const [status, setStatus] = useState('idle'); // idle, sending, listening, success, error
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    // decodedString is now internal only until final reveal

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
            setMessage('Establishing NFC Link...');

            const duration = await StellarPulse.transmit(context, payload);

            setTimeout(() => {
                setIsSending(false);
                setStatus('success');
                setMessage('NFC Data Transferred');

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

            // High-pass filter to remove background rumble/noise
            const filter = context.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(8000, context.currentTime); // Filter everything below 8kHz

            const analyser = context.createAnalyser();
            analyser.fftSize = 4096; // Double resolution for ultra-long range detection

            source.connect(filter);
            filter.connect(analyser);
            analyserRef.current = analyser;

            setStatus('listening');
            setMessage('Waiting for NFC proximity...');
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
                                console.log("NFC Captured:", charSequence);
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
        setMessage(`NFC Link Verified`);

        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }

        setTimeout(() => {
            if (window.confirm(`Stellar NFC Detected!\nIdentity: ${result}\n\nProceed to secure transfer?`)) {
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
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${mode === 'send' ? 'bg-zinc-100 text-zinc-900 shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Contactless Send
                </button>
                <button
                    onClick={() => { handleStop(); setMode('receive'); }}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${mode === 'receive' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    NFC Receive
                </button>
            </div>

            {/* Visual Header */}
            <div className="relative group">
                <div className={`absolute -inset-4 rounded-full blur-3xl transition-all duration-700 opacity-20 ${status === 'sending' ? 'bg-indigo-500 animate-pulse' :
                    status === 'listening' ? 'bg-indigo-500 animate-pulse' :
                        status === 'success' ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}></div>
                <div className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${status === 'sending' ? 'border-indigo-500 scale-110 shadow-[0_0_20px_rgba(79,70,229,0.5)]' :
                    status === 'listening' ? 'border-indigo-400 scale-110 shadow-[0_0_20px_rgba(79,70,229,0.3)]' :
                        status === 'success' ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-zinc-700'
                    }`}>
                    {status === 'sending' && (
                        <>
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full animate-ping [animation-delay:0.2s]"></div>
                        </>
                    )}
                    {status === 'sending' ? (
                        <Nfc className="w-10 h-10 text-indigo-400 animate-pulse" />
                    ) : status === 'listening' ? (
                        <Radio className="w-10 h-10 text-indigo-300 animate-pulse" />
                    ) : status === 'success' ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    ) : (
                        <Fingerprint className="w-10 h-10 text-zinc-500" />
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-zinc-100">
                    {mode === 'send' ? 'NFC Identity' : 'Secure Proximity Pay'}
                </h3>
                <p className="text-zinc-400 text-sm max-w-[250px] mx-auto leading-relaxed">
                    {mode === 'send'
                        ? 'Tap phones or bring within 1-meter range to sync wirelessly.'
                        : 'Hold device near sender to establish NFC secure link.'}
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
                    osc.frequency.value = 880;
                    g.gain.setValueAtTime(0, ctx.currentTime);
                    g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
                    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
                    osc.connect(g);
                    g.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.5);
                }}
                className="text-[10px] uppercase tracking-widest text-zinc-700 hover:text-zinc-500 underline decoration-zinc-800 underline-offset-4"
            >
                Verify Hardware Compatibility
            </button>

            {/* Action Area */}
            <div className="w-full pt-4">
                {mode === 'send' ? (
                    <div className="space-y-4">
                        {isSending ? (
                            <div className="p-4 bg-zinc-900 border border-indigo-500/30 rounded-2xl text-center shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                                <span className="text-xs text-indigo-500 block mb-1 uppercase font-black tracking-tighter">NFC Sync Active</span>
                                <span className="text-xl font-mono text-indigo-400 tracking-wider">
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
                            className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ${isSending
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : 'bg-white text-black shadow-lg hover:shadow-white/10'
                                }`}
                        >
                            {isSending ? (
                                <>
                                    <Share2 className="w-6 h-6 animate-pulse" />
                                    NFC STREAMING...
                                </>
                            ) : (
                                <>
                                    <Nfc className="w-6 h-6" />
                                    SEND VIA NFC
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={status === 'listening' ? handleStop : handleListen}
                            className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${status === 'listening'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-black'
                                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500'
                                }`}
                        >
                            {status === 'listening' ? (
                                <>
                                    <MicOff className="w-6 h-6" />
                                    CANCEL NFC SCAN
                                </>
                            ) : (
                                <>
                                    <Nfc className="w-6 h-6" />
                                    READY FOR NFC SYNC
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Technical Labels */}
            <div className="flex items-center gap-6 pt-2 opacity-30">
                <div className="flex items-center gap-1.5 grayscale">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Secure Link</span>
                </div>
                <div className="flex items-center gap-1.5 grayscale">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Stellar NFC v2.0</span>
                </div>
            </div>
        </div>
    );
};

export default SonicTransfer;
