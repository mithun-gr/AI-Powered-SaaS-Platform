"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, LayoutDashboard, FileText, CreditCard, Settings, Bot, Users, FolderOpen } from "lucide-react";

type CommandItem = {
    id: string;
    title: string;
    icon: any;
    action: () => void;
    category: string;
};

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();

    // Toggle on Cmd+K or Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Close on Escape
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const commands: CommandItem[] = [
        { id: "dashboard", title: "Go to Dashboard", icon: LayoutDashboard, category: "Navigation", action: () => router.push("/dashboard") },
        { id: "new-request", title: "Create New Request", icon: FileText, category: "Actions", action: () => router.push("/requests/new") },
        { id: "documents", title: "Open Document Vault", icon: FolderOpen, category: "Navigation", action: () => router.push("/documents") },
        { id: "upgrade", title: "Upgrade Plan / Billing", icon: CreditCard, category: "Account", action: () => router.push("/payments") },
        { id: "settings", title: "Manage Security Settings", icon: Settings, category: "Account", action: () => router.push("/settings") },
        { id: "ai-tools", title: "Launch AI Generators", icon: Bot, category: "Tools", action: () => router.push("/tools") },
        { id: "analytics", title: "View ROI Analytics", icon: Search, category: "Navigation", action: () => router.push("/analytics") },
        { id: "admin", title: "Switch to Admin Panel", icon: Users, category: "Admin", action: () => router.push("/admin") },
    ];

    const filtered = commands.filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) || 
        cmd.category.toLowerCase().includes(query.toLowerCase())
    );

    const runCommand = (action: () => void) => {
        setIsOpen(false);
        setQuery("");
        action();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 z-[101] flex p-4 pt-[10vh] justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[60vh]"
                        >
                            <div className="flex items-center border-b border-zinc-800 px-4">
                                <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                                <input
                                    autoFocus
                                    className="flex-1 bg-transparent border-none outline-none ring-0 p-4 text-lg text-white placeholder:text-zinc-500"
                                    placeholder="Type a command or search..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <div className="hidden sm:flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-400">ESC</kbd>
                                    <span className="text-xs text-zinc-500 font-medium">to close</span>
                                </div>
                            </div>

                            <div className="overflow-y-auto p-2">
                                {filtered.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500 text-sm">
                                        No results found.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filtered.map((cmd) => (
                                            <button
                                                key={cmd.id}
                                                onClick={() => runCommand(cmd.action)}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-primary/20 transition-colors">
                                                        <cmd.icon className="w-4 h-4 text-zinc-400 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{cmd.title}</p>
                                                        <p className="text-xs text-zinc-500">{cmd.category}</p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center text-xs text-zinc-500">
                                <span className="font-medium">Morchantra Command Menu</span>
                                <span>Navigate instantly anywhere in the app.</span>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
