"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield, User, FileText, MoveRight, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function OnboardingGate() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Only show if never dismissed and not complete
    const isDismissed = localStorage.getItem("mrc_onboard_gate_dismissed") === "true";
    const checked = JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]");
    
    if (!isDismissed && checked.length < 5) {
      // Delay slightly for dramatic loading effect
      const t = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("mrc_onboard_gate_dismissed", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={dismiss}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} 
            className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <button onClick={dismiss} className="absolute top-5 right-5 text-zinc-500 hover:text-white z-20 transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="p-8 sm:p-12 relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                 <Sparkles className="w-8 h-8 text-primary" />
              </div>
              
              <h2 className="text-3xl font-black text-white tracking-tight mb-3">Initialize Your Workspace</h2>
              <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed mb-10">
                You are about to unlock enterprise-grade capabilities. Before you deploy, configure these three critical security and identity checks.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 w-full">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-primary/50 transition-colors group cursor-pointer text-left" onClick={dismiss}>
                  <User className="w-5 h-5 text-zinc-400 group-hover:text-primary mb-3" />
                  <h4 className="font-bold text-white text-sm mb-1">1. Identity</h4>
                  <p className="text-[11px] text-zinc-500">Configure your profile details.</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-primary/50 transition-colors group cursor-pointer text-left" onClick={dismiss}>
                  <Shield className="w-5 h-5 text-zinc-400 group-hover:text-primary mb-3" />
                  <h4 className="font-bold text-white text-sm mb-1">2. Security</h4>
                  <p className="text-[11px] text-zinc-500">Activate 2FA protection.</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-primary/50 transition-colors group cursor-pointer text-left" onClick={dismiss}>
                  <FileText className="w-5 h-5 text-zinc-400 group-hover:text-primary mb-3" />
                  <h4 className="font-bold text-white text-sm mb-1">3. Sandbox</h4>
                  <p className="text-[11px] text-zinc-500">Submit test request.</p>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full pt-6 border-t border-zinc-800/80">
                 <Button onClick={dismiss} className="w-full sm:w-auto flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm gap-2">
                    Begin Configuration <MoveRight className="w-4 h-4" />
                 </Button>
                 <button onClick={dismiss} className="text-zinc-500 hover:text-white text-xs font-semibold px-4 py-3 transition-colors">
                    Skip for now
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
