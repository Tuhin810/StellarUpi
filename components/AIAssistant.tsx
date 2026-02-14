
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Loader2, Mic, MicOff, AudioLines, Search, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { processAIQuery, transcribeAudio } from '../services/aiService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

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
        setMessages(prev => [...prev.slice(-1), { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                parts: [{ text: m.content }]
            })).filter((_, i, arr) => !(i === 0 && arr[i].role === 'model'));

            const response = await processAIQuery(profile.stellarId, userMessage, history);
            setMessages([{ role: 'assistant', content: response }]);
        } catch (error) {
            setMessages([{ role: 'assistant', content: 'Connection timeout. Try again.' }]);
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-between p-8 overflow-hidden"
                    >
                        {/* Intense Bottom Glow - High Fidelity */}
                        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[120%] h-[40vh] bg-[#E5D5B3]/20 blur-[100px] rounded-full pointer-events-none z-[99]" />
                        <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-[#E5D5B3]/25 via-[#E5D5B3]/5 to-transparent pointer-events-none" />

                        {/* Top Bar */}
                        <div className="w-full flex justify-end z-[101]">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all backdrop-blur-md"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl text-center space-y-12 mb-20">
                            <div className="space-y-4">
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]"
                                >
                                    Hello {profile?.displayName?.split(' ')[0] || 'there'}
                                </motion.p>
                                <motion.h2
                                    key={messages[messages.length - 1].content}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-white text-4xl md:text-5xl font-bold tracking-tight leading-tight max-w-lg px-4"
                                >
                                    {isRecording ? "I'm listening..." :
                                        isTranscribing ? "Thinking..." :
                                            messages[messages.length - 1].content}
                                </motion.h2>
                            </div>
                        </div>

                        {/* Bottom Input Area - Premium Glassmorphism */}
                        <div className="w-full max-w-xl pb-16 z-[101] px-6">
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="relative group"
                            >
                                {/* Inner Glow for Input Field */}
                                <div className="absolute inset-0 bg-[#E5D5B3]/20 blur-3xl rounded-[2.5rem] opacity-0 group-focus-within:opacity-40 transition-all duration-500" />

                                <div className="relative flex items-center bg-white/[0.03] backdrop-blur-[50px] border border-white/10 rounded-[2.5rem] p-2 pr-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] transition-all duration-300 group-focus-within:border-white/20 group-focus-within:bg-white/[0.05]">
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500/20 text-red-500' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                                    </button>

                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder={isLoading ? "Analyzing..." : "Ask anything..."}
                                        className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder:text-zinc-600 text-lg font-medium selection:bg-[#E5D5B3]/30"
                                        disabled={isLoading || isTranscribing}
                                    />

                                    {input.trim() && (
                                        <motion.button
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            onClick={handleSend}
                                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                                        >
                                            <ArrowUp size={20} />
                                        </motion.button>
                                    )}

                                    {isLoading && (
                                        <div className="flex items-center gap-2 px-2 text-[#E5D5B3] italic text-sm font-bold">
                                            <Loader2 size={16} className="animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {voiceError && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-red-400 text-sm font-medium"
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
