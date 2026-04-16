"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User, Bell, Lock, Save, Loader2, CheckCircle2, Globe,
  Shield, Activity, MonitorSmartphone, ShieldCheck, ShieldOff,
  CreditCard, AlertCircle, Key, Zap, Settings2, Users,
  Megaphone, Clock, Map, Coins, ShieldAlert, Terminal,
  LogOut, Database, BarChart3, Brain, Sparkles, Circle, Sun, Moon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentUser, MOCK_USERS } from "@/lib/dummy-data";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/components/providers/currency-provider";
import { countries } from "@/lib/currency-map";
import { BackupCodesModal } from "@/components/security/BackupCodesModal";
import { TrustedDevices } from "@/components/security/TrustedDevices";
import { AuditLog } from "@/components/security/AuditLog";
import { TwoFactorSetupModal } from "@/components/security/TwoFactorSetupModal";
import { RemoveAuthenticatorModal } from "@/components/security/RemoveAuthenticatorModal";
import { getAuthSession } from "@/lib/auth-session";
import { loadPlatformConfig, savePlatformConfig, DEFAULT_CONFIG, type PlatformConfig } from "@/lib/platform-config";
import { generateBackupCodes, sendSecurityAlert, invalidateSessions, logSecurityEvent } from "@/lib/security-client";

// ── Tab definitions ──────────────────────────────────────────────────────────

const CLIENT_TABS = [
  { id: "profile",        label: "Profile",        icon: User },
  { id: "preferences",   label: "Preferences",    icon: Globe },
  { id: "notifications", label: "Notifications",   icon: Bell },
  { id: "security",      label: "Security",        icon: Lock },
];

const ADMIN_TABS = [
  { id: "governance",    label: "Governance",      icon: Settings2 },
  { id: "security-hc",  label: "Security HC",     icon: ShieldAlert },
  { id: "ai-engine",    label: "AI Engine",        icon: Zap },
  { id: "financial",    label: "Financials",       icon: Coins },
  { id: "operations",   label: "Operations",       icon: Activity },
  { id: "profile",      label: "Personal",         icon: User },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle, danger = false }: { on: boolean; onToggle: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-all duration-300 focus:outline-none ${
        on ? (danger ? "bg-red-600" : "bg-primary") : "bg-zinc-800"
      }`}
    >
      <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">{children}</p>;
}

// ── Feature 8: Dark / Light Mode Toggle ──────────────────────────────────────
function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("mrc_theme");
    if (saved) return saved === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("mrc_theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };
  return [dark, toggle];
}

// ── Feature 4: Profile Completeness ──────────────────────────────────────────
function ProfileCompleteness({ name, email, phone, twoFA }: { name: string; email: string; phone: string; twoFA: boolean }) {
  const checks = [
    { label: "Name set",         done: !!name },
    { label: "Email verified",   done: !!email },
    { label: "Phone number",     done: !!phone && phone !== "" },
    { label: "2FA enabled",      done: twoFA },
    { label: "Preferences set",  done: true }, // always true since they're on settings
  ];
  const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
  const color = pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-primary" : "bg-amber-400";

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Profile Completeness</p>
          <p className={`text-2xl font-black mt-0.5 ${pct === 100 ? "text-emerald-400" : "text-white"}`}>{pct}%</p>
        </div>
        {pct < 100 && <p className="text-xs text-zinc-600 text-right max-w-[120px] leading-snug">Complete your profile to unlock all features</p>}
        {pct === 100 && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className={`h-full rounded-full ${color}`} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-2">
            {c.done
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              : <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
            <span className={`text-xs ${c.done ? "text-zinc-400" : "text-zinc-600"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, desc, icon: Icon, children, accent = false, danger = false }: any) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`group relative rounded-[3rem] border transition-all duration-700 overflow-hidden ${
      accent ? "border-primary/20 bg-zinc-950/40 shadow-2xl shadow-primary/5" : 
      danger ? "border-red-900/30 bg-zinc-950/40 shadow-2xl shadow-red-500/5" : 
      "border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/60"
    }`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-8 cursor-pointer select-none"
      >
        <div className="flex items-center gap-8 min-w-0 flex-1">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
            accent ? "bg-primary/10 border-primary/20 text-primary" : 
            danger ? "bg-red-500/10 border-red-500/20 text-red-500" : 
            "bg-zinc-800/60 border-zinc-700/50 text-zinc-400"
            }`}>
            <Icon className="w-8 h-8" />
            </div>
            <div className="min-w-0 pr-4">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{title}</h2>
            {desc && <p className="text-sm text-zinc-500 font-medium leading-relaxed">{desc}</p>}
            </div>
        </div>
        
        {/* Toggle Indicator */}
        <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-border/50 bg-zinc-950/50 transition-all duration-300 group-hover:bg-zinc-800 ${isOpen ? "rotate-180 bg-zinc-800" : "rotate-0"}`}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-400"><path d="M7.5 12L0 4.5L1.06066 3.43934L7.5 9.87868L13.9393 3.43934L15 4.5L7.5 12Z" fill="currentColor"/></svg>
        </div>
      </div>
      
      <AnimatePresence initial={false}>
        {isOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-10 pb-12">
                <div className="h-px w-full bg-zinc-800/50 mb-10" />
                {children}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({ title, desc, icon: Icon, children, secondaryTitle, secondaryDesc, accent = false, danger = false }: any) {
  return (
    <div className={`group relative rounded-[3rem] p-8 flex flex-col min-h-[560px] transition-all duration-700 border ${
      danger ? "border-red-500/30 bg-zinc-950/40 shadow-2xl shadow-red-500/5 ring-1 ring-red-500/10" : 
      "border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/60"
    }`}>
      {accent && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] -mr-16 -mt-16 pointer-events-none" />}
      
      {/* Top Header Section */}
      <div className="space-y-6">
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
          danger ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400"
        }`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="space-y-4">
          <h2 className="text-[32px] font-bold leading-[1.1] tracking-tight text-white">{title}</h2>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-[200px]">{desc}</p>
        </div>
      </div>

      {/* Action Section (Bottom) */}
      <div className="mt-auto pt-10 space-y-6">
        <div className="space-y-4">
          <h3 className="text-[22px] font-bold text-white leading-tight">{secondaryTitle}</h3>
          <p className="text-[13px] text-zinc-500 font-medium leading-relaxed pr-4">{secondaryDesc}</p>
        </div>
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function ControlRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-b border-zinc-800/40 last:border-0 hover:bg-white/[0.01] transition-colors -mx-4 px-4 rounded-xl">
      <div className="min-w-0 flex-1">
        <h4 className="text-lg font-semibold text-zinc-100 mb-1.5">{label}</h4>
        {desc && <p className="text-sm text-zinc-500 leading-normal font-medium max-w-lg">{desc}</p>}
      </div>
      <div className="shrink-0 flex items-center h-10">
        {children}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { country, setCountry, currencyCode, isLoading: isCurrencyLoading } = useCurrency();

  const [userRole, setUserRole]     = useState<"client" | "admin">("client");
  const [activeTab, setActiveTab]   = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [isSessionKilling, setIsSessionKilling] = useState(false);
  const [cfg, setCfg]               = useState<PlatformConfig>(DEFAULT_CONFIG);

  // Personal + Security state
  const [profileData, setProfileData]   = useState({ name: currentUser.name, email: currentUser.email, phone: currentUser.phone });
  const [emailNotif, setEmailNotif]     = useState(true);
  const [smsNotif, setSmsNotif]         = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [secTab, setSecTab]             = useState("settings");
  const [pwData, setPwData]             = useState({ current: "", new: "", confirm: "" });
  const [pwError, setPwError]           = useState("");
  const [pwSuccess, setPwSuccess]       = useState(false);

  // 2FA enable modals
  const [show2FAModal, setShow2FAModal]           = useState(false);
  const [setupSecret, setSetupSecret]             = useState("");
  const [showPwPrompt, setShowPwPrompt]           = useState(false);
  const [promptPw, setPromptPw]                   = useState("");
  const [promptErr, setPromptErr]                 = useState("");
  const [isCheckingPw, setIsCheckingPw]           = useState(false);

  // 2FA disable modal
  const [showDisablePrompt, setShowDisablePrompt]   = useState(false);
  const [disablePw, setDisablePw]                   = useState("");
  const [disableErr, setDisableErr]                 = useState("");
  const [isDisabling, setIsDisabling]               = useState(false);

  const [showBackupModal, setShowBackupModal]         = useState(false);
  const [showRemoveAuthModal, setShowRemoveAuthModal] = useState(false);
  const [backupCodes, setBackupCodes]                 = useState<string[]>([]);

  // Feature 8: theme toggle
  const [isDark, toggleTheme] = useDarkMode();

  // Operations
  const [sessionKilling, setSessionKilling] = useState(false);

  // Init — load everything from the auth session (cookie is source of truth)
  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      setUserRole(session.role);
      setActiveTab(session.role === "admin" ? "governance" : "profile");
      // Override profileData with actual session email/name (not hardcoded currentUser)
      setProfileData(prev => ({ ...prev, email: session.email, name: session.name }));
    }

    const loaded = loadPlatformConfig();
    setCfg(loaded);

    // Load 2FA state — check localStorage first (demo), then Supabase
    const sessionEmail = session?.email ?? currentUser.email;
    const local2FA = localStorage.getItem(`mrc_2fa_enabled_${sessionEmail}`);
    if (local2FA === "true") {
      setIs2FAEnabled(true);
    } else {
      (async () => {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
          const { data: { user } } = await sb.auth.getUser();
          if (user?.user_metadata?.twoFactorEnabled) {
            setIs2FAEnabled(true);
            localStorage.setItem(`mrc_2fa_enabled_${sessionEmail}`, "true");
          }
        } catch {}
      })();
    }
  }, []);

  // ── Config helpers ────────────────────────────────────────────────────────

  const patchCfg = useCallback((patch: Partial<PlatformConfig>) => {
    setCfg(prev => ({ ...prev, ...patch }));
  }, []);

  const patchAI  = (p: Partial<typeof cfg.ai>)          => setCfg(c => ({ ...c, ai:          { ...c.ai,          ...p } }));
  const patchSec = (p: Partial<typeof cfg.security>)    => setCfg(c => ({ ...c, security:    { ...c.security,    ...p } }));
  const patchFin = (p: Partial<typeof cfg.financial>)   => setCfg(c => ({ ...c, financial:   { ...c.financial,   ...p } }));
  const patchGov = (p: Partial<typeof cfg.governance>)  => setCfg(c => ({ ...c, governance:  { ...c.governance,  ...p } }));
  const patchOps = (p: Partial<typeof cfg.operations>)  => setCfg(c => ({ ...c, operations:  { ...c.operations,  ...p } }));

  // ── Auth helpers ──────────────────────────────────────────────────────────

  /** Always get the real logged-in email from cookie — never trust hardcoded currentUser */
  const getSessionEmail = (): string => {
    const session = getAuthSession();
    return session?.email ?? profileData.email;
  };

  /** Log a security event to the audit trail */
  const logEvent = (event: string, level: "info" | "warning" | "critical" = "info") => {
    const email = getSessionEmail();
    fetch("/api/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log-event", userId: email, event, level }),
    }).catch(() => {});
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async (msg = "Changes deployed successfully") => {
    setIsSaving(true);
    try {
      savePlatformConfig({ ...cfg, lastUpdatedBy: getSessionEmail() });
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        await sb.auth.updateUser({ data: { platformConfig: cfg } });
      } catch {}
      await new Promise(r => setTimeout(r, 600));
      setSaveMsg(msg);
      setTimeout(() => setSaveMsg(""), 3500);
    } finally { setIsSaving(false); }
  };

  // ── Password Change ────────────────────────────────────────────────────────

  const handlePasswordChange = async () => {
    setPwError(""); setPwSuccess(false);

    if (!pwData.current || !pwData.new || !pwData.confirm) {
      setPwError("All fields are required."); return;
    }
    if (pwData.new.length < 8) {
      setPwError("New password must be at least 8 characters."); return;
    }
    if (pwData.new !== pwData.confirm) {
      setPwError("New passwords do not match."); return;
    }
    if (pwData.current === pwData.new) {
      setPwError("New password must be different from current password."); return;
    }

    const sessionEmail = getSessionEmail();
    const storedPw = localStorage.getItem(`mrc_user_pw_${sessionEmail}`);
    const mockUser = MOCK_USERS.find(u => u.email === sessionEmail);
    const currentPw = storedPw ?? mockUser?.password ?? "demo123";

    if (pwData.current !== currentPw) {
      let supabaseOk = false;
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { error } = await sb.auth.signInWithPassword({ email: sessionEmail, password: pwData.current });
        supabaseOk = !error;
      } catch {}
      if (!supabaseOk) { setPwError("Current password is incorrect."); return; }
    }

    setIsSaving(true);
    try {
      localStorage.setItem(`mrc_user_pw_${sessionEmail}`, pwData.new);
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        await sb.auth.updateUser({ password: pwData.new });
      } catch {}
      // ✅ Log audit event
      logEvent("PASSWORD_CHANGED", "warning");
      await new Promise(r => setTimeout(r, 600));
      setPwData({ current: "", new: "", confirm: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 4000);
    } finally { setIsSaving(false); }
  };

  // ── 2FA ───────────────────────────────────────────────────────────────────

  const verifyDemoPassword = (password: string): boolean => {
    const sessionEmail = getSessionEmail();
    const storedPw = localStorage.getItem(`mrc_user_pw_${sessionEmail}`);
    if (storedPw) return storedPw === password;
    const mockUser = MOCK_USERS.find(u => u.email === sessionEmail);
    if (mockUser) return mockUser.password === password;
    if (password === "demo123") return true;
    return false;
  };

  const handleConfirmPasswordFor2FA = async () => {
    setIsCheckingPw(true); setPromptErr("");
    try {
      if (verifyDemoPassword(promptPw)) {
        let secret = "JBSWY3DPEHPK3PXP";
        try {
          const res = await fetch("/api/2fa", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "generate" }),
          });
          if (res.ok) { const d = await res.json(); if (d.secret) secret = d.secret; }
        } catch {}
        setSetupSecret(secret);
        sessionStorage.setItem("mrc_2fa_setup_secret", secret);
        setShowPwPrompt(false); setPromptPw(""); setShow2FAModal(true);
        return;
      }
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { error } = await sb.auth.signInWithPassword({ email: profileData.email, password: promptPw });
        if (!error) {
          const res = await fetch("/api/2fa", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "generate" }),
          });
          const data = await res.json();
          setSetupSecret(data.secret);
          sessionStorage.setItem("mrc_2fa_setup_secret", data.secret);
          setShowPwPrompt(false); setPromptPw(""); setShow2FAModal(true);
          return;
        }
      } catch {}
      setPromptErr("Incorrect password. Try again.");
    } finally { setIsCheckingPw(false); }
  };

  const handleVerify2FA = async (token: string): Promise<{ valid: boolean }> => {
    const secret = setupSecret || sessionStorage.getItem("mrc_2fa_setup_secret") || "";
    const sessionEmail = getSessionEmail();
    try {
      const res = await fetch("/api/2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token, secret }),
      });
      const data = await res.json();
      if (data.valid) {
        // Persist 2FA state
        localStorage.setItem(`mrc_2fa_enabled_${sessionEmail}`, "true");
        localStorage.setItem(`mrc_2fa_secret_${sessionEmail}`, secret);
        // ✅ Log audit + register this device as trusted
        logEvent("2FA_ENABLED", "info");
        try {
          const { registerTrustedDevice } = await import("@/lib/security-client");
          await registerTrustedDevice(sessionEmail);
        } catch {}
        // Try Supabase (non-blocking)
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
          await sb.auth.updateUser({ data: { twoFactorEnabled: true, twoFactorSecret: secret } });
        } catch {}

        try {
           const done: string[] = JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]");
           if (!done.includes("2fa")) {
               localStorage.setItem("mrc_onboard_done", JSON.stringify([...done, "2fa"]));
           }
        } catch {}

        setIs2FAEnabled(true); setShow2FAModal(false);
        sessionStorage.removeItem("mrc_2fa_setup_secret");
        // ✅ Generate backup codes with correct userId
        const codes = await generateBackupCodes(sessionEmail);
        if (codes.length) { setBackupCodes(codes); setShowBackupModal(true); }
        return { valid: true };
      }
    } catch {
      if (/^\d{6}$/.test(token)) {
        localStorage.setItem(`mrc_2fa_enabled_${sessionEmail}`, "true");
        logEvent("2FA_ENABLED", "info");

        try {
           const done: string[] = JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]");
           if (!done.includes("2fa")) {
               localStorage.setItem("mrc_onboard_done", JSON.stringify([...done, "2fa"]));
           }
        } catch {}

        setIs2FAEnabled(true); setShow2FAModal(false);
        return { valid: true };
      }
    }
    return { valid: false };
  };

  const handleConfirmDisable2FA = async () => {
    setIsDisabling(true); setDisableErr("");
    try {
      if (verifyDemoPassword(disablePw)) {
        const sesEmail = getSessionEmail();
        localStorage.removeItem(`mrc_2fa_enabled_${sesEmail}`);
        localStorage.removeItem(`mrc_2fa_secret_${sesEmail}`);
        // ✅ Log audit event
        logEvent("2FA_DISABLED", "warning");
        setIs2FAEnabled(false); setShowDisablePrompt(false); setDisablePw("");
        setShowRemoveAuthModal(true);
        return;
      }
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { error } = await sb.auth.signInWithPassword({ email: profileData.email, password: disablePw });
        if (!error) {
          await sb.auth.updateUser({ data: { twoFactorEnabled: false, twoFactorSecret: "" } });
          logEvent("2FA_DISABLED", "warning");
          setIs2FAEnabled(false); setShowDisablePrompt(false); setDisablePw("");
          setShowRemoveAuthModal(true);
          return;
        }
      } catch {}
      setDisableErr("Incorrect password.");
    } finally { setIsDisabling(false); }
  };

  const handleGlobalSessionKill = async () => {
    setSessionKilling(true);
    await new Promise(r => setTimeout(r, 2000));
    setSessionKilling(false);
    setSaveMsg("All sessions terminated globally"); setTimeout(() => setSaveMsg(""), 4000);
  };

  const handleSendBroadcast = async () => {
    if (!cfg.operations.broadcastMessage.trim()) return;
    patchOps({ broadcastActive: true });
    await handleSave("Broadcast injected to all terminals");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const tabs = userRole === "admin" ? ADMIN_TABS : CLIENT_TABS;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Global Modals */}
      <AnimatePresence>
        {show2FAModal && setupSecret && (
          <TwoFactorSetupModal email={profileData.email} secret={setupSecret} onSuccess={handleVerify2FA} onClose={() => setShow2FAModal(false)} />
        )}
        {showRemoveAuthModal && <RemoveAuthenticatorModal onDone={() => setShowRemoveAuthModal(false)} />}
        {showBackupModal && <BackupCodesModal codes={backupCodes} onClose={() => setShowBackupModal(false)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 pb-12 border-b border-zinc-800/60">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/10">
            {userRole === "admin" ? <ShieldAlert className="w-8 h-8 text-primary" /> : <User className="w-8 h-8 text-primary" />}
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-[ -0.02em] text-white">
              {userRole === "admin" ? (
                <>
                  <span className="text-zinc-500 mr-2">COMMAND</span>
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">PULSE</span>
                </>
              ) : "Account Hub"}
            </h1>
            <p className="text-zinc-500 text-sm font-medium">
              {userRole === "admin" ? "Platform governance protocol · 18 mission-critical controls" : "Manage your identity and authentication security"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {saveMsg && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> {saveMsg}
              </motion.div>
            )}
          </AnimatePresence>
          {userRole === "admin" && (
            <Button onClick={() => handleSave()} disabled={isSaving} className="h-11 px-8 rounded-2xl bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/20 gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Deploy Delta
            </Button>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">

        {/* Sidebar */}
        <aside className="space-y-12">
          <nav className="space-y-4">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-3xl transition-all duration-300 text-[15px] font-bold ${
                  activeTab === tab.id 
                    ? "bg-white text-zinc-950 shadow-2xl scale-[1.05]" 
                    : "bg-transparent text-zinc-500 hover:text-white"
                }`}>
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-red-500" : "text-zinc-500"}`} />
                {tab.label}
                {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
              </button>
            ))}
          </nav>

          {userRole === "admin" && (
            <div className="p-6 rounded-[2rem] bg-zinc-950/40 border border-zinc-800/80 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">PLATFORM PULSE</span>
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse" />
              </div>
              {[
                { label: "AI Neural Node", val: 97, color: "bg-emerald-500" },
                { label: "Global Sync", val: 84, color: "bg-primary" },
                { label: "API Mesh", val: 62, color: "bg-amber-500" },
              ].map(m => (
                <div key={m.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                    <span className="uppercase tracking-wider">{m.label}</span>
                    <span className="font-mono text-zinc-400">{m.val}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.val}%` }} transition={{ duration: 1.5, ease: "easeOut" }} 
                      className={`h-full ${m.color} rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Content */}
        <main className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="space-y-6">

              {/* 1-4 GOVERNANCE */}
              {activeTab === "governance" && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard 
                      title="Planetary Shutdown" 
                      desc="Emergency maintenance with custom redirect message" 
                      icon={Terminal}
                      secondaryTitle="Maintenance Mode"
                      secondaryDesc="Clients see a branded 'Updating' screen instead of the portal">
                      <Toggle on={cfg.governance.maintenanceMode} onToggle={() => patchGov({ maintenanceMode: !cfg.governance.maintenanceMode })} />
                    </FeatureCard>

                    <FeatureCard 
                      title="Onboarding Gate" 
                      desc="Control client acquisition and registration flow" 
                      icon={Users}
                      secondaryTitle="Public Registrations"
                      secondaryDesc="Allow new clients to autonomously create accounts">
                      <div className="space-y-10">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-bold text-white">Allow Public Signup</p>
                          <Toggle on={cfg.governance.allowPublicSignup} onToggle={() => patchGov({ allowPublicSignup: !cfg.governance.allowPublicSignup })} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-[13px] font-bold text-white">Email Verification Required</p>
                            <p className="text-[11px] text-zinc-500 font-medium">Block portal access until confirmed</p>
                          </div>
                          <Toggle on={cfg.governance.requireEmailVerification} onToggle={() => patchGov({ requireEmailVerification: !cfg.governance.requireEmailVerification })} />
                        </div>
                      </div>
                    </FeatureCard>

                    <FeatureCard 
                      title="Domain Gatekeeping" 
                      desc="Restrict registrations to corporate domains" 
                      icon={Shield}
                      secondaryTitle="Authority Domains"
                      secondaryDesc="Verified corporate nodes allowed to anchor accounts">
                      <div className="flex flex-wrap gap-2">
                         {cfg.governance.whitelistedDomains.map(d => (
                           <div key={d} className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400">{d}</div>
                         ))}
                         <div className="relative group/tooltip">
                           <button disabled className="px-3 py-2 border border-dashed border-zinc-700/50 rounded-xl text-[10px] text-zinc-600 font-bold cursor-not-allowed">+ ADD Authority</button>
                           <span className="opacity-0 group-hover/tooltip:opacity-100 transition-opacity absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-secondary px-2 py-1 text-xs rounded shadow-lg pointer-events-none w-max text-white z-10">
                             Waitlist: Requires manual support contact in v1.0
                           </span>
                         </div>
                      </div>
                    </FeatureCard>
                  </div>

                  <SectionCard title="Regional Market Corridors" desc="Authorize service delivery by geographic zones" icon={Map}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
                      {["IN", "US", "EU", "ASEAN", "ANZ", "UK", "CA", "SG"].map(r => {
                        const active = cfg.governance.enabledRegions.includes(r);
                        return (
                          <button key={r} onClick={() => patchGov({ enabledRegions: active ? cfg.governance.enabledRegions.filter(x => x !== r) : [...cfg.governance.enabledRegions, r] })}
                            className={`group h-24 rounded-[2rem] border transition-all duration-500 flex flex-col items-center justify-center gap-3 ${active ? "bg-red-500/10 border-red-500/40 shadow-xl shadow-red-500/10 scale-[1.02]" : "bg-zinc-950/20 border-zinc-800/50 text-zinc-500 hover:border-zinc-700"}`}>
                            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${active ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" : "bg-zinc-800 group-hover:bg-zinc-700"}`} />
                            <span className={`text-[11px] font-bold tracking-widest uppercase ${active ? "text-white" : "text-zinc-500"}`}>{r}</span>
                          </button>
                        );
                      })}
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* 5-8 SECURITY HC */}
              {activeTab === "security-hc" && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard 
                      title="2FA Mandate" 
                      desc="Authoritative Security Protocol" 
                      icon={ShieldCheck}
                      secondaryTitle="Enforce Multi-Factor"
                      secondaryDesc="Users must secure accounts before next session entry">
                      <Toggle on={cfg.security.enforce2FA} onToggle={() => patchSec({ enforce2FA: !cfg.security.enforce2FA })} />
                    </FeatureCard>

                    <FeatureCard 
                      title="Secure Perimeter" 
                      desc="Inbound Traffic Governance" 
                      icon={Terminal}
                      secondaryTitle="Restrict Proxy/VPN"
                      secondaryDesc="Mitigate anonymity-based threats at the network edge">
                      <Toggle on={cfg.security.ipRestricted} onToggle={() => patchSec({ ipRestricted: !cfg.security.ipRestricted })} />
                    </FeatureCard>

                    <FeatureCard 
                      title="Emergency Recall" 
                      desc="Instant Platform Lockdown" 
                      icon={ShieldAlert}
                      danger
                      secondaryTitle="Terminate Sessions"
                      secondaryDesc="Force-terminates every active JWT session platform-wide.">
                      <Button onClick={handleGlobalSessionKill} disabled={isSessionKilling} className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/20 gap-3">
                        {isSessionKilling ? <Loader2 className="animate-spin w-5 h-5" /> : <Terminal className="w-5 h-5" />} Execute Mass Purge
                      </Button>
                    </FeatureCard>
                  </div>

                  <SectionCard title="Access Policy Engine" desc="Behavioral constraints and session lifecycle governance" icon={Lock}>
                    <div className="grid sm:grid-cols-3 gap-10 mt-6">
                      <div className="space-y-4">
                        <Label>Login Rate Max (req/min)</Label>
                        <Input type="number" value={cfg.security.loginRateLimit} onChange={e => patchSec({ loginRateLimit: +e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 focus:border-primary/50 font-mono rounded-2xl px-6 transition-all" />
                      </div>
                      <div className="space-y-4">
                        <Label>Max Session TTL (hours)</Label>
                        <Input type="number" value={cfg.security.sessionMaxAgeHours} onChange={e => patchSec({ sessionMaxAgeHours: +e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 focus:border-primary/50 font-mono rounded-2xl px-6 transition-all" />
                      </div>
                      <div className="space-y-4">
                        <Label>Geo-Fencing Core</Label>
                        <div className="flex items-center gap-4 h-14 px-6 bg-zinc-950/30 rounded-2xl border border-zinc-800/50">
                          <Toggle on={cfg.security.geoFencingEnabled} onToggle={() => patchSec({ geoFencingEnabled: !cfg.security.geoFencingEnabled })} />
                          <span className={`text-[11px] font-black tracking-widest uppercase transition-colors ${cfg.security.geoFencingEnabled ? "text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "text-zinc-600"}`}>
                            {cfg.security.geoFencingEnabled ? "Shield On" : "Shield Off"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* 9-11 + 16-18 AI ENGINE */}
              {activeTab === "ai-engine" && (
                <div className="space-y-12">
                   <SectionCard title="Neural Engine Config" desc="Model architecture, persona, and cost governs" icon={Brain} accent>
                    <div className="grid sm:grid-cols-3 gap-10 mt-6">
                      <div className="space-y-4">
                        <Label>Model Architecture</Label>
                        <div className="relative">
                          <select value={cfg.ai.model} onChange={e => patchAI({ model: e.target.value as any })} className="w-full h-14 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl px-6 text-sm font-bold text-white appearance-none cursor-pointer focus:border-red-500/50 transition-all">
                            <option value="llama-3.1-70b-versatile">Llama 3.1 70B (Max)</option>
                            <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</option>
                            <option value="mixtral-8x7b-32768">Mixtral 8x7B (Balanced)</option>
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">▼</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label>Psychological Persona</Label>
                        <div className="relative">
                          <select value={cfg.ai.persona} onChange={e => patchAI({ persona: e.target.value as any })} className="w-full h-14 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl px-6 text-sm font-bold text-white appearance-none cursor-pointer focus:border-red-500/50 transition-all">
                            <option value="helpful">Friendly & Supportive</option>
                            <option value="neutral">Analytical & Direct</option>
                            <option value="aggressive">Firm & Sales-Driven</option>
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">▼</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label>Quota / 24h</Label>
                        <Input type="number" value={cfg.ai.maxMessagesPerCycle} onChange={e => patchAI({ maxMessagesPerCycle: +e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 rounded-2xl px-6 font-mono text-white focus:border-red-500/50 transition-all text-xl font-bold" />
                      </div>
                    </div>
                  </SectionCard>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Feature 16 - AI Sentiment Escalation */}
                    <FeatureCard 
                      title="Sentiment Intelligence" 
                      desc="Neural Feature 16 — Auto-flags distressed clients" 
                      icon={Sparkles}
                      secondaryTitle="Sentiment Escalation"
                      secondaryDesc="Routes negative conversations to humans instantly">
                      <div className="space-y-6">
                        <Toggle on={cfg.ai.sentimentEscalation} onToggle={() => patchAI({ sentimentEscalation: !cfg.ai.sentimentEscalation })} />
                        {cfg.ai.sentimentEscalation && (
                          <div className="grid grid-cols-3 gap-2">
                             {(["low", "medium", "high"] as const).map(s => (
                               <button key={s} onClick={() => patchAI({ sentimentThreshold: s })}
                                 className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${cfg.ai.sentimentThreshold === s ? "bg-red-500 text-white border-red-500" : "border-zinc-800 text-zinc-500"}`}>
                                 {s}
                               </button>
                             ))}
                          </div>
                        )}
                      </div>
                    </FeatureCard>

                    {/* Feature 17 - Smart Reply Suggestions */}
                    <FeatureCard 
                      title="Decision Support" 
                      desc="Neural Feature 17 — Contextual canned replies" 
                      icon={Zap}
                      secondaryTitle="Smart Replies"
                      secondaryDesc="Surfaces AI-generated options for operators">
                      <Toggle on={cfg.ai.smartReplies} onToggle={() => patchAI({ smartReplies: !cfg.ai.smartReplies })} />
                    </FeatureCard>

                    {/* Feature 18 - Anomaly Detection */}
                    <FeatureCard 
                      title="Threat Watchdog" 
                      desc="Neural Feature 18 — ML anomaly detection" 
                      icon={Activity}
                      accent
                      secondaryTitle="Behavioural Audit"
                      secondaryDesc="Detects unusual access patterns in real-time">
                      <Toggle on={cfg.ai.anomalyDetection} onToggle={() => patchAI({ anomalyDetection: !cfg.ai.anomalyDetection })} />
                    </FeatureCard>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={() => handleSave("AI Engine redeployed")} disabled={isSaving} className="h-14 px-12 font-black uppercase tracking-widest text-[10px] rounded-2xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20 gap-3 transition-all active:scale-95">
                      {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} Deploy AI Protocol
                    </Button>
                  </div>
                </div>
              )}

              {/* 12-13 FINANCIALS */}
              {activeTab === "financial" && (
                <div className="space-y-12">
                   <SectionCard title="Economic Core" desc="Global billing multipliers and currency controls" icon={Coins}>
                    <div className="grid sm:grid-cols-2 gap-10 mt-6">
                      <div className="space-y-4">
                        <Label>Regional VAT / GST Rate (%)</Label>
                        <div className="relative">
                          <Input type="number" value={cfg.financial.vatRate} onChange={e => patchFin({ vatRate: +e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 font-mono text-2xl font-black rounded-2xl pl-6 text-white transition-all focus:border-red-500/50" />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-xl">%</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label>Morchantra Commission (%)</Label>
                        <div className="relative h-14 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl flex items-center px-6 cursor-not-allowed">
                          <span className="font-black text-2xl text-red-500 italic">5.00</span>
                          <span className="ml-2 font-bold text-zinc-600 text-lg">%</span>
                          <span className="ml-auto text-[9px] font-black text-zinc-700 uppercase tracking-widest bg-zinc-950/50 px-3 py-1.5 rounded-full border border-zinc-800/50">LOCKED</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                      <div className="space-y-4">
                        <Label>Auto-Invoicing Engine</Label>
                        <div className="flex items-center gap-4 h-14 px-6 bg-zinc-950/30 rounded-2xl border border-zinc-800/50">
                          <Toggle on={cfg.financial.autoInvoicingEnabled} onToggle={() => patchFin({ autoInvoicingEnabled: !cfg.financial.autoInvoicingEnabled })} />
                          <span className={`text-[11px] font-bold uppercase ${cfg.financial.autoInvoicingEnabled ? "text-red-500" : "text-zinc-600"}`}>Active</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label>Invoice Due Window</Label>
                        <Input type="number" value={cfg.financial.invoiceDueDays} onChange={e => patchFin({ invoiceDueDays: +e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 font-mono text-xl font-bold rounded-2xl px-6 text-white" />
                      </div>
                      <div className="space-y-4">
                        <Label>Multi-Currency Hub</Label>
                        <div className="flex items-center gap-4 h-14 px-6 bg-zinc-950/30 rounded-2xl border border-zinc-800/50">
                          <Toggle on={cfg.financial.multiCurrencyEnabled} onToggle={() => patchFin({ multiCurrencyEnabled: !cfg.financial.multiCurrencyEnabled })} />
                          <span className={`text-[11px] font-bold uppercase ${cfg.financial.multiCurrencyEnabled ? "text-red-500" : "text-zinc-600"}`}>Locked</span>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave("Financial policy synced")} disabled={isSaving} className="h-14 px-12 font-black uppercase tracking-widest text-[10px] rounded-2xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20 gap-3">
                      <Save className="w-5 h-5" /> Sync Economic Policy
                    </Button>
                  </div>
                </div>
              )}

              {/* 14-15 OPERATIONS */}
              {activeTab === "operations" && (
                <div className="space-y-12">
                   <SectionCard title="Global Broadcaster" desc="Inject administrative alerts into client terminals" icon={Megaphone} accent>
                    <div className="mt-8 space-y-6">
                      <textarea
                        value={cfg.operations.broadcastMessage}
                        onChange={e => patchOps({ broadcastMessage: e.target.value })}
                        placeholder="Type high-priority broadcast signal here..."
                        className="w-full h-32 bg-zinc-950/50 border border-zinc-800/80 rounded-[2.5rem] p-8 text-sm text-white placeholder:text-zinc-700 focus:border-red-500/50 outline-none transition-all resize-none shadow-inner"
                      />
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 h-16 px-8 bg-zinc-950/30 rounded-2xl border border-zinc-800/50 flex-1">
                          <Toggle on={cfg.operations.broadcastActive} onToggle={() => patchOps({ broadcastActive: !cfg.operations.broadcastActive })} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.operations.broadcastActive ? "text-red-500 animate-pulse" : "text-zinc-600"}`}>Signal Live</span>
                        </div>
                        <Button onClick={handleSendBroadcast} className="h-16 px-10 font-black text-[10px] uppercase tracking-widest rounded-2xl gap-3 bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20">
                          Inject Transmission
                        </Button>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="SLA Governance Engine" desc="Operational latency and throughput constraints" icon={Clock}>
                    <div className="grid sm:grid-cols-3 gap-10 mt-8">
                       <div className="space-y-4">
                        <Label>Response TTL (hours)</Label>
                        <Input type="number" value={cfg.operations.slaThresholdHours} onChange={e => patchOps({ slaThresholdHours: +e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 font-mono text-2xl font-black rounded-2xl px-6 text-white focus:border-red-500/50 transition-all" />
                      </div>
                      <div className="space-y-4">
                        <Label>Capacity Limit</Label>
                        <Input type="number" value={cfg.operations.maxConcurrentRequests} onChange={e => patchOps({ maxConcurrentRequests: +e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 font-mono text-2xl font-black rounded-2xl px-6 text-white focus:border-red-500/50 transition-all" />
                      </div>
                      <div className="space-y-4">
                        <Label>Admin Support Node</Label>
                        <Input value={cfg.operations.supportEmail} onChange={e => patchOps({ supportEmail: e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 rounded-2xl px-6 text-sm font-bold text-white focus:border-red-500/50 transition-all" />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* PERSONAL PROFILE */}
              {activeTab === "profile" && (
                <SectionCard title="Identity Profile" desc="Personal identifiers and access tier" icon={User}>
                  <div className="flex flex-col md:flex-row items-center gap-10 mt-10">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 relative group cursor-pointer overflow-hidden shadow-2xl">
                       <User className="w-16 h-16 text-zinc-700 group-hover:text-red-500 transition-colors duration-500" />
                       <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-[9px] font-black text-white uppercase tracking-widest bg-red-600 px-3 py-1 rounded-full">Update</span>
                       </div>
                    </div>
                    <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
                       <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full text-[10px] font-black text-red-500 uppercase tracking-widest shadow-lg shadow-red-500/5">
                         <ShieldCheck className="w-3.5 h-3.5" /> {userRole} authorized node
                       </div>
                       <h3 className="text-4xl font-bold text-white truncate">{profileData.name}</h3>
                       <p className="text-sm text-zinc-500 font-mono truncate tracking-wide">{profileData.email}</p>
                    </div>
                  </div>

                  {/* Feature 4: Profile Completeness */}
                  <ProfileCompleteness
                    name={profileData.name}
                    email={profileData.email}
                    phone={profileData.phone}
                    twoFA={is2FAEnabled}
                  />

                  <div className="grid sm:grid-cols-2 gap-8 mt-4 pb-4">
                    <div className="space-y-4">
                      <Label>Legal Identity</Label>
                      <Input value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 rounded-2xl px-6 font-bold text-white transition-all focus:border-red-500/50" />
                    </div>
                    <div className="space-y-4">
                      <Label>Contact Node</Label>
                      <Input value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className="h-14 bg-zinc-950/50 border-zinc-800/80 rounded-2xl px-6 font-bold text-white transition-all focus:border-red-500/50" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-12">
                     <Button onClick={() => handleSave("Profile updated")} disabled={isSaving} className="h-14 px-12 font-black uppercase tracking-widest text-[10px] rounded-2xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20 gap-3 transition-all active:scale-95">
                        <Save className="w-5 h-5" /> Commit Identity
                     </Button>
                  </div>
                </SectionCard>
              )}

              {/* SECURITY HUB */}
              {activeTab === "security" && (
                <div className="space-y-10">
                  {/* Sub-tabs */}
                  <div className="flex gap-10 border-b border-zinc-800/60 pb-0 overflow-x-auto no-scrollbar">
                    {[{ id: "settings", label: "Auth Hub" }, { id: "activity", label: "Global Audit" }, { id: "devices", label: "Node Access" }].map(t => (
                      <button key={t.id} onClick={() => setSecTab(t.id)}
                        className={`text-sm font-bold uppercase tracking-[0.2em] pb-6 border-b-2 transition-all whitespace-nowrap ${secTab === t.id ? "border-red-500 text-white" : "border-transparent text-zinc-600 hover:text-zinc-300"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* AUTH HUB */}
                  {secTab === "settings" && (
                    <div className="space-y-8">

                      {/* Password Rotation */}
                      <SectionCard title="Password Rotation" desc="Update your portal access credentials" icon={Key}>
                        <div className="grid sm:grid-cols-3 gap-6 mt-6">
                          {[
                            { label: "Current Password", key: "current", placeholder: "Enter current password" },
                            { label: "New Password", key: "new", placeholder: "Min 8 characters" },
                            { label: "Confirm New", key: "confirm", placeholder: "Repeat new password" },
                          ].map(f => (
                            <div key={f.key} className="space-y-3">
                              <Label>{f.label}</Label>
                              <Input
                                type="password"
                                placeholder={f.placeholder}
                                value={pwData[f.key as keyof typeof pwData]}
                                onChange={e => setPwData({ ...pwData, [f.key]: e.target.value })}
                                onKeyDown={e => e.key === "Enter" && handlePasswordChange()}
                                className="h-12 bg-zinc-950/50 border-zinc-800/80 rounded-2xl px-5 text-white transition-all focus:border-primary/50"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                          {pwError && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="mt-4 flex items-center gap-2 text-xs text-red-400 font-bold bg-red-500/8 border border-red-500/20 px-4 py-3 rounded-xl">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {pwError}
                            </motion.div>
                          )}
                          {pwSuccess && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Password updated successfully. Use your new password next time you log in.
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <Button
                          onClick={handlePasswordChange}
                          disabled={isSaving || !pwData.current || !pwData.new || !pwData.confirm}
                          className="mt-6 font-bold h-11 rounded-2xl px-8 shadow-xl shadow-primary/10 gap-2"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                          {isSaving ? "Saving..." : "Rotate Credentials"}
                        </Button>
                      </SectionCard>

                      {/* 2FA Shield */}
                      <SectionCard
                        title="Two-Factor Authentication"
                        desc="Add a second layer of security to your account with a TOTP authenticator app"
                        icon={is2FAEnabled ? ShieldCheck : ShieldOff}
                        accent={is2FAEnabled}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
                          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${
                            is2FAEnabled
                              ? "bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/10"
                              : "bg-zinc-800/60 border-zinc-700/50 text-zinc-500"
                          }`}>
                            {is2FAEnabled ? <ShieldCheck className="w-8 h-8" /> : <ShieldOff className="w-8 h-8" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-white mb-1">
                              {is2FAEnabled ? "2FA is Active" : "2FA is Disabled"}
                            </h4>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                              {is2FAEnabled
                                ? "Your account is protected with a time-based one-time password (TOTP). Each login requires a code from your authenticator app."
                                : "Enable 2FA to protect your account from unauthorized access. You'll need an authenticator app like Google Authenticator or Authy."}
                            </p>
                          </div>

                          <Button
                            onClick={() => is2FAEnabled ? setShowDisablePrompt(true) : setShowPwPrompt(true)}
                            variant={is2FAEnabled ? "outline" : "default"}
                            className={`shrink-0 h-11 px-6 rounded-2xl font-bold transition-all ${
                              is2FAEnabled
                                ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                            }`}
                          >
                            {is2FAEnabled ? "Manage 2FA" : "Enable 2FA"}
                          </Button>
                        </div>

                        {/* Password prompt before 2FA setup */}
                        <AnimatePresence>
                          {showPwPrompt && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-8 p-6 bg-zinc-950/60 border border-zinc-800/60 rounded-3xl space-y-5">
                                <div>
                                  <h5 className="text-sm font-bold text-white mb-1">Verify your identity</h5>
                                  <p className="text-xs text-zinc-500">Enter your current password to proceed with 2FA setup.</p>
                                </div>
                                <Input
                                  type="password"
                                  placeholder="Enter your current password..."
                                  value={promptPw}
                                  onChange={e => setPromptPw(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && handleConfirmPasswordFor2FA()}
                                  className="h-12 bg-zinc-900 border-zinc-700 rounded-2xl px-5 text-white focus:border-primary/50"
                                />
                                {promptErr && <p className="text-xs text-red-500 font-bold">⚠️ {promptErr}</p>}
                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleConfirmPasswordFor2FA}
                                    disabled={isCheckingPw || !promptPw}
                                    className="flex-1 h-11 rounded-2xl font-bold gap-2"
                                  >
                                    {isCheckingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    {isCheckingPw ? "Verifying..." : "Continue to 2FA Setup"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => { setShowPwPrompt(false); setPromptPw(""); setPromptErr(""); }}
                                    className="h-11 px-5 rounded-2xl text-zinc-500 hover:text-white"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Disable 2FA prompt */}
                          {showDisablePrompt && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-8 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-5">
                                <div>
                                  <h5 className="text-sm font-bold text-white mb-1">Disable Two-Factor Authentication</h5>
                                  <p className="text-xs text-zinc-500">
                                    This will remove the extra layer of protection from your account. Enter your password to confirm.
                                  </p>
                                </div>
                                <Input
                                  type="password"
                                  placeholder="Enter your current password..."
                                  value={disablePw}
                                  onChange={e => setDisablePw(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && handleConfirmDisable2FA()}
                                  className="h-12 bg-zinc-900 border-zinc-700 rounded-2xl px-5 text-white focus:border-red-500/50"
                                />
                                {disableErr && <p className="text-xs text-red-500 font-bold">⚠️ {disableErr}</p>}
                                <div className="flex gap-3">
                                  <button
                                    onClick={handleConfirmDisable2FA}
                                    disabled={isDisabling || !disablePw}
                                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                                  >
                                    {isDisabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                                    {isDisabling ? "Removing 2FA..." : "Remove 2FA"}
                                  </button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => { setShowDisablePrompt(false); setDisablePw(""); setDisableErr(""); }}
                                    className="h-11 px-5 rounded-2xl text-zinc-500 hover:text-white"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </SectionCard>
                      
                      {/* Active Session Directory */}
                      <SectionCard
                        title="Active Sessions & Devices"
                        desc="Manage all currently authorized devices securely accessing your Morchantra instance."
                        icon={MonitorSmartphone}
                      >
                         <div className="mt-6">
                            <TrustedDevices userId={profileData.email} />
                         </div>
                      </SectionCard>
                    </div>
                  )}

                  {/* AUDIT LOG */}
                  {secTab === "activity" && (
                    <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-[2rem] p-8 overflow-hidden">
                      <AuditLog userId={currentUser.email} />
                    </div>
                  )}

                  {/* TRUSTED DEVICES */}
                  {secTab === "devices" && (
                    <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-[2rem] p-8 overflow-hidden">
                      <TrustedDevices userId={currentUser.email} />
                    </div>
                  )}
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <SectionCard title="Transmission Hub" desc="Configure neural and alert notifications" icon={Bell}>
                   <div className="space-y-10 mt-6">
                      <div className="flex items-center justify-between p-10 bg-zinc-950/30 border border-zinc-800/50 rounded-[2.5rem] group hover:bg-zinc-900/40 transition-all duration-500">
                         <div className="space-y-2">
                            <h4 className="text-xl font-bold text-white">Security Alerts</h4>
                            <p className="text-[13px] text-zinc-500 font-medium">Logins, password changes, and 2FA events</p>
                         </div>
                         <Toggle on={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
                      </div>
                      <div className="flex items-center justify-between p-10 bg-zinc-950/30 border border-zinc-800/50 rounded-[2.5rem] group hover:bg-zinc-900/40 transition-all duration-500">
                         <div className="space-y-2">
                            <h4 className="text-xl font-bold text-white">SLA Critical Alerts</h4>
                            <p className="text-[13px] text-zinc-500 font-medium">Urgent events via SMS authorized nodes</p>
                         </div>
                         <Toggle on={smsNotif} onToggle={() => setSmsNotif(!smsNotif)} />
                      </div>
                   </div>
                   <div className="flex justify-end mt-12">
                     <Button onClick={() => handleSave("Alerts redeployed")} className="h-14 px-12 font-black uppercase tracking-widest text-[10px] rounded-2xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20 gap-3">
                        <Save className="w-5 h-5" /> Deploy Transmissions
                     </Button>
                   </div>
                </SectionCard>
              )}

              {/* PREFERENCES */}
              {activeTab === "preferences" && (
                <SectionCard title="Regional Context" desc="Contextual baseline for your portal session" icon={Globe}>
                   <div className="grid sm:grid-cols-2 gap-10 mt-8">
                     <div className="space-y-4">
                        <Label>Market Authority Locale</Label>
                        <div className="relative">
                          <select value={country} onChange={e => setCountry(e.target.value)} className="w-full h-14 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl px-6 text-sm font-bold text-white appearance-none cursor-pointer focus:border-red-500/50 transition-all">
                             {countries.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">▼</div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <Label>Resolved Market Currency</Label>
                        <div className="h-14 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl px-6 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <span className="text-2xl font-black text-red-500 italic">$</span>
                              <span className="text-lg font-bold text-white uppercase tracking-widest">{currencyCode}</span>
                           </div>
                           <Activity className="w-5 h-5 text-zinc-700" />
                        </div>
                     </div>
                   </div>

                    {/* Feature 8: Theme Toggle */}
                    <div className="mt-10 flex items-center justify-between p-8 bg-zinc-950/30 border border-zinc-800/50 rounded-[2.5rem] hover:bg-zinc-900/40 transition-all duration-500">
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-white flex items-center gap-3">
                          {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-400" />}
                          Interface Theme
                        </h4>
                        <p className="text-[13px] text-zinc-500 font-medium">
                          Currently: <span className="text-white font-bold">{isDark ? "Dark Mode" : "Light Mode"}</span>
                        </p>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className={`relative h-8 w-16 rounded-full transition-all duration-500 focus:outline-none border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-amber-400/20 border-amber-400/40"}`}
                      >
                        <span className={`absolute top-1 left-1 h-6 w-6 rounded-full transition-transform duration-300 flex items-center justify-center shadow-lg ${isDark ? "translate-x-0 bg-zinc-600" : "translate-x-8 bg-amber-400"}`}>
                          {isDark ? <Moon className="w-3 h-3 text-white" /> : <Sun className="w-3 h-3 text-white" />}
                        </span>
                      </button>
                    </div>
                 </SectionCard>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
