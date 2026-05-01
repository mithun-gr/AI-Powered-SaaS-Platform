"use client";

import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/page-transition";
import { GlobalLimitModal } from "@/components/global-limit-modal";
import { CommandPalette } from "@/components/command-palette";
import { useRouter, usePathname } from "next/navigation";
import { getAuthSession, clearAuthCookie } from "@/lib/auth-session";
import { isInternalRole } from "@/lib/rbac";
import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";
import { RoleSwitcher } from "@/components/dev/role-switcher";

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // ← starts false — nothing renders
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    // Layer 1: Check the auth cookie
    const session = getAuthSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    // Layer 2: Validate role — redirect all internal hierarchy roles to /admin
    // Allow internal roles to reach /settings only
    if (isInternalRole(session.role) && pathname !== "/settings") {
      router.replace("/admin");
      return;
    }

    // Layer 3: Mirror to localStorage for backwards compat
    try {
      const existing = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (!existing.email) {
        localStorage.setItem("user", JSON.stringify({
          email: session.email,
          name: session.name,
          role: session.role,
        }));
      }
    } catch {}

    setIsVerified(true);
  }, [router, pathname]);

  if (!isVerified) return <DashboardSkeleton />;

  // Determine if we should show the Admin or Client sidebar based on actual user role
  const userSession = getAuthSession();
  const isAdmin = isInternalRole(userSession?.role ?? "client");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isAdmin={isAdmin}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="sm:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
        <Navbar onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <RoleSwitcher />
      <GlobalLimitModal />
      <CommandPalette />
    </div>
  );
}
