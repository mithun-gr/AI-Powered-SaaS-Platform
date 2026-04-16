"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Settings2 } from "lucide-react";
import Link from "next/link";

export function FloatingSetupWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Only mount after hydration
    const dismissed = localStorage.getItem("mrc_floating_widget_dismissed") === "true";
    setIsDismissed(dismissed);
    
    const sync = () => {
      setChecked(JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]"));
    };
    sync();

    // Re-sync on storage change
    window.addEventListener("mrc:onboard-update", sync);
    const storageHandler = (e: StorageEvent) => { if (e.key === "mrc_onboard_done") sync(); };
    window.addEventListener("storage", storageHandler);
    
    return () => {
      window.removeEventListener("mrc:onboard-update", sync);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const total = 5;
  const isComplete = checked.length === total;

  if (isComplete || isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-64 rounded-2xl border border-primary/20 bg-zinc-950 shadow-[0_10px_40px_rgba(239,68,68,0.15)] overflow-hidden mb-2"
          >
            <div className="bg-primary/10 p-4 relative border-b border-zinc-800">
               <button onClick={() => setIsOpen(false)} className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
               </button>
               <h4 className="font-bold text-white text-sm">Quick Setup</h4>
               <p className="text-xs text-zinc-400 mt-1">{checked.length} of {total} completed</p>
            </div>
            
            <div className="p-2 space-y-1">
               <Link href="/settings" className="block text-xs text-zinc-300 hover:bg-zinc-900 p-2 rounded-lg transition-colors">
                 Complete Profile Profile
               </Link>
               <Link href="/requests/new" className="block text-xs text-zinc-300 hover:bg-zinc-900 p-2 rounded-lg transition-colors">
                 Submit First Request
               </Link>
               <Link href="/settings" className="block text-xs text-zinc-300 hover:bg-zinc-900 p-2 rounded-lg transition-colors">
                 Enable 2FA
               </Link>
               <div className="border-t border-zinc-800/50 mt-1 pt-1">
                  <button 
                     onClick={() => {
                        setIsDismissed(true);
                        localStorage.setItem("mrc_floating_widget_dismissed", "true");
                     }} 
                     className="w-full text-left text-[10px] text-zinc-600 hover:text-zinc-400 p-2 uppercase tracking-widest font-bold"
                  >
                     Hide Widget
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl flex items-center justify-center text-white hover:border-primary/50 hover:bg-zinc-800 transition-all group"
      >
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] font-black flex items-center justify-center border-2 border-zinc-950">
           {total - checked.length}
        </span>
        {isOpen ? <X className="w-5 h-5 text-zinc-400" /> : <Settings2 className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />}
      </motion.button>
    </div>
  );
}
