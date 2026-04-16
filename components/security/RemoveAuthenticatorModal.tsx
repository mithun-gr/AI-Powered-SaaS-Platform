"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onDone: () => void;
}

export function RemoveAuthenticatorModal({ onDone }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center">
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Remove from Authenticator (Optional)</p>
              <p className="text-xs text-muted-foreground">2FA has been disabled on your account</p>
            </div>
          </div>
          <button
            onClick={onDone}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              2FA disabled server-side
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Secret invalidated
            </span>
          </div>

          {/* Info box */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium">Codes will no longer work</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Morchantra entry may still appear in your authenticator app, but any codes it
              generates are now invalid. Your account is secure.
            </p>
          </div>

          {/* Optional cleanup steps */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Optional — Clean up your app
            </p>
            {[
              { icon: "1", text: "Open Google or Microsoft Authenticator" },
              { icon: "2", text: 'Find the "Morchantra Portal" entry' },
              { icon: "3", text: "Long-press → Delete / Remove account" },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/20">
                <span className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                  {icon}
                </span>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Button onClick={onDone} className="w-full gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Done
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
