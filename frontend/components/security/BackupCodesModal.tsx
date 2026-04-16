"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Shield, AlertTriangle, Download, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  codes: string[];
  onClose: () => void;
}

export function BackupCodesModal({ codes, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [hidden, setHidden] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const content = [
      "MORCHANTRA — 2FA BACKUP CODES",
      "================================",
      "Keep these codes safe. Each can only be used ONCE.",
      "Store in a password manager or print and lock away.",
      "",
      ...codes.map((c, i) => `${i + 1}. ${c}`),
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "morchantra-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Your Backup Codes</h2>
              <p className="text-xs text-muted-foreground">Save these now — they won't be shown again</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-500">
              Each code can only be used <strong>once</strong>. Store them in a password manager or
              print and keep in a safe place. <strong>Do not screenshot.</strong>
            </p>
          </div>

          {/* Codes grid */}
          <div className="relative">
            <div className={`grid grid-cols-2 gap-2 transition-all ${hidden ? "blur-md select-none" : ""}`}>
              {codes.map((code, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted border border-border font-mono text-sm"
                >
                  <span className="text-muted-foreground text-xs w-4">{i + 1}.</span>
                  <span className="tracking-widest font-semibold">{code}</span>
                </div>
              ))}
            </div>
            {hidden && (
              <button
                onClick={() => setHidden(false)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 shadow-lg">
                  <EyeOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Click to reveal</span>
                </div>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1 gap-2"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy All"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHidden(!hidden)}
              className="gap-2"
            >
              <EyeOff className="h-4 w-4" />
              {hidden ? "Show" : "Hide"}
            </Button>
          </div>

          {/* Acknowledge */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setAcknowledged(!acknowledged)}
              className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                acknowledged ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary/50"
              }`}
            >
              {acknowledged && <Check className="h-3 w-3 text-white" />}
            </div>
            <p className="text-sm text-muted-foreground">
              I have saved my backup codes in a secure location
            </p>
          </label>

          <Button
            onClick={onClose}
            disabled={!acknowledged}
            className="w-full"
          >
            Done — I've saved my codes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
