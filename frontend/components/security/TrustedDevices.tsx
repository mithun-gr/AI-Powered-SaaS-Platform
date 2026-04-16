"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MonitorSmartphone, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTrustedDevices, revokeTrustedDevice, revokeAllDevices } from "@/lib/security-client";

interface Props {
  userId: string;
  onAction?: () => void;
}

interface Device {
  fingerprint: string;
  label: string;
  ip: string;
  addedAt: number;
  lastUsed: number;
  expiresAt: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function daysLeft(ts: number): number {
  return Math.max(0, Math.ceil((ts - Date.now()) / 86400000));
}

export function TrustedDevices({ userId, onAction }: Props) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await listTrustedDevices(userId);
    setDevices(d);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (fp: string) => {
    setRevoking(fp);
    await revokeTrustedDevice(userId, fp);
    await load();
    setRevoking(null);
    onAction?.();
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    await revokeAllDevices(userId);
    await load();
    setRevokingAll(false);
    onAction?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading devices…
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MonitorSmartphone className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No trusted devices. Trust this device after 2FA login.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {devices.map((d) => (
          <motion.div
            key={d.fingerprint}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{d.label}</p>
                <p className="text-xs text-muted-foreground">
                  {d.ip} · Last used {timeAgo(d.lastUsed)} · Expires in {daysLeft(d.expiresAt)}d
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRevoke(d.fingerprint)}
              disabled={revoking === d.fingerprint}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              {revoking === d.fingerprint ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {devices.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRevokeAll}
          disabled={revokingAll}
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2"
        >
          {revokingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          Revoke All Trusted Devices
        </Button>
      )}
    </div>
  );
}
