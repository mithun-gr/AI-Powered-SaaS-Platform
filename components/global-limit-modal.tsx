"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, ArrowRight, X, AlertOctagon, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type LimitType = "requests" | "storage" | "ai";

export function fireLimitModal(type: LimitType, planLabel: string, limitVal: number | string) {
  window.dispatchEvent(
    new CustomEvent("mrc:limit-reached", {
      detail: { type, planLabel, limitVal },
    })
  );
}

export function GlobalLimitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<{ type: LimitType; planLabel: string; limitVal: number | string } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setData(detail);
      setIsOpen(true);
    };
    window.addEventListener("mrc:limit-reached", handler);
    return () => window.removeEventListener("mrc:limit-reached", handler);
  }, []);

  if (!isOpen || !data) return null;

  const contentMap = {
    requests: {
      title: "Request Limit Reached",
      desc: `You've used all ${data.limitVal} requests included in your ${data.planLabel} plan.`,
      icon: <AlertOctagon className="w-12 h-12 text-red-500" />,
      color: "bg-red-500",
    },
    storage: {
      title: "Storage Full",
      desc: `You've hit your ${data.limitVal}GB storage limit on the ${data.planLabel} plan.`,
      icon: <Zap className="w-12 h-12 text-blue-500" />,
      color: "bg-blue-500",
    },
    ai: {
      title: "AI Generations Exhausted",
      desc: `Your plan allows ${data.limitVal} AI generations per cycle. You're out of credits!`,
      icon: <Crown className="w-12 h-12 text-violet-500" />,
      color: "bg-violet-500",
    },
  };

  const config = contentMap[data.type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-1">
            <div className={`h-full w-full ${config.color}`} />
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-6 top-6 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center mt-4">
            <div className={`mb-6 p-4 rounded-3xl bg-zinc-900 border border-zinc-800`}>
              {config.icon}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              {config.title}
            </h2>
            
            <p className="text-zinc-400 mb-8 leading-relaxed">
              {config.desc} Upgrade now to uncap your limits and keep your workflow moving without interruption.
            </p>

            <Link href="/payments" className="w-full">
              <Button 
                onClick={() => setIsOpen(false)}
                className="w-full h-14 text-[15px] font-bold rounded-2xl bg-primary hover:bg-primary/90 group"
              >
                Upgrade to Premium
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="mt-6 text-sm font-semibold text-zinc-500 hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
