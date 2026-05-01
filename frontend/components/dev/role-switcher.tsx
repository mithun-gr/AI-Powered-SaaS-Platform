"use client";

/**
 * components/dev/role-switcher.tsx
 *
 * Role Preview Panel — lets you instantly switch between all 7 hierarchy roles
 * to see how the UI adapts (sidebar nav, badges, page guards, etc.)
 *
 * Available in: Admin workspace only (internal roles)
 * Pattern: Similar to Salesforce's "Login As" / Linear's role preview
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronRight, X, Eye, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

// Role definitions mirroring lib/rbac.ts
const ROLES = [
  {
    role: "founder",
    label: "Founder",
    desc: "God-mode: full platform access",
    color: "from-yellow-500 to-orange-500",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
    workspace: "/admin",
    emoji: "👑",
  },
  {
    role: "ceo",
    label: "CEO",
    desc: "All access except AI Engine",
    color: "from-purple-500 to-violet-500",
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    dot: "bg-purple-400",
    workspace: "/admin",
    emoji: "🏢",
  },
  {
    role: "cfo",
    label: "CFO",
    desc: "Finance, invoices & security",
    color: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
    workspace: "/admin",
    emoji: "💰",
  },
  {
    role: "cto",
    label: "CTO",
    desc: "Tech: AI Engine, security & settings",
    color: "from-blue-500 to-cyan-500",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    workspace: "/admin",
    emoji: "⚙️",
  },
  {
    role: "supervisor",
    label: "Supervisor",
    desc: "Domain-scoped team management",
    color: "from-indigo-500 to-blue-500",
    badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    dot: "bg-indigo-400",
    workspace: "/admin",
    emoji: "👔",
  },
  {
    role: "employee",
    label: "Employee",
    desc: "Basic: clients & requests only",
    color: "from-zinc-500 to-slate-500",
    badge: "bg-zinc-500/20 text-zinc-400 border-zinc-700",
    dot: "bg-zinc-400",
    workspace: "/admin",
    emoji: "🧑‍💼",
  },
  {
    role: "client",
    label: "Client",
    desc: "Customer portal view",
    color: "from-rose-500 to-pink-500",
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    dot: "bg-rose-400",
    workspace: "/dashboard",
    emoji: "👤",
  },
] as const;

type RoleKey = (typeof ROLES)[number]["role"];

function setCookieRole(role: RoleKey, currentEmail: string, currentName: string) {
  const PERMANENT_S = Math.floor(10 * 365.25 * 24 * 60 * 60);
  const session = {
    role,
    email: currentEmail || "preview@morchantra.com",
    name: currentName || "Preview User",
    domain: role === "supervisor" || role === "employee" ? "legal" : "all",
    exp: Date.now() + PERMANENT_S * 1000,
  };
  const value = encodeURIComponent(JSON.stringify(session));
  document.cookie = `mrc_auth=${value}; path=/; SameSite=Lax; max-age=${PERMANENT_S}`;
}

function getCurrentRoleFromCookie(): RoleKey {
  try {
    const match = document.cookie.split("; ").find(r => r.startsWith("mrc_auth="));
    if (!match) return "client";
    const raw = match.split("=").slice(1).join("=");
    for (const attempt of [raw, decodeURIComponent(raw)]) {
      try { const p = JSON.parse(attempt); if (p?.role) return p.role as RoleKey; } catch {}
    }
  } catch {}
  return "client";
}

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleKey>("client");
  const [switching, setSwitching] = useState<RoleKey | null>(null);
  const router = useRouter();

  useEffect(() => {
    setActiveRole(getCurrentRoleFromCookie());
  }, []);

  const handleSwitch = async (roleDef: (typeof ROLES)[number]) => {
    setSwitching(roleDef.role);

    // Read current session details to preserve them
    let email = "preview@morchantra.com";
    let name = "Preview User";
    try {
      const match = document.cookie.split("; ").find(r => r.startsWith("mrc_auth="));
      if (match) {
        const raw = match.split("=").slice(1).join("=");
        for (const attempt of [raw, decodeURIComponent(raw)]) {
          try {
            const p = JSON.parse(attempt);
            if (p?.email) { email = p.email; name = p.name || name; break; }
          } catch {}
        }
      }
    } catch {}

    // Assign mapped name by role for clarity
    const roleNames: Record<RoleKey, string> = {
      founder: "Alex Morchantra",
      ceo: "Sarah Johnson",
      cfo: "Michael Chen",
      cto: "Priya Patel",
      supervisor: "Legal Supervisor",
      employee: "Team Member",
      client: "Demo Client",
    };

    setCookieRole(roleDef.role, email, roleNames[roleDef.role]);
    setActiveRole(roleDef.role);

    await new Promise(r => setTimeout(r, 400)); // brief visual feedback
    setSwitching(null);
    setOpen(false);
    router.push(roleDef.workspace);
    router.refresh();
  };

  const current = ROLES.find(r => r.role === activeRole) ?? ROLES[6];

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 left-[272px] z-50">
        <motion.button
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-zinc-950 border border-zinc-700 hover:border-primary/50 rounded-xl px-3 py-2 shadow-2xl shadow-black/50 transition-colors group"
        >
          <div className={`w-2 h-2 rounded-full ${current.dot} shadow-[0_0_8px_currentColor]`} />
          <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
            {current.emoji} {current.label}
          </span>
          <Eye className="w-3 h-3 text-zinc-500 group-hover:text-primary transition-colors" />
        </motion.button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: -16, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -16, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="fixed bottom-20 left-[272px] z-50 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">Role Preview</p>
                    <p className="text-[10px] text-zinc-500">Switch to any role to preview its view</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Role list */}
              <div className="p-2 space-y-1 max-h-[420px] overflow-y-auto">
                {ROLES.map((roleDef) => {
                  const isActive = activeRole === roleDef.role;
                  const isSwitching = switching === roleDef.role;

                  return (
                    <motion.button
                      key={roleDef.role}
                      onClick={() => !isActive && handleSwitch(roleDef)}
                      whileHover={!isActive ? { x: 2 } : {}}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                        isActive
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-zinc-900 border border-transparent"
                      }`}
                    >
                      {/* Emoji */}
                      <span className="text-lg leading-none w-7 text-center">{roleDef.emoji}</span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${isActive ? "text-primary" : "text-zinc-200"}`}>
                            {roleDef.label}
                          </p>
                          {isActive && (
                            <span className="text-[9px] font-black text-primary bg-primary/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">{roleDef.desc}</p>
                        <p className="text-[9px] text-zinc-600 mt-0.5">
                          → {roleDef.workspace}
                        </p>
                      </div>

                      {/* Arrow / Spinner */}
                      <div className="shrink-0">
                        {isSwitching ? (
                          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        ) : (
                          <ChevronRight className={`w-4 h-4 transition-colors ${
                            isActive ? "text-primary" : "text-zinc-600 group-hover:text-zinc-300"
                          }`} />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer note */}
              <div className="px-4 py-2.5 border-t border-zinc-800/60 bg-zinc-900/40">
                <p className="text-[9px] text-zinc-600 text-center uppercase tracking-widest font-semibold">
                  Preview Mode — Cookie-based role simulation
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
