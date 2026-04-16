"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Bell, User, LogOut, Menu, ArrowLeft, FileText, FolderOpen, CreditCard, X, ChevronRight, Check, Eye, Monitor, Type, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clearAuthCookie } from "@/lib/auth-session";
import { recentRequests, documents, invoices } from "@/lib/dummy-data";
import { SetupGuidePopover } from "@/components/setup-guide-popover";
import { useAccessibility } from "@/components/providers/accessibility-provider";

interface NavbarProps {
  onMobileMenuClick?: () => void;
}

// Route name mapping for breadcrumbs
const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/requests": "My Requests",
  "/requests/new": "Submit New Request",
  "/documents": "Documents",
  "/payments": "Payments",
  "/support": "Support",
  "/settings": "Settings",
  "/admin": "Admin Dashboard",
  "/admin/clients": "Client Management",
  "/admin/requests": "Request Management",
  "/admin/invoices": "Invoice Management",
  "/admin/analytics": "Analytics",
};

const mainRoutes = ["/dashboard", "/admin"];

// ── Workspaces Data ────────────────────────────────────────────────────────
const WORKSPACES = [
  { id: "ws_global",   name: "Morchantra Global",  role: "Enterprise Tier (CEO)", initial: "M", theme: "bg-gradient-to-tr from-primary to-rose-500 text-white" },
  { id: "ws_stark",    name: "Stark Industries",   role: "Internal IT Audits",    initial: "S", theme: "bg-zinc-800 text-zinc-300" },
  { id: "ws_personal", name: "Personal Sandbox",   role: "Hobby Tier",            initial: "P", theme: "bg-blue-600 text-white" },
];

// ── Global Spotlight Search ──────────────────────────────────────────────────
function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss on Escape key or outside click
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setQuery(""); } };
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClickOutside); };
  }, []);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q || q.length < 1) return null;

    const matchedRequests = recentRequests
      .filter(r => [r.id, r.title, r.description, r.service, r.status].some(f => f?.toLowerCase().includes(q)))
      .slice(0, 4)
      .map(r => ({
        icon: FileText,
        color: "text-primary",
        bg: "bg-primary/10",
        label: r.title,
        sub: `${r.id} · ${r.status}`,
        href: "/requests",
      }));

    const matchedDocs = documents
      .filter(d => [d.name, d.folder, d.type].some(f => f?.toLowerCase().includes(q)))
      .slice(0, 3)
      .map(d => ({
        icon: FolderOpen,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        label: d.name,
        sub: `${d.folder} · ${d.size}`,
        href: "/documents",
      }));

    const matchedInvoices = invoices
      .filter(inv => [inv.invoiceNumber, inv.service, inv.status].some(f => f?.toLowerCase().includes(q)))
      .slice(0, 3)
      .map(inv => ({
        icon: CreditCard,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        label: inv.service,
        sub: `${inv.invoiceNumber} · ${inv.status}`,
        href: "/payments",
      }));

    return { matchedRequests, matchedDocs, matchedInvoices };
  }, [q]);

  const totalCount = results
    ? results.matchedRequests.length + results.matchedDocs.length + results.matchedInvoices.length
    : 0;

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search requests, documents, invoices…"
          className="w-full h-9 pl-10 pr-9 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm text-white placeholder:text-zinc-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {open && query.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden"
          >
            {totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <Search className="w-6 h-6 mb-2 opacity-40" />
                <p className="text-xs">No results for <span className="text-white font-semibold">"{query}"</span></p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-800/60">
                {/* Requests */}
                {results!.matchedRequests.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 px-4 py-2">Requests</p>
                    {results!.matchedRequests.map((item, i) => (
                      <button key={i} onClick={() => navigate(item.href)}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left group">
                        <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                          <p className="text-xs text-zinc-500 capitalize">{item.sub}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Documents */}
                {results!.matchedDocs.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 px-4 py-2">Documents</p>
                    {results!.matchedDocs.map((item, i) => (
                      <button key={i} onClick={() => navigate(item.href)}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left group">
                        <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                          <p className="text-xs text-zinc-500 capitalize">{item.sub}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Invoices */}
                {results!.matchedInvoices.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 px-4 py-2">Payments</p>
                    {results!.matchedInvoices.map((item, i) => (
                      <button key={i} onClick={() => navigate(item.href)}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left group">
                        <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                          <p className="text-xs text-zinc-500 capitalize">{item.sub}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer hint */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80">
                  <p className="text-[10px] text-zinc-600">{totalCount} result{totalCount !== 1 ? "s" : ""} found</p>
                  <p className="text-[10px] text-zinc-600">Press <kbd className="bg-zinc-800 px-1 rounded text-zinc-400">Esc</kbd> to close</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────
export function Navbar({ onMobileMenuClick }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("ws_global");

  const shouldShowBackButton = pathname && !mainRoutes.includes(pathname);

  // Derive active workspace
  const activeWorkspace = WORKSPACES.find(w => w.id === activeWorkspaceId) || WORKSPACES[0];

  const {
    simpleFont, toggleSimpleFont,
    eyeCare, toggleEyeCare,
    vividMode, toggleVividMode,
    resetPreferences
  } = useAccessibility();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const [prevPageName, setPrevPageName] = useState("Back");

  // Track the previous page name using history
  useEffect(() => {
    const prev = sessionStorage.getItem("mrc_prev_path");
    if (prev && routeNames[prev]) {
      setPrevPageName(routeNames[prev]);
    } else {
      setPrevPageName(pathname?.startsWith("/admin") ? "Admin" : "Overview");
    }
    // Store current path as the "previous" for the next navigation
    return () => {
      if (pathname) sessionStorage.setItem("mrc_prev_path", pathname);
    };
  }, [pathname]);

  const handleLogout = () => {
    clearAuthCookie();
    localStorage.removeItem("user");
    localStorage.removeItem("mrc_2fa_enabled");
    localStorage.removeItem("mrc_2fa_secret");
    window.location.href = "/login";
  };

  const handleBack = () => {
    // Use real browser history — just like every Google/Apple product
    router.back();
  };

  return (
    <nav className="sticky top-0 z-30 flex h-16 md:h-18 items-center gap-3 md:gap-6 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 md:px-8">
      {/* Mobile Menu Button */}
      <button
        onClick={onMobileMenuClick}
        className="sm:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-secondary transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Back Button / Global Search */}
      <AnimatePresence mode="wait">
        {shouldShowBackButton ? (
          <motion.div
            key="back-button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 flex-1 max-w-md"
          >
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(239, 68, 68, 0.08)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/50 transition-all group"
            >
              <ArrowLeft className="h-4 w-4 text-zinc-500 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-zinc-500 group-hover:text-primary transition-colors hidden sm:inline">
                {prevPageName}
              </span>
            </motion.button>
            {/* Breadcrumb trail: Home › Current Page */}
            <div className="hidden md:flex items-center gap-1.5 text-sm text-zinc-600">
              <span className="hover:text-zinc-400 cursor-pointer transition-colors"
                onClick={() => router.push(pathname?.startsWith("/admin") ? "/admin" : "/dashboard")}>
                {pathname?.startsWith("/admin") ? "Admin" : "Home"}
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white font-semibold">{routeNames[pathname] || "Page"}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="global-search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="hidden sm:flex flex-1 max-w-md"
          >
            <GlobalSearch />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">

        {/* Workspace Switcher */}
        <div className="relative hidden sm:block">
          <div 
            onClick={() => { setShowWorkspaces(!showWorkspaces); setShowNotifications(false); setShowProfile(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-colors mx-2 cursor-pointer ${
               showWorkspaces ? "bg-zinc-900 border-primary/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shadow-sm ${activeWorkspace.theme}`}>
              {activeWorkspace.initial}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 leading-none uppercase tracking-widest font-bold">Workspace</span>
              <span className="text-xs font-bold text-white leading-tight">{activeWorkspace.name}</span>
            </div>
          </div>
          
          <AnimatePresence>
            {showWorkspaces && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-2 w-64 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl p-2 z-50 flex flex-col gap-1"
              >
                <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Workspaces</div>
                
                {WORKSPACES.map((ws) => (
                  <button 
                    key={ws.id}
                    onClick={() => { setActiveWorkspaceId(ws.id); setShowWorkspaces(false); }} 
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-zinc-900 transition-colors group relative"
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shadow-sm transition-transform group-hover:scale-105 ${ws.theme}`}>
                      {ws.initial}
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className={`text-sm font-bold transition-colors ${activeWorkspaceId === ws.id ? "text-primary" : "text-zinc-300 group-hover:text-white"}`}>
                        {ws.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate w-full text-left">{ws.role}</span>
                    </div>
                    {activeWorkspaceId === ws.id && (
                       <Check className="w-4 h-4 text-primary absolute right-3" />
                    )}
                  </button>
                ))}
                
                <div className="h-px bg-zinc-800 my-1" />
                <button className="flex items-center justify-center gap-2 p-2 w-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                  + Create New Team
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feature 9: Onboarding Setup Guide Popover */}
        <SetupGuidePopover />

        {/* Notifications */}
        <div
          className="relative"
          onMouseEnter={() => setShowNotifications(true)}
          onMouseLeave={() => setShowNotifications(false)}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary transition-all"
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-primary text-xs text-white"
            >
              3
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-72 sm:w-80 rounded-lg border border-border bg-card shadow-lg"
              >
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold mb-3 text-sm md:text-base">Notifications</h3>
                  <div className="space-y-2 md:space-y-3">
                    {[
                      { title: "Request Updated", message: "Your legal contract request is in progress", time: "5m ago" },
                      { title: "New Message", message: "Expert commented on your request", time: "1h ago" },
                      { title: "Payment Received", message: "Invoice #2026-001 has been paid", time: "2h ago" },
                    ].map((notif, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-2 md:p-3 rounded-lg hover:bg-secondary/50 transition-all cursor-pointer"
                      >
                        <p className="font-medium text-xs md:text-sm">{notif.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
                        <p className="text-xs text-primary mt-1">{notif.time}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 transition-all"
          >
            <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-56 md:w-64 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
              >
                <div className="p-3 md:p-4 border-b border-border">
                  <p className="font-semibold text-sm md:text-base truncate">{user?.name || "User"}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{user?.email}</p>
                </div>
                
                <div className="p-2 border-b border-border">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Appearance</div>
                  
                  <button onClick={toggleEyeCare} className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-xs md:text-sm hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-2">
                       <Eye className="h-3.5 w-3.5 text-zinc-400" />
                       <span className={eyeCare ? "text-primary font-medium" : "text-zinc-300"}>Eye Care</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${eyeCare ? "bg-primary" : "bg-zinc-800"}`}>
                       <motion.div animate={{ x: eyeCare ? 16 : 0 }} className="w-3 h-3 bg-white rounded-full shadow-sm" />
                    </div>
                  </button>

                  <button onClick={toggleVividMode} className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-xs md:text-sm hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-2">
                       <Monitor className="h-3.5 w-3.5 text-zinc-400" />
                       <span className={vividMode ? "text-primary font-medium" : "text-zinc-300"}>Vivid Mode</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${vividMode ? "bg-primary" : "bg-zinc-800"}`}>
                       <motion.div animate={{ x: vividMode ? 16 : 0 }} className="w-3 h-3 bg-white rounded-full shadow-sm" />
                    </div>
                  </button>

                  <button onClick={toggleSimpleFont} className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-xs md:text-sm hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-2">
                       <Type className="h-3.5 w-3.5 text-zinc-400" />
                       <span className={simpleFont ? "text-primary font-medium" : "text-zinc-300"}>Simple Type</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${simpleFont ? "bg-primary" : "bg-zinc-800"}`}>
                       <motion.div animate={{ x: simpleFont ? 16 : 0 }} className="w-3 h-3 bg-white rounded-full shadow-sm" />
                    </div>
                  </button>
                </div>

                <div className="p-2">
                  <motion.button
                    whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs md:text-sm transition-colors text-zinc-400 hover:text-white"
                  >
                    <LogOut className="h-3 w-3 md:h-4 md:w-4" />
                    Logout
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
