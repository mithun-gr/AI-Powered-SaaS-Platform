"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ChevronLeft, Loader2, CheckCircle2, Copy, Check, RotateCcw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { totpKeyUri } from "@/lib/totp";

interface Props {
  email: string;
  secret: string;
  onSuccess: (token: string) => Promise<{ valid: boolean; error?: string }>;
  onClose: () => void;
}

export function TwoFactorSetupModal({ email, secret, onSuccess, onClose }: Props) {
  const [step, setStep]                     = useState<1 | 2>(1);
  const [digits, setDigits]                 = useState(["", "", "", "", "", ""]);
  const [error, setError]                   = useState("");
  const [verifying, setVerifying]           = useState(false);
  const [success, setSuccess]               = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [timer, setTimer]                   = useState(30);
  const inputRefs                           = useRef<(HTMLInputElement | null)[]>([]);

  // 30-second countdown
  useEffect(() => {
    if (step !== 2) return;
    setTimer(30 - (Math.floor(Date.now() / 1000) % 30));
    const id = setInterval(() => {
      const s = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTimer(s);
      if (s === 30) { setDigits(["", "", "", "", "", ""]); setError(""); inputRefs.current[0]?.focus(); }
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDigit = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    // Auto-verify when all 6 filled
    if (v && i === 5) {
      const code = [...next.slice(0, 5), v].join("");
      if (code.length === 6) handleVerify(code);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      setError("");
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code ?? digits.join("");
    if (finalCode.length !== 6 || verifying) return;
    setVerifying(true);
    setError("");
    try {
      const result = await onSuccess(finalCode);
      if (result.valid) {
        setSuccess(true);
        setTimeout(onClose, 1400);
      } else {
        setDigits(["", "", "", "", "", ""]);
        setError("Incorrect code. Check your authenticator and try again.");
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Timer ring %
  const pct = (timer / 30) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            {step === 2 && !success && (
              <button onClick={() => { setStep(1); setDigits(["","","","","",""]); setError(""); }}
                className="text-white/40 hover:text-white transition-colors mr-1">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Enable 2-Step Verification</p>
              <p className="text-xs text-white/40">
                {success ? "Setup complete" : step === 1 ? "Step 1 of 2 — Scan QR code" : "Step 2 of 2 — Verify code"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors rounded-lg p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <motion.div className="h-full bg-primary" animate={{ width: success ? "100%" : step === 1 ? "50%" : "85%" }} transition={{ duration: 0.4 }} />
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ── SUCCESS ── */}
            {success && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                  className="h-16 w-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </motion.div>
                <div>
                  <p className="font-bold text-lg text-white">2FA Enabled</p>
                  <p className="text-sm text-white/50 mt-1">Your account is now protected</p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: QR ── */}
            {!success && step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                className="space-y-5">

                {/* QR + instructions side by side */}
                <div className="flex gap-6 items-start">

                  {/* Left — QR code */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className="relative p-1.5 rounded-xl bg-white shadow-lg shadow-black/40">
                      <span className="absolute -top-0.5 -left-0.5 h-4 w-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                      <span className="absolute -bottom-0.5 -left-0.5 h-4 w-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                      <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
                      <div className="rounded-lg overflow-hidden">
                        <QRCodeSVG value={totpKeyUri(email, "Morchantra Portal", secret)} size={164} level="H" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[11px] text-white/40">Ready to scan</span>
                    </div>
                  </div>

                  {/* Right — title + numbered steps */}
                  <div className="flex-1 min-w-0 space-y-4">
                    <div>
                      <p className="font-semibold text-white text-sm mb-0.5">
                        Scan with your authenticator app
                      </p>
                      <p className="text-xs text-white/40">
                        Use Google Authenticator or Microsoft Authenticator
                      </p>
                    </div>

                    <div className="space-y-3">
                      {[
                        "Open your authenticator app",
                        "Tap + and choose \"Scan QR code\"",
                        "Point your camera at the QR code",
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm text-white/70 leading-snug">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Manual key — full width below */}
                <div className="rounded-xl border border-white/8 bg-white/5 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                      Can't scan? Enter key manually
                    </span>
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/70 transition-colors">
                      {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                    </button>
                  </div>
                  <div className="px-3 py-2.5 overflow-x-auto">
                    <p className="font-mono text-sm text-white whitespace-nowrap tracking-[0.18em] select-all">
                      {secret.match(/.{1,4}/g)?.join(" ")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => setStep(2)} className="w-full h-11 gap-2 font-semibold">
                    I've scanned it — Continue →
                  </Button>
                  <button
                    onClick={() => {
                      try { sessionStorage.removeItem("mrc_2fa_setup_secret"); } catch {}
                      onClose();
                    }}
                    className="w-full h-9 flex items-center justify-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors rounded-lg"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Set up from scratch — get a new key
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: VERIFY ── */}
            {!success && step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                className="space-y-6">

                {/* Timer ring + heading */}
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
                        className={timer <= 5 ? "text-red-500" : "text-primary"}
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums ${timer <= 5 ? "text-red-400" : "text-white"}`}>
                      {timer}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Enter the 6-digit code</p>
                    <p className="text-sm text-white/50">From your authenticator app. Code refreshes every 30s.</p>
                  </div>
                </div>

                {/* OTP boxes */}
                <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <motion.div key={i}
                      animate={d ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <input
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        autoFocus={i === 0}
                        onChange={(e) => handleDigit(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className={`h-14 w-11 rounded-xl border-2 text-center text-xl font-bold bg-white/5 text-white outline-none transition-all duration-150 ${
                          error
                            ? "border-red-500/60 bg-red-500/5"
                            : d
                            ? "border-primary bg-primary/10"
                            : "border-white/10 focus:border-primary/60 focus:bg-white/8"
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-center">
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Verify button */}
                <Button
                  onClick={() => handleVerify()}
                  disabled={digits.join("").length !== 6 || verifying}
                  className="w-full h-11 gap-2 font-semibold"
                >
                  {verifying ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</> : "Verify & Enable 2FA"}
                </Button>

                <p className="text-xs text-center text-white/30">
                  Code not matching? Make sure your phone's time is synced.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
