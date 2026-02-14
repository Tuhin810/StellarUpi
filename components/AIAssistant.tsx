
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
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
        { role: 'assistant', content: 'Hello! I am your Stellar AI assistant. I can help you with your transaction history, group splits, and more. Try asking "How much money did I receive today?"' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const { profile } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !profile) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        // Format history for Gemini (must start with 'user' role)
        const history = messages
            .map(m => ({
                role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                parts: [{ text: m.content }]
            }))
            .filter((_, i, arr) => {
                // Remove leading 'model' messages
                if (i === 0 && arr[i].role === 'model') return false;
                return true;
            });

        try {
            const response = await processAIQuery(profile.stellarId, userMessage, history);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request. Please check your internet connection and try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full gold-gradient shadow-2xl flex items-center justify-center z-40 border-2 border-white/20"
            >
                <Sparkles className="text-black" size={24} />
            </motion.button>

            {/* Chat Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed inset-x-4 bottom-6 top-20 bg-[#121212] border border-white/10 rounded-[2rem] z-[60] flex flex-col overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#E5D5B3]/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
                                    <Bot className="text-black" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white">Stellar AI</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Online & Ready</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user'
                                        ? 'bg-[#E5D5B3] text-black rounded-tr-none font-bold'
                                        : 'bg-white/5 text-zinc-200 border border-white/10 rounded-tl-none font-medium'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                        <Loader2 className="animate-spin text-[#E5D5B3]" size={18} />
                                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Stellar is thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-6 border-t border-white/5 bg-[#0A0A0A]">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask me anything..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-[#E5D5B3]/50 transition-colors font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading}
                                    className="absolute right-2 w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-black disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-zinc-500 mt-4 font-bold uppercase tracking-widest">
                                Powered by Gemini AI Engine
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;
