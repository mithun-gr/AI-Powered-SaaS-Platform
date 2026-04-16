"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ExternalLink, Star, CheckCircle2, Search, X, Send, Loader2, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/lib/use-search";

const VENDORS = [
    {
        name: "CloudScale Providers",
        type: "AWS/Azure Cloud Architects",
        category: "cloud",
        rating: 4.9,
        reviews: 124,
        desc: "Certified cloud architects ready to migrate and optimize your infrastructure. Exclusive 20% discount for Morchantra clients.",
        logo: "C",
        color: "from-blue-500 to-cyan-500",
        perks: ["Free Architecture Review", "ISO 27001 Certified"],
        email: "cloud@cloudscale.io"
    },
    {
        name: "FinSolve Associates",
        type: "Chartered Accountants",
        category: "finance",
        rating: 4.8,
        reviews: 89,
        desc: "Full-service accounting, GST filing, and financial auditing. Directly integrates with Morchantra invoicing.",
        logo: "F",
        color: "from-emerald-500 to-green-500",
        perks: ["Automated GST Filing", "Audit Support"],
        email: "contact@finsolve.in"
    },
    {
        name: "LexGuard IP",
        type: "Intellectual Property Lawyers",
        category: "legal",
        rating: 4.9,
        reviews: 210,
        desc: "Trademark and patent registration across US, EU, and India. Get your brand protected globally.",
        logo: "L",
        color: "from-violet-500 to-purple-500",
        perks: ["Global Filing", "Free Prior-Art Search"],
        email: "partners@lexguard.law"
    },
    {
        name: "SecureNet Cyber",
        type: "Penetration Testing & SecOps",
        category: "security",
        rating: 4.7,
        reviews: 56,
        desc: "Enterprise-grade penetration testing and vulnerability assessments for SaaS and FinTech startups.",
        logo: "S",
        color: "from-red-500 to-rose-500",
        perks: ["Compliance Reports", "$1M Liability Coverage"],
        email: "ops@securenet.io"
    }
];

const CATEGORIES = ["All", "Cloud", "Finance", "Legal", "Security"];

function ContactModal({ vendor, onClose }: { vendor: typeof VENDORS[0]; onClose: () => void }) {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const send = () => {
        if (!name || !message) return;
        setSending(true);
        setTimeout(() => {
            setSending(false);
            setSent(true);
            setTimeout(onClose, 2000);
        }, 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className={`h-2 w-full bg-gradient-to-r ${vendor.color}`} />
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${vendor.color} flex items-center justify-center font-black text-white text-lg`}>
                            {vendor.logo}
                        </div>
                        <div>
                            <p className="font-bold text-white">{vendor.name}</p>
                            <p className="text-xs text-zinc-500">{vendor.type}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {sent ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="font-bold text-white text-lg mb-1">Request Sent!</h3>
                        <p className="text-zinc-500 text-sm">The partner will respond within 24 hours.</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Your Name</label>
                            <input
                                value={name} onChange={e => setName(e.target.value)}
                                placeholder="e.g., Mithunraj"
                                className="w-full h-11 rounded-xl bg-zinc-900 border border-zinc-800 px-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-primary/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Message</label>
                            <textarea
                                value={message} onChange={e => setMessage(e.target.value)}
                                placeholder="Describe your requirements..."
                                rows={4}
                                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-primary/50 resize-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Mail className="w-3 h-3" />
                            <span>Will be forwarded to <span className="text-zinc-300">{vendor.email}</span></span>
                        </div>
                        <Button
                            onClick={send}
                            disabled={sending || !name || !message}
                            className="w-full h-11 font-bold gap-2 bg-primary hover:bg-primary/90"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {sending ? "Sending..." : "Send Request"}
                        </Button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export default function MarketplacePage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [contactVendor, setContactVendor] = useState<typeof VENDORS[0] | null>(null);

    const { query, setQuery, results: searchResults, clearSearch, hasQuery } = useSearch(VENDORS, ["name", "type", "category", "desc"]);

    const filtered = activeCategory === "All"
        ? searchResults
        : searchResults.filter(v => v.category === activeCategory.toLowerCase());

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Partner Marketplace</h1>
                <p className="text-zinc-400">Curated, vetted, and trusted partners to scale your business operations.</p>
            </div>

            {/* Vetted Banner */}
            <div className="flex bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl items-center gap-4">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">Morchantra Vetted Network</h4>
                    <p className="text-xs text-blue-200/80">Every vendor here is manually audited and verified by our team. Payments to partners are protected by our Escrow milestone system.</p>
                </div>
            </div>

            {/* Search + Category Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search partners by name, category, or service…"
                        className="w-full h-10 pl-10 pr-9 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-primary/50"
                    />
                    {hasQuery && (
                        <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 h-10 rounded-xl text-sm font-semibold transition-all border ${activeCategory === cat ? "bg-primary text-white border-primary" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Vendor Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                    <Search className="w-8 h-8 mb-3 opacity-40" />
                    <p className="font-semibold text-zinc-400">No partners found</p>
                    <p className="text-sm mt-1">Try a different search or category.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {filtered.map((vendor, i) => (
                        <motion.div key={vendor.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                            <Card className="border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all group hover:border-zinc-700 overflow-hidden">
                                <div className={`h-1 w-full bg-gradient-to-r ${vendor.color}`} />
                                <CardContent className="p-6">
                                    <div className="flex gap-4 items-start mb-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${vendor.color} flex items-center justify-center font-black text-2xl text-white shrink-0 shadow-lg`}>
                                            {vendor.logo}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{vendor.name}</h3>
                                                    <p className="text-xs text-primary font-bold uppercase tracking-widest">{vendor.type}</p>
                                                </div>
                                                <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800 shrink-0">
                                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                    <span className="text-xs font-bold text-white">{vendor.rating}</span>
                                                    <span className="text-[10px] text-zinc-500">({vendor.reviews})</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-zinc-400 mb-5 leading-relaxed line-clamp-2">{vendor.desc}</p>

                                    <div className="space-y-4">
                                        <div className="flex gap-2 flex-wrap">
                                            {vendor.perks.map(perk => (
                                                <span key={perk} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                    {perk}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 pt-3 border-t border-zinc-800/50">
                                            <Button
                                                className="flex-1 h-10 gap-2 font-bold text-xs"
                                                onClick={() => setContactVendor(vendor)}
                                            >
                                                Contact Partner
                                            </Button>
                                            <Button
                                                className="h-10 px-4 text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                                                variant="secondary"
                                                onClick={() => window.open(`mailto:${vendor.email}`, "_blank")}
                                                title="Open in email client"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Contact Modal */}
            <AnimatePresence>
                {contactVendor && (
                    <ContactModal vendor={contactVendor} onClose={() => setContactVendor(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
