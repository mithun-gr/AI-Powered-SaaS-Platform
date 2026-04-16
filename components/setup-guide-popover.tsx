"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Users, FileText, Shield, FolderOpen, Sparkles, Check, ChevronRight, CheckCircle2, Circle, X } from "lucide-react";

const CHECKLIST_ITEMS = [
  { id: "profile",  label: "Complete your profile",     icon: Users,      href: "/settings" },
  { id: "request",  label: "Submit your first request", icon: FileText,   href: "/requests/new" },
  { id: "2fa",      label: "Enable 2FA security",       icon: Shield,     href: "/settings" },
  { id: "docs",     label: "Upload a document",         icon: FolderOpen, href: "/documents" },
  { id: "ai",       label: "Try the AI assistant",      icon: Sparkles,   href: "/tools" },
];

export function SetupGuidePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]");
  });

  useEffect(() => {
    const sync = () => {
      setChecked(JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]"));
    };
    window.addEventListener("mrc:onboard-update", sync);
    const storageHandler = (e: StorageEvent) => { if (e.key === "mrc_onboard_done") sync(); };
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("mrc:onboard-update", sync);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const handleItemClick = (id: string) => {
     if (id === "profile" || id === "2fa") {
        const next = checked.includes(id) ? checked.filter(c => c !== id) : [...checked, id];
        setChecked(next);
        localStorage.setItem("mrc_onboard_done", JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("mrc:onboard-update"));
     }
  };

  const pct = Math.round((checked.length / CHECKLIST_ITEMS.length) * 100);
  const isComplete = checked.length === CHECKLIST_ITEMS.length;

  if (isComplete) return null; // Fully complete, hide the button forever

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
          isOpen ? "bg-primary/10 border-primary/30 text-primary" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300"
        }`}
      >
        <Sparkles className={`w-3.5 h-3.5 ${isOpen ? "text-primary animate-pulse" : "text-zinc-500"}`} />
        <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">Setup Guide</span>
        <span className="text-[10px] font-black opacity-60">[{checked.length}/{CHECKLIST_ITEMS.length}]</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-12 right-0 w-80 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-4 z-50 overflow-hidden"
          >
            {/* Accents */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div>
                  <h3 className="font-bold text-white text-sm">Getting Started</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Configure your workspace.</p>
               </div>
               <button onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-white p-1">
                  <X className="w-4 h-4" />
               </button>
            </div>

            <div className="space-y-1 mt-2 mb-4 relative z-10">
                <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-zinc-500">
                    <span>Progress</span>
                    <span className="text-primary">{pct}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${pct}%` }} className="h-full bg-primary" transition={{ duration: 0.5 }} />
                </div>
            </div>

            <div className="space-y-1 relative z-10">
               {CHECKLIST_ITEMS.map((item) => {
                  const done = checked.includes(item.id);
                  const Icon = item.icon;
                  return (
                     <Link 
                        key={item.id} 
                        href={item.href} 
                        onClick={() => handleItemClick(item.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-all group ${done ? "opacity-50" : "hover:bg-zinc-900"}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className="mt-0.5 shrink-0 transition-transform">
                              {done ? (
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                       <Check className="w-2.5 h-2.5" />
                                    </div>
                              ) : (
                                    <div className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-primary/50 transition-colors" />
                              )}
                           </div>
                           <div className="flex flex-col">
                              <span className={`text-xs font-semibold ${done ? "text-zinc-600 line-through" : "text-zinc-300 group-hover:text-white"}`}>
                                 {item.label}
                              </span>
                           </div>
                        </div>
                        {!done && <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-primary transition-colors" />}
                     </Link>
                  );
               })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
