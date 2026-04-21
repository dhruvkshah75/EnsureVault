"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Bot, User } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([
        { role: 'assistant', text: 'Hello! I am EnsureVault Assistant. How can I help you with your insurance today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (open) scrollToBottom();
    }, [messages, open]);

    const toggleChat = () => setOpen(!open);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg = input.trim();
        setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API}/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
                signal: AbortSignal.timeout(30000), // 30 second timeout
            });
            const data = await res.json();
            
            if (res.ok && data.reply) {
                setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
            } else if (data.detail) {
                // Handle error response from API
                setMessages((prev) => [...prev, { role: 'assistant', text: 'I encountered an issue processing your request. Please try again later.' }]);
            } else {
                setMessages((prev) => [...prev, { role: 'assistant', text: 'Unable to process your request. Please try again.' }]);
            }
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') {
                setMessages((prev) => [...prev, { role: 'assistant', text: 'Request timed out. Please try again.' }]);
            } else {
                setMessages((prev) => [...prev, { role: 'assistant', text: 'Service unavailable. My systems are currently undergoing maintenance.' }]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[70] font-sans">
            <button
                onClick={toggleChat}
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${open ? 'bg-destructive rotate-90' : 'bg-primary'
                    }`}
            >
                {open ? <X className="text-white w-6 h-6" /> : <MessageSquare className="text-white w-6 h-6" />}
            </button>

            {open && (
                <div className="absolute bottom-20 right-0 w-96 h-[500px] glass rounded-2xl flex flex-col shadow-2xl animate-premium-fade overflow-hidden border border-white/20">
                    {/* Header */}
                    <div className="p-4 bg-primary text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">EnsureVault AI</h3>
                                <p className="text-[10px] text-white/70">Online & Ready to Help</p>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'} animate-premium-fade`}>
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'assistant' ? 'bg-indigo-100 text-primary' : 'bg-primary text-white'
                                        }`}>
                                        {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'assistant'
                                        ? 'bg-white text-gray-800 rounded-tl-none'
                                        : 'bg-primary text-white rounded-tr-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="flex gap-2 max-w-[85%] items-center">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-primary flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="flex gap-1.5 p-3 px-4 bg-white rounded-2xl rounded-tl-none shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area (Forced Dark Theme for consistency) */}
                    <div className="p-4 bg-[#0a0a0c] border-t border-white/10 rounded-b-2xl">
                        <div className="relative group">
                            <input
                                type="text"
                                value={input}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm"
                                placeholder="Consult the vault..."
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-white/10 rounded-lg transition-all disabled:opacity-30"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[10px] text-center mt-2 text-slate-500 uppercase tracking-widest font-semibold opacity-60">
                            Elite Intelligence • Powered by Gemini
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
