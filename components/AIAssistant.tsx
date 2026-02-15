
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Loader2, Mic, MicOff, AudioLines, Search, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { processAIQuery, transcribeAudio } from '../services/aiService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const NeuralCore = ({ isProcessing, isListening }: { isProcessing: boolean, isListening: boolean }) => {
    return (
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[140vw] h-[70vh] flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            {/* Massive Gold Ambient Glow - Primary Layer */}
            <motion.div
                animate={{
                    opacity: isListening ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
                    scale: isListening ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-t from-[#E5D5B3]/70 via-[#E5D5B3]/5 to-transparent blur-[120px]"
            />

            {/* Warm Accent Core */}
            <motion.div
                animate={{
                    opacity: isListening ? [0.3, 0.5, 0.3] : [0.1, 0.2, 0.1],
                    y: [10, -10, 10]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 w-[80%] h-full bg-[#E5D5B3] blur-[80px] rounded-full h-36"
            />

            {/* Moving Fluid Mesh */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        borderRadius: [
                            "42% 58% 70% 30% / 45% 45% 55% 55%",
                            "58% 42% 35% 65% / 55% 55% 45% 45%",
                            "42% 58% 70% 30% / 45% 45% 55% 55%"
                        ],
                        rotate: isProcessing ? [0, 180, 360] : (i % 2 === 0 ? [0, 30, 0] : [0, -30, 0]),
                        opacity: isListening ? [0.2, 0.4, 0.2] : [0.05, 0.1, 0.05],
                    }}
                    transition={{
                        duration: isProcessing ? 4 : 10 + i * 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-full h-full bg-[#E5D5B3]/10 blur-[40px]"
                />
            ))}

            {/* The "Horizon Line" - Sharp gold glow */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-[#E5D5B3] to-transparent opacity-30 blur-sm" />
        </div>
    );
};

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'How can I help you today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const { profile } = useAuth();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            setVoiceError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleAudioSubmit(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            setVoiceError('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAudioSubmit = async (blob: Blob) => {
        setIsTranscribing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const transcript = await transcribeAudio(base64Audio);
                if (transcript) setInput(transcript.trim());
                setIsTranscribing(false);
            };
        } catch (error) {
            setVoiceError('Transcription failed');
            setIsTranscribing(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !profile) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev.slice(-10), { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                parts: [{ text: m.content }]
            })).filter((_, i, arr) => !(i === 0 && arr[i].role === 'model'));

            const response = await processAIQuery(profile.stellarId, userMessage, history);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connecting to Stellar Core... Please wait.' }]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-[#E5D5B3] shadow-2xl flex items-center justify-center z-40 border-2 border-white/20 overflow-hidden"
            >
                <img src="/assets/aiLogo.png" alt="Stellar AI" className="w-full h-full object-cover" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 h-screen w-screen bg-[#030303] z-[100] flex flex-col items-center overflow-hidden"
                    >
                        {/* Refined Neural Core Stage - Replaces static glow */}
                        <NeuralCore isProcessing={isLoading || isTranscribing} isListening={isRecording} />

                        {/* Top Bar - High Z-Index Sticky-style Header */}
                        <div className="w-full h-24 px-5 pt-8 flex justify-between items-center z-[110] shrink-0 bg-gradient-to-b from-[#030303] via-[#030303]/80 to-transparent backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#E5D5B3] border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-inner overflow-hidden">
                                    <img src="/assets/aiLogo.png" alt="Stellar AI" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm tracking-tight text-shadow-sm">Stellar AI</span>
                                    <span className="text-white/40 text-[10px] uppercase tracking-widest font-black">Neural Link Active</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all backdrop-blur-xl hover:bg-white/10"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Main Stage - Centered Experience */}
                        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col z-[10] overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {isRecording || isTranscribing ? (
                                    <motion.div
                                        key="status"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="flex-1 flex flex-col items-center justify-center px-10"
                                    >
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 bg-[#E5D5B3]/20 blur-[60px] rounded-full animate-pulse" />
                                            <div className="relative w-40 h-40 rounded-full border border-[#E5D5B3]/10 flex items-center justify-center overflow-hidden backdrop-blur-3xl bg-white/[0.02]">
                                                <AudioLines size={64} className="text-[#E5D5B3]/80" />
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                                    className="absolute inset-0 border border-dashed border-[#E5D5B3]/20 rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <h2 className="text-white text-6xl md:text-7xl font-black tracking-tighter italic text-center leading-none">
                                            {isRecording ? "Listening..." : "Thinking..."}
                                        </h2>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="history"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex-1 overflow-y-auto px-6 py-20 custom-scrollbar scroll-smooth"
                                    >
                                        <div className="min-h-full flex flex-col justify-center space-y-12 pb-40">
                                            {messages.map((msg, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 30 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}
                                                >
                                                    {msg.role === 'user' ? (
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-2 max-w-[85%] backdrop-blur-sm shadow-xl">
                                                            <p className="text-white text-xl font-semibold tracking-tight leading-snug">{msg.content}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6 w-full max-w-3xl">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <div className="w-5 h-5 rounded-full border border-white/10 overflow-hidden shadow-sm">
                                                                    <img src="/assets/aiLogo.png" alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                                <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Stellar AI</span>
                                                            </div>
                                                            <h3 className="text-white/90 text-xl md:text-2xl lg:text-xl font-medium tracking-tight leading-[1.05] text-left px-1 break-words">
                                                                {msg.content}
                                                            </h3>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                            {isLoading && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center gap-3 text-[#E5D5B3]/60 font-black uppercase tracking-[0.2em] text-[10px] px-1"
                                                >
                                                    <div className="w-4 h-4 rounded-full border border-white/5 overflow-hidden animate-pulse">
                                                        <img src="/assets/aiLogo.png" alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    Processing...
                                                </motion.div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Dock - Apple-Style Input Bar */}
                        <div className="w-full max-w-2xl shrink-0 z-[110] px-6 pb-12 pt-10">
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="relative"
                            >
                                <div className="relative flex items-center bg-white/[0.08] backdrop-blur-[50px] border border-white/10 rounded-full p-2 pl-6 pr-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder={isLoading ? "Analyzing..." : "Ask anything..."}
                                        className="flex-1 bg-transparent border-none text-white px-0 py-3 focus:outline-none placeholder:text-white/30 text-lg font-medium"
                                        disabled={isLoading || isTranscribing}
                                    />

                                    <div className="flex items-center gap-2">
                                        {input.trim() ? (
                                            <motion.button
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                onClick={handleSend}
                                                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors"
                                            >
                                                <ArrowUp size={20} />
                                            </motion.button>
                                        ) : (
                                            <button
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'text-[#E5D5B3]' : 'text-white/60 hover:text-white'}`}
                                            >
                                                {isRecording ? <AudioLines size={24} className="animate-pulse" /> : <AudioLines size={20} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {voiceError && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-red-400 text-xs font-medium"
                                    >
                                        {voiceError}
                                    </motion.p>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;
