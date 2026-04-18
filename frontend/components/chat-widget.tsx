"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle, X, Send, Bot, Minimize2, Sparkles,
    User, RefreshCw, PhoneCall, Copy, Check, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChatbotService } from "@/lib/chatbot";
import { recentRequests, invoices, documents } from "@/lib/dummy-data";
import { usePlatform } from "@/components/providers/platform-provider";
import { incrementAiUsage, getUsage, PLAN_LIMITS } from "@/lib/usage-tracker";
import { fireLimitModal } from "@/components/global-limit-modal";

interface Message {
    id: string;
    sender: "user" | "bot";
    content: string;
    timestamp: Date;
    suggestions?: string[];
    isTyping?: boolean;
    isError?: boolean;
}

interface HistoryEntry {
    role: "user" | "assistant";
    content: string;
}

const INITIAL_SUGGESTIONS = [
    "Track my request", "Legal advisory",
    "Cloud services", "Speak to a human"
];

function deriveSuggestions(userMsg: string, botReply: string): string[] {
    const lower = userMsg.toLowerCase() + " " + botReply.toLowerCase();
    if (lower.includes("track") || lower.includes("status"))   return ["Submit new request", "View dashboard"];
    if (lower.includes("invoice") || lower.includes("pay"))    return ["Payment history", "View invoices"];
    if (lower.includes("legal") || lower.includes("contract")) return ["Schedule consult", "Document review"];
    if (lower.includes("cloud") || lower.includes("aws"))      return ["AWS details", "Azure details"];
    if (lower.includes("insurance") || lower.includes("policy")) return ["New policy", "Claims info"];
    return ["Speak to a human", "Upload document"];
}

export function ChatWidget() {
    const pathname    = usePathname();
    const { config }  = usePlatform();

    const [isOpen,    setIsOpen]    = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [messages,  setMessages]  = useState<Message[]>([{
        id: "welcome-1",
        sender: "bot",
        content: "👋 Hi there! I'm **Morchy**, your Morchantra AI concierge.\n\nI can help you track requests, check documents, answer service questions, or connect you with an expert. What can I do for you?",
        timestamp: new Date(),
        suggestions: INITIAL_SUGGESTIONS,
    }]);

    const [input,               setInput]               = useState("");
    const [isStreaming,         setIsStreaming]          = useState(false);
    const [conversationHistory, setConversationHistory] = useState<HistoryEntry[]>([]);
    const [copiedId,            setCopiedId]            = useState<string | null>(null);
    const [showEscalate,        setShowEscalate]        = useState(false);

    const messagesEndRef   = useRef<HTMLDivElement>(null);
    const abortRef         = useRef<AbortController | null>(null);
    const chatbotService   = useRef(new ChatbotService(recentRequests, invoices, documents, config.ai.persona));

    useEffect(() => { chatbotService.current.setPersona(config.ai.persona); }, [config.ai.persona]);
    useEffect(() => { if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

    if (pathname === "/login" || pathname === "/signup" || pathname?.startsWith("/admin")) return null;
    if (!isVisible) return null;

    // ── Copy helper ──────────────────────────────────────────────────────────
    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // ── Clear chat ───────────────────────────────────────────────────────────
    const handleClearChat = () => {
        abortRef.current?.abort();
        setConversationHistory([]);
        setShowEscalate(false);
        setMessages([{
            id: `welcome-${Date.now()}`,
            sender: "bot",
            content: "✨ Chat cleared! Fresh start — what can I help you with?",
            timestamp: new Date(),
            suggestions: INITIAL_SUGGESTIONS,
        }]);
    };

    // ── Escalate shortcut ────────────────────────────────────────────────────
    const triggerEscalate = () => {
        setShowEscalate(true);
        setMessages(prev => [...prev, {
            id: `esc-${Date.now()}`,
            sender: "bot",
            content: "📞 No problem! Please type your **phone number** below and a senior expert will call you within 15–30 minutes.",
            timestamp: new Date(),
        }]);
    };

    // ── Main send — REAL STREAMING ───────────────────────────────────────────
    const handleSend = useCallback(async (messageText?: string) => {
        const raw   = (messageText ?? input).trim();
        // Strip leading emoji from quick-prompt labels
        const text  = raw.replace(/^[\u{1F300}-\u{1FFFF}\u2600-\u27BF]\uFE0F?\s*/u, "").trim() || raw;
        if (!text || isStreaming) return;

        // Quota gate
        const usage  = getUsage();
        const limits = PLAN_LIMITS[usage.plan] ?? PLAN_LIMITS.starter;
        if ((usage.aiUsed || 0) >= limits.aiMessages) {
            fireLimitModal("ai", limits.label, limits.aiMessages);
            return;
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        // Append user bubble
        const userMsg: Message = { id: `usr-${Date.now()}`, sender: "user", content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsStreaming(true);
        incrementAiUsage();

        // Mark onboarding
        try {
            const done: string[] = JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]");
            if (!done.includes("ai")) localStorage.setItem("mrc_onboard_done", JSON.stringify([...done, "ai"]));
        } catch {}

        // Escalate phone-capture mode
        if (showEscalate) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: `esc-ok-${Date.now()}`,
                    sender: "bot",
                    content: `✅ Got it! We'll call **${text}** within 15–30 minutes.\n\nIs there anything else I can help with in the meantime?`,
                    timestamp: new Date(),
                    suggestions: ["Track my request", "Legal advisory"],
                }]);
                setShowEscalate(false);
                setIsStreaming(false);
            }, 800);
            return;
        }

        // Create bot placeholder with typing dots
        const botId = `bot-${Date.now()}`;
        setMessages(prev => [...prev, { id: botId, sender: "bot", content: "", timestamp: new Date(), isTyping: true }]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, history: conversationHistory }),
                signal: abortRef.current.signal,
            });

            if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

            // ── Read real token stream ────────────────────────────────────────────
            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let   full    = "";

            // Switch off typing dots, start showing content immediately
            setMessages(prev => prev.map(m => m.id === botId ? { ...m, isTyping: false, content: "" } : m));

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                full += chunk;
                // Update message content with every arriving chunk
                setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: full } : m));
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }

            // After stream complete → add suggestions
            const sug = deriveSuggestions(text, full);
            setMessages(prev => prev.map(m => m.id === botId ? { ...m, suggestions: sug } : m));

            setConversationHistory(prev => [
                ...prev,
                { role: "user", content: text },
                { role: "assistant", content: full },
            ]);

        } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") return;

            // Local fallback
            const fb = chatbotService.current.processMessage(text);
            setMessages(prev => prev.map(m =>
                m.id === botId
                    ? { ...m, content: fb.message, suggestions: fb.suggestions, isTyping: false, isError: true }
                    : m
            ));
            setConversationHistory(prev => [
                ...prev,
                { role: "user", content: text },
                { role: "assistant", content: fb.message },
            ]);
        } finally {
            setIsStreaming(false);
        }
    }, [input, isStreaming, conversationHistory, showEscalate]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end group/widget">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mb-4 w-[340px] sm:w-[380px] shadow-2xl origin-bottom-right"
                    >
                        <Card className="border-border/50 h-[520px] flex flex-col overflow-hidden bg-background/95 backdrop-blur ring-1 ring-primary/10">

                            {/* Header */}
                            <div className="py-3 px-4 flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/8 to-transparent shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center relative shadow-md ring-2 ring-background">
                                        <Bot className="h-5 w-5 text-white" />
                                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isStreaming ? "bg-amber-400" : "bg-green-500"}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm flex items-center gap-1.5">
                                            Morchy <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground">
                                            {isStreaming ? "⚡ Streaming response…" : "✨ AI Concierge · Online"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400" title="Clear chat" onClick={handleClearChat}>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" onClick={() => setIsOpen(false)}>
                                        <Minimize2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                                <AnimatePresence initial={false}>
                                    {messages.map(msg => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.18 }}
                                            className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            {msg.sender === "bot" && (
                                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-primary/15">
                                                    <Bot className="h-3.5 w-3.5 text-primary" />
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1.5 max-w-[82%]">
                                                <div className={`group relative px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                                                    msg.sender === "user"
                                                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                                                        : msg.isError
                                                        ? "bg-amber-500/10 border border-amber-500/20 rounded-tl-none"
                                                        : "bg-muted rounded-tl-none border border-border/40"
                                                }`}>
                                                    {msg.isTyping ? (
                                                        /* Typing indicator */
                                                        <div className="flex items-center gap-1 h-4">
                                                            {[0, 0.2, 0.4].map((d, i) => (
                                                                <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60"
                                                                    animate={{ y: [0, -5, 0] }}
                                                                    transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Real streamed / completed content */}
                                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                                            {/* Streaming cursor */}
                                                            {isStreaming && msg.id === messages[messages.length - 1]?.id && msg.sender === "bot" && (
                                                                <motion.span
                                                                    animate={{ opacity: [1, 0] }}
                                                                    transition={{ repeat: Infinity, duration: 0.7 }}
                                                                    className="inline-block w-0.5 h-3.5 bg-primary/70 ml-0.5 align-middle"
                                                                />
                                                            )}
                                                            {/* Copy button */}
                                                            {msg.sender === "bot" && msg.content && (
                                                                <button onClick={() => handleCopy(msg.id, msg.content)}
                                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {copiedId === msg.id
                                                                        ? <Check className="h-3.5 w-3.5 text-green-500" />
                                                                        : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    }
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Suggestion chips */}
                                                {msg.suggestions && !msg.isTyping && !isStreaming && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {msg.suggestions.map((s, i) => {
                                                            const isHuman = /human|expert|call/i.test(s);
                                                            return (
                                                                <button key={i}
                                                                    onClick={() => isHuman ? triggerEscalate() : handleSend(s)}
                                                                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                                                                        isHuman
                                                                            ? "border-green-500/40 text-green-500 hover:bg-green-500/10"
                                                                            : "border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground bg-background"
                                                                    }`}
                                                                >
                                                                    {isHuman && <PhoneCall className="w-3 h-3 inline mr-1" />}
                                                                    {s}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {msg.sender === "user" && (
                                                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <User className="h-3.5 w-3.5 text-primary" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 bg-background/60 backdrop-blur border-t border-border/50 shrink-0">
                                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2 relative">
                                    <Input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder={showEscalate ? "Enter your phone number…" : isStreaming ? "Morchy is responding…" : "Ask Morchy…"}
                                        type={showEscalate ? "tel" : "text"}
                                        className="h-10 text-[13px] rounded-full px-4 pr-12 focus-visible:ring-1 focus-visible:ring-primary/50"
                                        disabled={isStreaming}
                                        maxLength={800}
                                    />
                                    <Button type="submit" size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 rounded-full"
                                        disabled={!input.trim() || isStreaming}
                                    >
                                        {isStreaming
                                            ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw className="h-3.5 w-3.5" /></motion.span>
                                            : <Send className="h-3.5 w-3.5 ml-0.5" />
                                        }
                                    </Button>
                                </form>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    <ShieldCheck className="h-3 w-3 text-muted-foreground/50" />
                                    <p className="text-[9px] text-muted-foreground/50">Groq · Llama 3.1 · Encrypted</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <div className="relative">
                {!isOpen && (
                    <button onClick={() => setIsVisible(false)}
                        className="absolute -top-1 -left-1 z-10 bg-background border border-border rounded-full p-1 shadow-md opacity-0 group-hover/widget:opacity-100 transition-opacity hover:bg-muted"
                        title="Close">
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
                        isOpen
                            ? "bg-muted text-foreground border border-border ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                            : "bg-gradient-to-br from-primary to-blue-600 text-white hover:shadow-2xl"
                    }`}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                <X className="h-6 w-6" />
                            </motion.span>
                        ) : (
                            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} className="relative flex items-center justify-center">
                                <MessageCircle className="h-6 w-6" />
                                <motion.span
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ delay: 0.8, type: "spring" }}
                                    className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-background"
                                />
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );
}
