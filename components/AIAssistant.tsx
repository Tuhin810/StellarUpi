
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, Loader2, Mic, MicOff, AudioLines } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { processAIQuery } from '../services/aiService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your Stellar AI assistant. How can I help you today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const { profile } = useAuth();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startRecording = async () => {
        try {
            setVoiceError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleAudioSubmit(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            setVoiceError('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleAudioSubmit = async (blob: Blob) => {
        setIsTranscribing(true);
        try {
            const base64Audio = await blobToBase64(blob);
            const { transcribeAudio } = await import('../services/aiService');
            const transcript = await transcribeAudio(base64Audio, 'audio/webm');

            if (transcript) {
                setInput(transcript.trim());
            }
        } catch (error) {
            console.error('AI Voice Error:', error);
            setVoiceError('Sorry, I couldn\'t process your voice request. Please try typing.');
        } finally {
            setIsTranscribing(false);
            setIsRecording(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !profile) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        const history = messages
            .map(m => ({
                role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                parts: [{ text: m.content }]
            }))
            .filter((_, i, arr) => !(i === 0 && arr[i].role === 'model'));

        try {
            const response = await processAIQuery(profile.stellarId, userMessage, history);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error processing request.' }]);
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
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full gold-gradient shadow-2xl flex items-center justify-center z-40 border-2 border-white/20"
            >
                <Sparkles className="text-black" size={24} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed inset-x-4 bottom-6 top-20 bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] z-[60] flex flex-col overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#E5D5B3]/10 via-transparent to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg">
                                    <Bot className="text-black" size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-lg tracking-tight">Stellar AI</h3>
                                    <div className="flex items-center gap-2">
                                        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></motion.span>
                                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Neural Active</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {messages.map((m, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-xl ${m.role === 'user' ? 'bg-[#E5D5B3] text-black rounded-tr-none font-bold' : 'bg-zinc-900/50 text-zinc-200 border border-white/5 rounded-tl-none font-medium backdrop-blur-md'}`}>
                                        <p className="text-sm leading-relaxed">{m.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-[2rem] rounded-tl-none flex items-center gap-4 backdrop-blur-md">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => <motion.span key={i} animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} className="w-1 h-3 bg-[#E5D5B3] rounded-full"></motion.span>)}
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Processing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Voice Overlay */}
                        <AnimatePresence>
                            {(isRecording || isTranscribing || voiceError) && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-[70] flex flex-col items-center justify-center p-8">
                                    {voiceError ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-8 border border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                                                <X size={48} className="text-red-500" />
                                            </div>
                                            <h4 className="text-2xl font-black text-white mb-4">Error</h4>
                                            <p className="text-zinc-400 mb-12">{voiceError}</p>
                                            <button onClick={() => setVoiceError(null)} className="px-8 py-3 rounded-xl gold-gradient text-black font-black uppercase text-xs tracking-widest">Close</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-12 relative">
                                                <motion.div
                                                    animate={isTranscribing ? { rotate: 360 } : { scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                                                    transition={isTranscribing ? { duration: 2, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
                                                    className={`absolute inset-0 bg-[#E5D5B3] rounded-full blur-3xl ${isTranscribing ? 'opacity-20' : ''}`}
                                                ></motion.div>
                                                <div className="relative w-36 h-36 rounded-full gold-gradient flex items-center justify-center shadow-[0_0_60px_rgba(229,213,179,0.3)] border-4 border-[#1A1A1A]">
                                                    {isTranscribing ? (
                                                        <Loader2 size={64} className="text-black animate-spin" />
                                                    ) : (
                                                        <AudioLines size={64} className="text-black" />
                                                    )}
                                                </div>
                                            </div>
                                            <h4 className="text-3xl font-black text-white mb-6 italic uppercase tracking-tighter">
                                                {isTranscribing ? 'Transcribing...' : 'Listening'}
                                            </h4>
                                            {!isTranscribing && (
                                                <button onClick={stopRecording} className="mt-16 w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/30 active:scale-95 transition-all">
                                                    <MicOff size={28} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>


                        {/* Input */}
                        <div className="p-8 border-t border-white/5 bg-[#050505]">
                            <div className="relative flex items-center gap-3">
                                <button onClick={startRecording} className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 text-zinc-400 hover:text-[#E5D5B3] transition-all">
                                    <Mic size={24} />
                                </button>
                                <div className="relative flex-1">
                                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type or use voice..." className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-[#E5D5B3]/30 transition-all font-medium" />
                                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-black disabled:opacity-20 transition-all active:scale-95 shadow-lg"><Send size={18} /></button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;
