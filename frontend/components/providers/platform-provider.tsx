"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { loadPlatformConfig, DEFAULT_CONFIG, type PlatformConfig } from "@/lib/platform-config";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Megaphone, Terminal, ShieldAlert } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface PlatformContextType {
  config: PlatformConfig;
  refreshConfig: () => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const router = useRouter();
  const pathname = usePathname();

  const refreshConfig = () => {
    setConfig(loadPlatformConfig());
  };

  useEffect(() => {
    refreshConfig(); // Hydrate safely after mount
  }, []);

  useEffect(() => {
    // Listen for config changes from settings page
    const handleUpdate = () => refreshConfig();
    window.addEventListener("mrc:config-updated", handleUpdate);
    return () => window.removeEventListener("mrc:config-updated", handleUpdate);
  }, []);

  // Effect for Maintenance Mode & Global Effects
  useEffect(() => {
    // If maintenance mode is on and we are not on the settings page (as admin) or maintenance page
    // For now, we'll just show a global overlay if it's active for non-admins
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    const isAdmin = user?.role === "admin";

    // Maintenance Mode Logic
    if (config.governance.maintenanceMode && !isAdmin && pathname !== "/maintenance") {
       // In a real app, logic would be in middleware, here we simulate with a blocking overlay
    }
  }, [config, pathname]);

  return (
    <PlatformContext.Provider value={{ config, refreshConfig }}>
      {children}
      
      {/* Global Components based on 18 Control Features */}
      
      {/* 1. Global Broadcaster (Feature 14) */}
      <AnimatePresence>
        {config.operations.broadcastActive && config.operations.broadcastMessage && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl"
          >
            <div className="bg-primary/10 backdrop-blur-md border border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Platform Broadcast</p>
                <p className="text-xs text-white/90 font-medium leading-tight">{config.operations.broadcastMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Maintenance Guard (Feature 1) */}
      <AnimatePresence>
        {config.governance.maintenanceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md space-y-6">
              <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <Terminal className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">System<span className="text-primary">.Offline</span></h2>
                <p className="text-zinc-500 text-sm leading-relaxed">{config.governance.maintenanceMessage}</p>
              </div>
              <div className="pt-4">
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Platform Security Protocol 0x1A</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Anomaly Alert (Feature 18) - Mock notification for Admin */}
      {/* (In real app, this would be a toast or sidebar notification) */}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform must be used within a PlatformProvider");
  return context;
}
