"use client";
// Feature 2: Real-time Notifications Badge

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle2, AlertCircle, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const NOTIFICATIONS = [
  { id: "1", type: "update", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Request REQ-002 updated", desc: "AWS Cloud Setup is now In Progress", time: "2h ago", unread: true },
  { id: "2", type: "invoice", icon: CreditCard, color: "text-primary", bg: "bg-primary/10", title: "Invoice #INV-003 generated", desc: "₹12,000 due by 30 Jan 2026", time: "5h ago", unread: true },
  { id: "3", type: "request", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", title: "Expert assigned to REQ-001", desc: "Sarah Johnson — Legal Advisor", time: "1d ago", unread: true },
  { id: "4", type: "alert", icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10", title: "Document expiring soon", desc: "insurance_policy_2025.pdf expires in 7 days", time: "2d ago", unread: false },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [isRinging, setIsRinging] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initial fetch with safety catch
    try {
      const stored = localStorage.getItem("mrc_notifications");
      if (stored) setNotifications(JSON.parse(stored));
    } catch (e) {
      console.warn("Notification sync error");
    }

    const handleSync = () => {
      try {
        const fresh = JSON.parse(localStorage.getItem("mrc_notifications") ?? "[]");
        setNotifications(fresh);
        if (fresh.length > 0) {
          setIsRinging(true);
          setTimeout(() => setIsRinging(false), 2000);
        }
      } catch (e) {
        // Fail silently instead of crashing the UI
      }
    };

    window.addEventListener("mrc:notification", handleSync);
    const storageHandler = (e: StorageEvent) => { if (e.key === "mrc_notifications") handleSync(); };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("mrc:notification", handleSync);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const updateStorage = (data: any) => {
    setNotifications(data);
    localStorage.setItem("mrc_notifications", JSON.stringify(data));
  };

  const markAllRead = () => updateStorage(notifications.map(x => ({ ...x, unread: false })));
  const dismiss = (id: string) => updateStorage(notifications.filter(x => x.id !== id));

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(o => !o)}
        className={`relative h-9 w-9 p-0 rounded-xl transition-colors ${
          open ? "bg-zinc-800" : "hover:bg-zinc-800/80"
        }`}
      >
        <motion.div
           animate={isRinging ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
           transition={{ duration: 0.5, repeat: isRinging ? 3 : 0 }}
        >
           <Bell className={`w-4 h-4 ${unreadCount > 0 ? "text-zinc-200" : "text-zinc-400"}`} />
        </motion.div>
        {mounted && unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary rounded-full text-[9px] font-bold text-white flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute right-0 top-12 z-50 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h3 className="font-bold text-sm text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 text-sm">No notifications</div>
                ) : notifications.map(n => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors ${n.unread ? "bg-zinc-800/20" : ""}`}>
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${n.bg}`}>
                        <Icon className={`w-4 h-4 ${n.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${n.unread ? "text-white" : "text-zinc-400"}`}>{n.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{n.desc}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">{n.time}</p>
                      </div>
                      <button onClick={() => dismiss(n.id)} className="text-zinc-600 hover:text-zinc-400 shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
