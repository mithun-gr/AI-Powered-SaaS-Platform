"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthSession } from "@/lib/auth-session";
import { AccessibilityPanel } from "@/components/accessibility-panel";
import {
  X,
  LogOut,
  Globe,
} from "lucide-react";
import {
  type Role,
  type NavItem,
  ROLE_META,
  DOMAIN_META,
  getNavForRole,
  isInternalRole,
  hasGlobalDomainAccess,
} from "@/lib/rbac";

// ── Client sidebar items ─────────────────────────────────────────────────────
import {
  LayoutDashboard,
  FileText,
  Calendar,
  FolderOpen,
  CreditCard,
  MessageCircle,
  Settings,
  BarChart3,
  Bot,
  Store,
} from "lucide-react";

const clientMenuItems = [
  { name: "Overview",            href: "/dashboard",    icon: LayoutDashboard },
  { name: "Analytics & ROI",     href: "/analytics",    icon: BarChart3 },
  { name: "Partner Marketplace", href: "/marketplace",  icon: Store },
  { name: "AI Tools",            href: "/tools",        icon: Bot },
  { name: "My Requests",         href: "/requests",     icon: FileText },
  { name: "Book Consultation",   href: "/requests/new", icon: Calendar },
  { name: "Document Vault",      href: "/documents",    icon: FolderOpen },
  { name: "Payments",            href: "/payments",     icon: CreditCard },
  { name: "Chat Support",        href: "/support",      icon: MessageCircle },
  { name: "Settings",            href: "/settings",     icon: Settings },
];

// ── Interfaces ───────────────────────────────────────────────────────────────

interface SidebarProps {
  isAdmin?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface SessionData {
  role: string;
  domain?: string;
  name: string;
  email: string;
  picture?: string;
}

// ── User footer ──────────────────────────────────────────────────────────────

function SidebarUserFooter({ session }: { session: SessionData | null }) {
  const name = session?.name ?? "User";
  const email = session?.email ?? "";
  const role = (session?.role ?? "client") as Role;
  const domain = session?.domain;

  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const roleMeta = ROLE_META[role] ?? ROLE_META.client;

  const handleLogout = () => {
    document.cookie = "mrc_auth=; path=/; max-age=0";
    document.cookie = "mrc_user=; path=/; max-age=0";
    document.cookie = "mrc_session=; path=/; max-age=0";
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex-shrink-0 px-4 py-4 border-t border-border">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors group">
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 ring-1 ring-primary/30">
          <span className="text-xs font-bold text-primary">{initials}</span>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-foreground truncate">{name}</p>
            {/* Role badge — only shown for internal hierarchy roles */}
            {isInternalRole(role) && (
              <span className={cn(
                "text-[9px] font-bold px-1 py-0.5 rounded border leading-none shrink-0",
                roleMeta.color
              )}>
                {roleMeta.label}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          {/* Domain badge — only shown for scoped roles */}
          {domain && domain !== "all" && !hasGlobalDomainAccess(role) && (
            <div className="flex items-center gap-1 mt-0.5">
              <Globe className="h-2.5 w-2.5 text-muted-foreground/60" />
              <span className={cn("text-[9px] font-medium", DOMAIN_META[domain as keyof typeof DOMAIN_META]?.color ?? "text-muted-foreground")}>
                {DOMAIN_META[domain as keyof typeof DOMAIN_META]?.label ?? domain}
              </span>
            </div>
          )}
          {domain === "all" && isInternalRole(role) && (
            <div className="flex items-center gap-1 mt-0.5">
              <Globe className="h-2.5 w-2.5 text-muted-foreground/60" />
              <span className="text-[9px] font-medium text-muted-foreground">All Domains</span>
            </div>
          )}
        </div>
        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
        © 2026 Morchantra
      </p>
    </div>
  );
}

// ── Nav items renderer ───────────────────────────────────────────────────────

function AdminNavItems({ items, pathname, onItemClick }: {
  items: NavItem[];
  pathname: string | null;
  onItemClick?: () => void;
}) {
  const activeItem = items.reduce((best, item) => {
    const isMatch = pathname === item.href || pathname?.startsWith(item.href + "/");
    if (isMatch && item.href !== "/admin") {
      if (!best || item.href.length > best.href.length) return item;
    }
    if (pathname === "/admin" && item.href === "/admin") return item;
    return best;
  }, null as NavItem | null);

  return (
    <>
      {items.map((item) => {
        const isActive = activeItem?.href === item.href;
        const Icon = item.icon;
        return (
          <div key={item.name}>
            {item.dividerBefore && (
              <div className="my-1.5 border-t border-zinc-800" />
            )}
            <Link
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-gray-400 hover:bg-secondary hover:text-white"
              )}
            >
              <Icon className={cn(
                "mr-3 flex-shrink-0 h-5 w-5",
                isActive ? "text-primary" : "text-gray-400 group-hover:text-white"
              )} />
              {item.name}
            </Link>
          </div>
        );
      })}
    </>
  );
}

function ClientNavItems({ menuItems, pathname, onItemClick }: {
  menuItems: typeof clientMenuItems;
  pathname: string | null;
  onItemClick?: () => void;
}) {
  const activeItem = menuItems.reduce((best, item) => {
    const isMatch = pathname === item.href || pathname?.startsWith(item.href + "/");
    if (isMatch) {
      if (!best || item.href.length > best.href.length) return item;
    }
    return best;
  }, null as typeof menuItems[0] | null);

  return (
    <>
      {menuItems.map((item) => {
        const isActive = activeItem?.href === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all",
              isActive
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-gray-400 hover:bg-secondary hover:text-white"
            )}
          >
            <Icon className={cn(
              "mr-3 flex-shrink-0 h-5 w-5",
              isActive ? "text-primary" : "text-gray-400 group-hover:text-white"
            )} />
            {item.name}
          </Link>
        );
      })}
    </>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar({ isAdmin = false, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    const s = getAuthSession() as SessionData | null;
    setSession(s);
    if (s && isInternalRole(s.role)) {
      setNavItems(getNavForRole(s.role as Role));
    }
  }, []);

  const role = (session?.role ?? "client") as Role;
  const roleMeta = ROLE_META[role] ?? ROLE_META.client;
  const logoHref = isAdmin ? "/admin" : "/dashboard";

  function SidebarInner({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href={logoHref} className="flex items-center" onClick={mobile ? onMobileClose : undefined}>
            <h1 className="text-2xl font-bold">
              <span className="text-white">Mor</span>
              <span className="text-primary">chantra</span>
            </h1>
          </Link>
          <div className="flex items-center gap-1.5">
            {isInternalRole(role) && (
              <span className={cn(
                "px-2 py-0.5 rounded text-xs border font-bold leading-none",
                roleMeta.color
              )}>
                {roleMeta.label}
              </span>
            )}
            {mobile && (
              <button onClick={onMobileClose} className="text-muted-foreground hover:text-white ml-1">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 pb-8 space-y-1 overflow-y-auto">
          {isAdmin && navItems.length > 0 ? (
            <AdminNavItems items={navItems} pathname={pathname} onItemClick={mobile ? onMobileClose : undefined} />
          ) : (
            <ClientNavItems menuItems={clientMenuItems} pathname={pathname} onItemClick={mobile ? onMobileClose : undefined} />
          )}
          <div className="pt-2 mt-2 border-t border-zinc-800">
            <AccessibilityPanel />
          </div>
        </nav>

        {/* Footer */}
        <SidebarUserFooter session={session} />
      </div>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/60 z-40 sm:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex sm:w-64 sm:flex-col sm:fixed sm:inset-y-0 sm:z-50 sm:bg-card sm:border-r sm:border-border">
        <SidebarInner />
      </aside>

      {/* Mobile slide-in sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border sm:hidden"
          >
            <SidebarInner mobile />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
