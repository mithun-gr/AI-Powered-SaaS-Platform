"use client";
// Features 7 (Usage Stats), 9 (Onboarding Checklist), 10 (Activity Feed), 11 (Referral), 12 (Upgrade Prompt)

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CreditCard, FolderOpen, MessageCircle, TrendingUp, Clock,
  CheckCircle2, Circle, X, Copy, Check, Zap, Bell, Shield, Users,
  ChevronRight, Gift, ArrowUpRight, Activity, Sparkles, AlertTriangle, Search,
  SlidersHorizontal, Eye, EyeOff, Loader
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardMetrics, recentRequests, pricingTiers } from "@/lib/dummy-data";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { AdvancedE2EDemo } from "@/components/e2e-demo-module";
import { UserRole } from "@/lib/auth-session";
import { getAuthSession } from "@/lib/auth-session";
import { NotificationBell } from "@/components/client/NotificationBell";
import { useSearch } from "@/lib/use-search";
import { useUsage } from "@/lib/use-usage";

const iconMap: Record<string, any> = { FileText, CreditCard, FolderOpen, MessageCircle };

// ── Feature 7: Plan Usage Widget — REAL-TIME ─────────────────────────────────
function PlanUsageWidget() {
  const usage = useUsage();

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Current Plan</p>
          <h3 className="font-bold text-white mt-0.5">{usage.planLabel}</h3>
        </div>
        <Link href="/payments">
          <span className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
            Upgrade <ArrowUpRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div className="space-y-3">
        {/* Requests */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>Requests this month</span>
            <span className={usage.nearRequestLimit ? "text-amber-400 font-bold" : ""}>
              {usage.requestsUsed}/{usage.requestLimit}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${usage.requestPct}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${
                usage.atRequestLimit ? "bg-red-500" :
                usage.nearRequestLimit ? "bg-amber-400" : "bg-primary"
              }`}
            />
          </div>
          {usage.atRequestLimit && (
            <p className="text-[10px] text-red-400 mt-1 font-semibold">Limit reached — upgrade for more requests</p>
          )}
        </div>
        {/* Storage */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>Documents uploaded</span>
            <span>{usage.documentsUploaded} file{usage.documentsUploaded !== 1 ? "s" : ""}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${Math.min(usage.storagePct, 100)}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
        </div>
        {/* AI Usage */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>AI Generations</span>
            <span className={usage.nearAiLimit ? "text-amber-400 font-bold" : ""}>
              {usage.aiUsed || 0}/{usage.aiLimit}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${usage.aiPct}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`h-full rounded-full ${
                usage.atAiLimit ? "bg-red-500" :
                usage.nearAiLimit ? "bg-amber-400" : "bg-violet-500"
              }`}
            />
          </div>
          {usage.atAiLimit && (
            <p className="text-[10px] text-red-400 mt-1 font-semibold">AI limit reached</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Feature 12: Upgrade Banner — REAL-TIME ────────────────────────────────────
function UpgradeBanner() {
  const usage = useUsage();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state whenever usage changes (so it reappears at 70%+)
  // Only show when near/at limit
  if (dismissed || usage.requestPct < 70) return null;

  return (
    <motion.div
      key={`upgrade-${usage.requestsUsed}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-2xl p-4 flex items-center gap-4 border ${
        usage.atRequestLimit
          ? "bg-red-500/10 border-red-500/30"
          : "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-primary/20"
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
        usage.atRequestLimit ? "bg-red-500/20" : "bg-primary/20"
      }`}>
        <Zap className={`w-5 h-5 ${usage.atRequestLimit ? "text-red-400" : "text-primary"}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">
          {usage.atRequestLimit
            ? `You've reached your ${usage.requestLimit}-request limit this month`
            : `You've used ${usage.requestsUsed}/${usage.requestLimit} requests this month`}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">
          Upgrade for more requests/month, priority support &amp; advanced features.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/payments">
          <Button size="sm" className="h-8 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 gap-1">
            Upgrade <ArrowUpRight className="w-3 h-3" />
          </Button>
        </Link>
        <button onClick={() => setDismissed(true)} className="text-zinc-600 hover:text-zinc-400">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Feature 11: Referral Card ─────────────────────────────────────────────────
function ReferralCard() {
  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [origin, setOrigin] = useState("https://ai-powered-saa-s-platform.vercel.app");

  useEffect(() => {
    setSession(getAuthSession());
    setOrigin(window.location.origin);
  }, []);

  const code = `MRC-${(session?.email ?? "DEMO").split("@")[0].toUpperCase().slice(0, 6)}`;
  const link = `${origin}/signup?ref=${code}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <Gift className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">Partner Growth Program</h3>
          <p className="text-xs text-zinc-500">Earn a complimentary month for every successful enterprise referral</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-3 py-2.5">
        <span className="text-xs text-zinc-400 font-mono flex-1 truncate">{link}</span>
        <button onClick={copy} className="shrink-0 text-zinc-400 hover:text-primary transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {copied && <p className="text-xs text-emerald-400 mt-2 font-semibold">✓ Link copied!</p>}
    </div>
  );
}

// ── Feature 7: Automated Compliance Reminders ──────────────────────────────────
function ComplianceReminders() {
  const [privacyStatus, setPrivacyStatus] = useState<"pending" | "scanning" | "resolved">("pending");
  const [gstStatus, setGstStatus] = useState<"pending" | "uploading" | "resolved">("pending");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrivacyAudit = () => {
    if (privacyStatus !== "pending") return;
    setPrivacyStatus("scanning");
    setTimeout(() => setPrivacyStatus("resolved"), 2500);
  };

  const handleGstUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setGstStatus("uploading");
      setTimeout(() => setGstStatus("resolved"), 2000);
    }
  };

  const allResolved = privacyStatus === "resolved" && gstStatus === "resolved";

  return (
    <div className={`rounded-2xl border p-5 relative overflow-hidden transition-colors duration-500 ${allResolved ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50" : "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50 group"}`}>
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${allResolved ? "bg-emerald-500/10" : "bg-rose-500/10"}`} />
      
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500 ${allResolved ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
          {allResolved ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-rose-500" />}
        </div>
        <div>
          <h3 className={`font-bold text-sm transition-colors duration-500 ${allResolved ? "text-emerald-500" : "text-rose-500"}`}>
            {allResolved ? "All Clear" : "Action Required"}
          </h3>
          <p className="text-xs text-zinc-400">
            {allResolved ? "No upcoming compliance deadlines" : `${(privacyStatus !== "resolved" ? 1 : 0) + (gstStatus !== "resolved" ? 1 : 0)} upcoming compliance deadlines`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {privacyStatus !== "resolved" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-zinc-950/60 border border-rose-500/20 rounded-xl p-3">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-xs font-bold text-white">Annual Privacy Audit</h4>
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">In 5 Days</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight mb-3">Annual review required for GDPR and digital privacy compliance parameters.</p>
            <Button size="sm" className="w-full h-7 text-[10px] uppercase font-bold tracking-wider bg-rose-500 hover:bg-rose-600 text-white rounded transition-all" 
              onClick={handlePrivacyAudit}
              disabled={privacyStatus !== "pending"}
            >
              {privacyStatus === "scanning" ? (
                <span className="flex items-center gap-2"><Loader className="w-3 h-3 animate-spin"/> Auditing...</span>
              ) : "Auto-Resolve via AI"}
            </Button>
          </motion.div>
        )}

        {gstStatus !== "resolved" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-xs font-semibold text-zinc-300">Quarterly GST Filing Check</h4>
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500">In 14 Days</span>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.pdf,.xlsx" onChange={handleGstUpload} />
            <Button variant="ghost" size="sm" className="w-full h-7 mt-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400 hover:text-white rounded border border-zinc-800 transition-all" 
              onClick={() => fileInputRef.current?.click()}
              disabled={gstStatus !== "pending"}
            >
              {gstStatus === "uploading" ? (
                <span className="flex items-center gap-2 text-primary font-semibold"><Loader className="w-3 h-3 animate-spin"/> Uploading...</span>
              ) : "Submit Financials"}
            </Button>
          </motion.div>
        )}

        {allResolved && (
           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center mt-2">
               <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
               <p className="text-sm font-semibold text-emerald-400">Your business is 100% compliant</p>
               <p className="text-xs text-emerald-500/70 mt-1">Both actions naturally resolved via Morchantra AI.</p>
           </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Feature 10: Live Activity Feed ─────────────────────────────────────────────
const ACTIVITY_FEED = [
  { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Contract analysis completed", desc: "REQ-001 — Sarah Johnson completed the legal review", time: "2h ago" },
  { icon: FileText,     color: "text-blue-400",    bg: "bg-blue-500/10",    title: "New request created",         desc: "AWS Cloud Infrastructure Setup submitted",        time: "5h ago" },
  { icon: FolderOpen,   color: "text-primary",     bg: "bg-primary/10",     title: "Document uploaded",           desc: "insurance_policy_2025.pdf → Insurance folder",   time: "1d ago" },
  { icon: CreditCard,   color: "text-amber-400",   bg: "bg-amber-500/10",   title: "Invoice paid",                desc: "₹8,500 — Data Analytics Dashboard",              time: "2d ago" },
  { icon: Shield,       color: "text-violet-400",  bg: "bg-violet-500/10",  title: "2FA enabled",                 desc: "Account security upgraded",                      time: "3d ago" },
];

// ── Dashboard Recent Requests with live search ────────────────────────────────────────────────────
function RecentRequestsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [liveRequests, setLiveRequests] = useState(recentRequests);
  
  // Simulate network fetch and WebSocket connection
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    
    // Feature 4: WebSocket simulation listener
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "mrc_requests_mock_db" && e.newValue) {
            setLiveRequests(JSON.parse(e.newValue));
        }
    };
    
    // Also listen to internal dispatches for same-tab updates
    const handleLocalDispatch = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail) setLiveRequests(detail);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("mrc:websocket-update", handleLocalDispatch);
    
    // Initial fetch from "DB"
    const stored = localStorage.getItem("mrc_requests_mock_db");
    if (stored) setLiveRequests(JSON.parse(stored));
    
    return () => {
        clearTimeout(timer);
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("mrc:websocket-update", handleLocalDispatch);
    };
  }, []);

  const { query, setQuery, results, clearSearch, hasQuery } = useSearch(
    liveRequests,
    ["id", "title", "description", "service", "status"]
  );
  const displayed = results.slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Recent Requests</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-7 pl-8 pr-7 text-xs w-36 bg-zinc-900 border-zinc-700"
            />
            {hasQuery && (
              <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <Link href="/requests"><span className="text-xs text-primary hover:underline font-semibold whitespace-nowrap">View all →</span></Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            // Skeleton Loaders
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1/3 bg-zinc-800 animate-pulse rounded truncate" />
                    <div className="h-4 w-16 bg-zinc-800 animate-pulse rounded-full" />
                  </div>
                  <div className="h-3 w-3/4 bg-zinc-800/60 animate-pulse rounded" />
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-3 w-16 bg-zinc-800/40 animate-pulse rounded" />
                    <div className="h-3 w-16 bg-zinc-800/40 animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-8 w-12 bg-zinc-800 animate-pulse rounded shrink-0" />
              </div>
            ))
          ) : displayed.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-6">No matching requests found.</p>
          ) : displayed.map((request) => (
            <motion.div key={request.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">{request.title}</h3>
                  <StatusBadge status={request.status} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{request.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(request.updatedAt).toLocaleDateString("en-GB")}</span>
                  <span>{request.id}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 text-xs text-primary hover:bg-primary/10">View</Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [name, setName] = useState("there");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const session = getAuthSession();
    if (session?.name) setName(session.name.split(" ")[0]);
    
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
  }, []);

  // Linear-style "Display Options" state
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const [displayPrefs, setDisplayPrefs] = useState({
    metrics: true,
    quickActions: true,
    activityFeed: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("mrc_dash_display");
    if (saved) setDisplayPrefs(JSON.parse(saved));
  }, []);

  const toggleDisplay = (key: keyof typeof displayPrefs) => {
    const next = { ...displayPrefs, [key]: !displayPrefs[key] };
    setDisplayPrefs(next);
    localStorage.setItem("mrc_dash_display", JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between relative z-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{greeting}, {name}! 👋</h1>
          <p className="text-sm text-zinc-500 mt-1">Here's what's happening with your account today.</p>
        </motion.div>

        {/* Display Options Menu */}
        <div className="relative">
          <Button 
             variant="outline" 
             size="sm" 
             onClick={() => setShowDisplayMenu(!showDisplayMenu)}
             className={`gap-2 h-9 border-zinc-800 transition-colors ${showDisplayMenu ? "bg-zinc-800 text-white" : "bg-zinc-950 text-zinc-400 hover:text-white"}`}
          >
             <SlidersHorizontal className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">Display</span>
          </Button>

          <AnimatePresence>
            {showDisplayMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowDisplayMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-40"
                >
                   <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                      View Options
                   </div>
                   
                   <div className="space-y-0.5">
                      <button 
                         onClick={() => toggleDisplay('metrics')}
                         className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors group"
                      >
                         <span className="font-semibold group-hover:text-white">KPI Metrics</span>
                         {displayPrefs.metrics ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-zinc-600" />}
                      </button>
                      <button 
                         onClick={() => toggleDisplay('quickActions')}
                         className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors group"
                      >
                         <span className="font-semibold group-hover:text-white">Quick Actions</span>
                         {displayPrefs.quickActions ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-zinc-600" />}
                      </button>
                      <button 
                         onClick={() => toggleDisplay('activityFeed')}
                         className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors group"
                      >
                         <span className="font-semibold group-hover:text-white">Activity Feed</span>
                         {displayPrefs.activityFeed ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-zinc-600" />}
                      </button>
                   </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Feature 12: Upgrade Banner */}
      <AnimatePresence><UpgradeBanner /></AnimatePresence>

      <AnimatePresence mode="popLayout">
        {/* Metrics */}
        {displayPrefs.metrics && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div variants={staggerContainer} initial="initial" animate="animate"
              className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pb-1">
              {dashboardMetrics.map((metric, index) => {
                const Icon = iconMap[metric.icon];
                return (
                  <motion.div key={metric.label} variants={fadeIn} custom={index}>
                    <Card className="hover:scale-105 transition-transform hover:border-primary/30">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{metric.label}</p>
                            <div className="flex items-baseline gap-2 mt-1 sm:mt-2">
                              <p className="text-2xl sm:text-3xl font-bold">{metric.value}</p>
                              {metric.trend && (
                                <span className="flex items-center text-xs text-green-500">
                                  <TrendingUp className="w-3 h-3 mr-1" />+{metric.trend.value}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {/* Quick Actions */}
        {displayPrefs.quickActions && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
                  <Link href="/requests/new">
                    <Button className="w-full"><FileText className="mr-2 h-4 w-4" />Submit New Request</Button>
                  </Link>
                  <Link href="/documents">
                    <Button variant="outline" className="w-full"><FolderOpen className="mr-2 h-4 w-4" />Upload Documents</Button>
                  </Link>
                  <Link href="/support">
                    <Button variant="outline" className="w-full"><MessageCircle className="mr-2 h-4 w-4" />Contact Support</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2-column: Recent Requests + Sidebar widgets */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Requests */}
        <div className="lg:col-span-2">
          <RecentRequestsPanel />
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-4">
          <PlanUsageWidget />
          <ComplianceReminders />
          <ReferralCard />
        </div>
      </div>

      {/* Advanced E2E Innovation Lab */}
      <div className="mt-6">
        <AdvancedE2EDemo />
      </div>

      {/* Feature 10: Activity Feed */}
      <AnimatePresence mode="popLayout">
        {displayPrefs.activityFeed && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <CardTitle>Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {ACTIVITY_FEED.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="flex gap-3 p-3 rounded-xl hover:bg-zinc-800/30 transition-colors">
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white leading-tight">{item.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600 shrink-0 mt-1">{item.time}</span>
                      </motion.div>
                    );
                  })}
                </div>
                <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest font-semibold border-t border-border pt-4">System populated with preview sandbox data</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
