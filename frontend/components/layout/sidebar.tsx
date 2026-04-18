"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthSession } from "@/lib/auth-session";
import {
    LayoutDashboard,
    FileText,
    Calendar,
    FolderOpen,
    CreditCard,
    MessageCircle,
    Settings,
    ShieldCheck,
    Users,
    BarChart3,
    Receipt,
    X,
    Bot,
    Store,
    LogOut,
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

const adminMenuItems = [
    { name: "Dashboard", href: "/admin",           icon: LayoutDashboard },
    { name: "Clients",   href: "/admin/clients",   icon: Users },
    { name: "Requests",  href: "/admin/requests",  icon: FileText },
    { name: "Invoices",  href: "/admin/invoices",  icon: Receipt },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Settings",  href: "/settings",         icon: Settings },
];

interface SidebarProps {
    isAdmin?: boolean;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

// ── User footer shown at the bottom of the sidebar ──────────────────────────
function SidebarUserFooter({ isAdmin }: { isAdmin: boolean }) {
    const [name, setName] = useState(isAdmin ? "Admin" : "Client");
    const [email, setEmail] = useState("");

    useEffect(() => {
        const session = getAuthSession();
        if (session) {
            setName(session.name);
            setEmail(session.email);
        }
    }, [isAdmin]);

    const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

    const handleLogout = () => {
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
                    <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{email}</p>
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

// ── Shared nav list ─────────────────────────────────────────────────────────
function NavItems({ menuItems, pathname, onItemClick }: {
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

export function Sidebar({ isAdmin = false, isMobileOpen = false, onMobileClose }: SidebarProps) {
    const pathname   = usePathname();
    const menuItems  = isAdmin ? adminMenuItems : clientMenuItems;
    const logoHref   = isAdmin ? "/admin" : "/dashboard";

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

            {/* ── Desktop sidebar ── */}
            <aside className="hidden sm:flex sm:w-64 sm:flex-col sm:fixed sm:inset-y-0 sm:z-50 sm:bg-card sm:border-r sm:border-border">
                <div className="flex flex-col h-full">

                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                        <Link href={logoHref} className="flex items-center">
                            <h1 className="text-2xl font-bold">
                                <span className="text-white">Mor</span>
                                <span className="text-primary">chantra</span>
                            </h1>
                        </Link>
                        <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20 font-semibold">
                            {isAdmin ? "ADMIN" : "CLIENT"}
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 pt-4 pb-8 space-y-1 overflow-y-auto">
                        <NavItems menuItems={menuItems} pathname={pathname} />
                    </nav>

                    {/* Footer — user avatar + logout */}
                    <SidebarUserFooter isAdmin={isAdmin} />
                </div>
            </aside>

            {/* ── Mobile slide-in sidebar ── */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.aside
                        initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border sm:hidden"
                    >
                        <div className="flex flex-col h-full">

                            {/* Logo */}
                            <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                                <Link href={logoHref} className="flex items-center" onClick={onMobileClose}>
                                    <h1 className="text-2xl font-bold">
                                        <span className="text-white">Mor</span>
                                        <span className="text-primary">chantra</span>
                                    </h1>
                                </Link>
                                <button onClick={onMobileClose} className="text-muted-foreground hover:text-white">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 px-3 pt-4 pb-8 space-y-1 overflow-y-auto">
                                <NavItems menuItems={menuItems} pathname={pathname} onItemClick={onMobileClose} />
                            </nav>

                            {/* Footer */}
                            <SidebarUserFooter isAdmin={isAdmin} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
