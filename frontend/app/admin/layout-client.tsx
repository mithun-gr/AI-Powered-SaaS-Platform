"use client";

import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/page-transition";
import { useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Use cookie-based session (set by login + Google OAuth callback)
    const session = getAuthSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    // Sync to localStorage for backwards compat
    try {
      const existing = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (!existing.email) {
        localStorage.setItem("user", JSON.stringify({ email: session.email, name: session.name, role: session.role }));
      }
    } catch {}
    setIsVerified(true);
  }, [router]);

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Verifying session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isAdmin={true}
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
    </div>
  );
}
