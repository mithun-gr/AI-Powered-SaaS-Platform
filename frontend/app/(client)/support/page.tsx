"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, User, Bot as BotIcon, PhoneCall, Sparkles,
    Video, Calendar, RefreshCw, Copy, Check,
    Zap, Shield, Clock, MessageSquare, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatbotService } from "@/lib/chatbot";
import { recentRequests, invoices, documents } from "@/lib/dummy-data";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    sender: "user" | "bot";
    content: string;
    timestamp: Date;
    suggestions?: string[];
    isTyping?: boolean;
    isError?: boolean;
}
interface HistoryEntry { role: "user" | "assistant"; content: string; }

// ─── Constants ──────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
    { label: "📋 Track my request",    value: "Track my service request status" },
    { label: "📂 Upload documents",    value: "How do I upload documents to the vault?" },
    { label: "📞 Need expert call",    value: "I need to speak with a human expert" },
    { label: "🛡️ Insurance renewal",  value: "Help me with insurance renewal" },
    { label: "☁️ Cloud services",      value: "Tell me about your cloud setup services" },
    { label: "⚖️ Legal advisory",      value: "I need legal advisory assistance" },
];

function deriveSuggestions(user: string, bot: string): string[] {
    const s = (user + " " + bot).toLowerCase();
    if (s.includes("track") || s.includes("status")) return ["Submit new request", "View dashboard"];
    if (s.includes("invoice") || s.includes("pay"))   return ["Payment history", "View invoices"];
    if (s.includes("legal") || s.includes("contract")) return ["Schedule consult", "Document review"];
    if (s.includes("cloud") || s.includes("aws"))     return ["AWS details", "Azure details"];
    if (s.includes("insurance"))                       return ["New policy", "Claims info"];
    return ["Speak to a human", "Upload document"];
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function SupportPage() {
    const [messages, setMessages] = useState<Message[]>([{
        id: "welcome",
        sender: "bot",
        content: "👋 Hello! I'm Later, your Morchantra AI Business Concierge.\n\nI can help you with:\n• Tracking service requests & documents\n• Legal, Insurance, Cloud & Tech services\n• Scheduling expert consultations\n• Any platform queries\n\nHow can I assist you today?",
        timestamp: new Date(),
        suggestions: QUICK_PROMPTS.slice(0, 4).map(p => p.label),
    }]);

    const [input,               setInput]               = useState("");
    const [isStreaming,         setIsStreaming]          = useState(false);
    const [conversationHistory, setConversationHistory] = useState<HistoryEntry[]>([]);
    const [copiedId,            setCopiedId]            = useState<string | null>(null);

    // Escalate modal
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [escalateData, setEscalateData] = useState({ issue: "", mobile: "", preferredTime: "" });
    const [phoneError, setPhoneError] = useState("");
    const [isEscalating,      setIsEscalating]      = useState(false);
    const [escalateSuccess,   setEscalateSuccess]   = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef       = useRef<HTMLInputElement>(null);
    const abortRef       = useRef<AbortController | null>(null);
    const containerRef   = useRef<HTMLDivElement>(null);
    const chatbotService = useRef(new ChatbotService(recentRequests, invoices, documents));

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // ── Copy ──────────────────────────────────────────────────────────────────
    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // ── Clear chat ────────────────────────────────────────────────────────────
    const handleClearChat = () => {
        abortRef.current?.abort();
        setConversationHistory([]);
        setMessages([{
            id: `welcome-${Date.now()}`,
            sender: "bot",
            content: "✨ Chat cleared! I'm ready to help.\n\nWhat can I assist you with today?",
            timestamp: new Date(),
            suggestions: QUICK_PROMPTS.slice(0, 4).map(p => p.label),
        }]);
    };

    // ── Main send — REAL STREAMING ─────────────────────────────────────────────
    const handleSend = useCallback(async (messageText?: string) => {
        const raw  = (messageText ?? input).trim();
        // Strip leading emoji from quick-prompt labels (e.g. "📋 Track..." → "Track...")
        const text = raw.replace(/^[\u{1F300}-\u{1FFFF}☁️⚖️🛡️📋📂📞]\uFE0F?\s*/u, "").trim() || raw;
        if (!text || isStreaming) return;

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const userMsg: Message = { id: `usr-${Date.now()}`, sender: "user", content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsStreaming(true);

        // Typing placeholder
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

            // Remove typing dots — start streaming content
            setMessages(prev => prev.map(m => m.id === botId ? { ...m, isTyping: false, content: "" } : m));

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let   full    = "";

            // ── Read chunks live from Groq ─────────────────────────────────────
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                full += chunk;
                setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: full } : m));
                scrollToBottom();
            }

            // Attach suggestions after full response arrives
            const sug = deriveSuggestions(text, full);
            setMessages(prev => prev.map(m => m.id === botId ? { ...m, suggestions: sug } : m));

            setConversationHistory(prev => [
                ...prev,
                { role: "user",      content: text },
                { role: "assistant", content: full },
            ]);

        } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") return;

            // Local fallback if Groq unreachable
            const fb = chatbotService.current.processMessage(text);
            setMessages(prev => prev.map(m =>
                m.id === botId
                    ? { ...m, content: fb.message, suggestions: fb.suggestions, isTyping: false, isError: true }
                    : m
            ));
            setConversationHistory(prev => [
                ...prev,
                { role: "user",      content: text },
                { role: "assistant", content: fb.message },
            ]);
        } finally {
            setIsStreaming(false);
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [input, isStreaming, conversationHistory, scrollToBottom]);

    // ── Escalate submit ─────────────────────────────────────────────────────
    const handleEscalate = () => {
        if (!escalateData.issue.trim() || !escalateData.mobile.trim()) return;
        
        // Inline Validation
        const digitsOnly = escalateData.mobile.replace(/\D/g, "");
        if (digitsOnly.length < 10) {
            setPhoneError("Valid 10+ digit phone number is required.");
            return;
        }
        
        setPhoneError("");
        setIsEscalating(true);
        setTimeout(() => {
            setIsEscalating(false);
            setEscalateSuccess(true);
            setMessages(prev => [...prev, {
                id: `esc-${Date.now()}`,
                sender: "bot",
                content: `✅ Escalation confirmed!\n\nIssue: ${escalateData.issue}\nContact: ${escalateData.mobile}${escalateData.preferredTime ? `\nPreferred: ${escalateData.preferredTime}` : ""}\n\nA senior specialist will reach you within 15–30 minutes. SMS confirmation sent.`,
                timestamp: new Date(),
            }]);
            setTimeout(() => {
                setShowEscalateModal(false);
                setEscalateSuccess(false);
                setEscalateData({ issue: "", mobile: "", preferredTime: "" });
            }, 2500);
        }, 1400);
    };

    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" /> AI Chat Support
                </h1>
                <p className="text-muted-foreground mt-1">
                    Powered by Groq · Real-time streaming · Multi-turn conversation memory
                </p>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: Zap,     label: "Response",    value: "Real-time",  color: "text-yellow-400" },
                    { icon: Shield,  label: "AI Model",    value: "Llama 3.1",  color: "text-blue-400"   },
                    { icon: Clock,   label: "Uptime",      value: "24/7 Online", color: "text-green-400" },
                ].map(({ icon: Icon, label, value, color }) => (
                    <Card key={label} className="border-border/50">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Icon className={`h-4 w-4 ${color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="font-semibold text-sm">{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map(p => (
                    <button key={p.value} onClick={() => handleSend(p.label)} disabled={isStreaming}
                        className="text-sm px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Live Expert Banner */}
            <div className="bg-gradient-to-r from-blue-600/15 to-violet-600/15 border border-blue-500/25 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 ring-1 ring-blue-500/30">
                        <Video className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base flex items-center gap-2">
                            Live Expert Office Hours
                            <span className="bg-rose-500 text-white text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full animate-pulse">Live Tomorrow</span>
                        </h3>
                        <p className="text-sm text-zinc-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                            Open Q&A with top legal and cloud experts.
                            <span className="flex items-center gap-1 text-zinc-300 font-semibold">
                                <Calendar className="w-3 h-3 text-blue-400" /> Thu, 3:00 PM – 4:00 PM IST
                            </span>
                        </p>
                    </div>
                </div>
                <Button className="shrink-0 bg-blue-600 hover:bg-blue-700 h-10 px-6 gap-2 font-bold w-full sm:w-auto" onClick={() => window.open('https://zoom.us/join', '_blank')}>
                    <Video className="w-4 h-4" /> RSVP & Join Zoom
                </Button>
            </div>

            {/* ── Chat Window ──────────────────────────────────────────────────── */}
            <Card className="flex flex-col border-border/60 shadow-lg relative" style={{ height: "620px" }}>

                {/* Chat Header */}
                <CardHeader className="border-b border-border py-3 px-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                                <BotIcon className="h-5 w-5 text-primary" />
                                <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background transition-colors ${isStreaming ? "bg-amber-400" : "bg-green-500"}`} />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                                    Later <Sparkles className="h-3.5 w-3.5 text-primary" />
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {isStreaming
                                        ? <span className="text-amber-400">⚡ Streaming response…</span>
                                        : <><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />Online · AI Concierge</>
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleClearChat}>
                                <RefreshCw className="h-3.5 w-3.5" /> Clear
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5" onClick={() => setShowEscalateModal(true)}>
                                <PhoneCall className="h-3.5 w-3.5" /> Escalate
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Messages */}
                <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scroll-smooth">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18 }}
                                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.sender === "bot" && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center flex-shrink-0 mt-1 ring-1 ring-primary/15">
                                        <BotIcon className="h-4 w-4 text-primary" />
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5 max-w-[75%]">
                                    <div className={`group relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.sender === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                                            : msg.isError
                                            ? "bg-amber-500/10 border border-amber-500/30 rounded-tl-none"
                                            : "bg-muted rounded-tl-none border border-border/50"
                                    }`}>
                                        {msg.isTyping ? (
                                            <div className="flex items-center gap-1 h-5">
                                                {[0, 0.18, 0.36].map((d, i) => (
                                                    <motion.span key={i} className="w-2 h-2 rounded-full bg-primary/50"
                                                        animate={{ y: [0, -6, 0] }}
                                                        transition={{ repeat: Infinity, duration: 0.55, delay: d }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <>
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                {/* Blinking cursor on the last streaming bot message */}
                                                {isStreaming && idx === messages.length - 1 && msg.sender === "bot" && (
                                                    <motion.span
                                                        animate={{ opacity: [1, 0] }}
                                                        transition={{ repeat: Infinity, duration: 0.65 }}
                                                        className="inline-block w-0.5 h-4 bg-primary/70 ml-0.5 align-middle"
                                                    />
                                                )}
                                                {msg.sender === "bot" && msg.content && (
                                                    <button onClick={() => handleCopy(msg.id, msg.content)}
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded">
                                                        {copiedId === msg.id
                                                            ? <Check className="h-3.5 w-3.5 text-green-500" />
                                                            : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    {!msg.isTyping && (
                                        <p className={`text-[10px] text-muted-foreground px-1 ${msg.sender === "user" ? "text-right" : "text-left"}`} suppressHydrationWarning>
                                            {formatTime(msg.timestamp)}{msg.isError ? " · Offline fallback" : ""}
                                        </p>
                                    )}

                                    {/* Suggestions */}
                                    {msg.suggestions && !msg.isTyping && !isStreaming && (
                                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                                            {msg.suggestions.map((s, i) => (
                                                <button key={i} onClick={() => handleSend(s)} disabled={isStreaming}
                                                    className="text-xs px-3 py-1 rounded-full border border-primary/25 bg-background hover:bg-primary/8 hover:border-primary/60 hover:text-primary transition-all disabled:opacity-40">
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {msg.sender === "user" && (
                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border p-4 shrink-0 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                        <Input
                            ref={inputRef}
                            placeholder={isStreaming ? "Later is responding…" : "Ask Later anything…"}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            className="flex-1 h-10 text-sm focus-visible:ring-1"
                            disabled={isStreaming}
                            autoComplete="off"
                            maxLength={800}
                        />
                        <Button type="submit" size="sm" className="h-10 px-4 gap-2 shrink-0" disabled={isStreaming || !input.trim()}>
                            {isStreaming
                                ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw className="h-4 w-4" /></motion.span>
                                : <Send className="h-4 w-4" />
                            }
                            <span className="hidden sm:inline">{isStreaming ? "..." : "Send"}</span>
                        </Button>
                    </form>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                        <ShieldCheck className="h-3 w-3 text-muted-foreground/50" />
                        <p className="text-[10px] text-muted-foreground/60">
                            Groq · Llama 3.1 8B · Real-time streaming · Fallback AI always active
                        </p>
                    </div>
                </div>
            </Card>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {[
                    { icon: Sparkles,     title: "Multi-turn Memory",  desc: "AI remembers full conversation context", color: "text-violet-400", bg: "bg-violet-500/10" },
                    { icon: MessageSquare, title: "Real-time Streaming", desc: "Tokens arrive live from Groq LLM",      color: "text-blue-400",   bg: "bg-blue-500/10"   },
                    { icon: PhoneCall,    title: "Human Escalation",    desc: "Connect to senior expert anytime",      color: "text-green-400",  bg: "bg-green-500/10"  },
                ].map(({ icon: Icon, title, desc, color, bg }) => (
                    <Card key={title} className="border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full ${bg} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{title}</p>
                                    <p className="text-xs text-muted-foreground">{desc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Escalate Modal ────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showEscalateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => !isEscalating && setShowEscalateModal(false)}>
                        <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                            className="bg-card rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            {escalateSuccess ? (
                                <div className="text-center py-8">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                                        className="h-20 w-20 rounded-full bg-green-500/15 ring-1 ring-green-500/30 flex items-center justify-center mx-auto mb-5">
                                        <PhoneCall className="h-9 w-9 text-green-500" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold mb-2">Request Sent!</h2>
                                    <p className="text-muted-foreground text-sm">A specialist will contact you within 15–30 minutes.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold">Speak to a Senior Expert</h2>
                                            <p className="text-sm text-muted-foreground mt-1">We'll route you to a domain specialist immediately.</p>
                                        </div>
                                        <button onClick={() => setShowEscalateModal(false)} disabled={isEscalating}
                                            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 disabled:opacity-40">✕</button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">Describe your challenge <span className="text-red-400">*</span></label>
                                            <textarea className="flex min-h-[90px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-50"
                                                placeholder="What do you need help with?"
                                                value={escalateData.issue}
                                                onChange={e => setEscalateData({ ...escalateData, issue: e.target.value })}
                                                disabled={isEscalating} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">Your phone number <span className="text-red-400">*</span></label>
                                            <Input type="tel" placeholder="+91 98765 43210"
                                                value={escalateData.mobile}
                                                onChange={e => {
                                                    setEscalateData({ ...escalateData, mobile: e.target.value });
                                                    if (phoneError) setPhoneError("");
                                                }}
                                                disabled={isEscalating} className={`h-10 ${phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}`} />
                                            {phoneError ? (
                                                <p className="text-xs text-red-500 mt-1 font-semibold">{phoneError}</p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground mt-1">Response within 15–30 min during business hours.</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">Preferred callback time</label>
                                            <select className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                                value={escalateData.preferredTime}
                                                onChange={e => setEscalateData({ ...escalateData, preferredTime: e.target.value })}
                                                disabled={isEscalating}>
                                                <option value="">Anytime (ASAP)</option>
                                                <option value="morning">Morning (9 AM – 12 PM)</option>
                                                <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
                                                <option value="evening">Evening (5 PM – 8 PM)</option>
                                            </select>
                                        </div>
                                        <Button onClick={handleEscalate}
                                            disabled={isEscalating || !escalateData.issue.trim() || !escalateData.mobile.trim()}
                                            className="w-full h-11 gap-2 font-semibold">
                                            {isEscalating
                                                ? <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw className="h-4 w-4" /></motion.span> Connecting…</>
                                                : <><PhoneCall className="h-4 w-4" /> Request Callback</>
                                            }
                                        </Button>
                                        <div className="bg-primary/8 border border-primary/20 rounded-lg p-3">
                                            <p className="text-xs text-muted-foreground">
                                                <span className="text-primary font-semibold">📞 Response Guarantee:</span>{" "}
                                                Experts respond within 15–30 min during business hours (9 AM – 8 PM IST, Mon–Sat).
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
