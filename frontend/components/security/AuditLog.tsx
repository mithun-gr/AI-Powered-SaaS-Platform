"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert, ShieldCheck, LogIn, Lock, Eye, AlertTriangle } from "lucide-react";

interface Props {
  userId: string;
}

interface AuditEvent {
  id: string;
  event: string;
  ip: string;
  userAgent: string;
  timestamp: number;
  level: "info" | "warning" | "critical";
}

const EVENT_LABELS: Record<string, { icon: string; label: string }> = {
  "2FA_ENABLED":           { icon: "🛡️", label: "Two-Factor Authentication enabled" },
  "2FA_DISABLED":          { icon: "🔓", label: "Two-Factor Authentication disabled" },
  "BACKUP_CODES_GENERATED":{ icon: "🔑", label: "Backup codes generated" },
  "BACKUP_CODE_USED":      { icon: "🔑", label: "Backup code used for login" },
  "BACKUP_CODE_FAILED":    { icon: "❌", label: "Invalid backup code entered" },
  "SESSIONS_INVALIDATED":  { icon: "🚪", label: "All sessions signed out" },
  "DEVICE_TRUSTED":        { icon: "✅", label: "Device added to trusted list" },
  "DEVICE_REVOKED":        { icon: "🗑️", label: "Trusted device removed" },
  "ALL_DEVICES_REVOKED":   { icon: "⚠️", label: "All trusted devices removed" },
  "EMAIL_OTP_SENT":        { icon: "📧", label: "Recovery code sent to email" },
  "EMAIL_OTP_VERIFIED":    { icon: "✅", label: "Email recovery code verified" },
  "EMAIL_OTP_FAILED":      { icon: "❌", label: "Email recovery code failed" },
  "PASSWORD_CHANGED":      { icon: "🔐", label: "Password changed" },
};

function formatEvent(event: string): { icon: string; label: string } {
  const known = EVENT_LABELS[event];
  if (known) return known;
  // Partial match
  const key = Object.keys(EVENT_LABELS).find((k) => event.startsWith(k));
  if (key) return EVENT_LABELS[key];
  return { icon: "🔒", label: event.replace(/_/g, " ").toLowerCase() };
}

const LEVEL_COLORS: Record<string, string> = {
  info: "border-l-primary/40",
  warning: "border-l-amber-500/60",
  critical: "border-l-red-500/70",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function AuditLog({ userId }: Props) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-audit-log", userId, limit: 20 }),
      });
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading activity…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No security events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((ev, i) => {
        const { icon, label } = formatEvent(ev.event);
        return (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`flex items-start gap-3 p-3 rounded-xl bg-muted/40 border-l-4 ${LEVEL_COLORS[ev.level]} border border-border/50`}
          >
            <span className="text-lg flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium capitalize">{label}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                <span>{timeAgo(ev.timestamp)}</span>
                <span>·</span>
                <span className="font-mono">{ev.ip}</span>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
              ev.level === "critical" ? "bg-red-500/20 text-red-500" :
              ev.level === "warning" ? "bg-amber-500/20 text-amber-500" :
              "bg-primary/10 text-primary"
            }`}>
              {ev.level}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
