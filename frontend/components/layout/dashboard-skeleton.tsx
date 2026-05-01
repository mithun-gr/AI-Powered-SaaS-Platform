"use client";

/**
 * components/layout/dashboard-skeleton.tsx
 *
 * Shows a realistic skeleton of the dashboard layout while the auth session
 * is being verified client-side. This eliminates the "black flash" flicker
 * caused by the isVerified=false state in layout-client.tsx.
 *
 * Design: mirrors the actual sidebar + content area layout so the transition
 * into the real page feels instant and smooth.
 */

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Fake sidebar */}
      <aside className="hidden sm:flex sm:w-64 sm:flex-col sm:fixed sm:inset-y-0 sm:z-50 bg-card border-r border-border">
        <div className="flex flex-col h-full p-4 gap-4 animate-pulse">
          {/* Logo */}
          <div className="h-16 flex items-center px-2">
            <div className="h-6 w-32 bg-muted rounded-md" />
          </div>
          {/* Nav items */}
          <div className="space-y-2 flex-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-md">
                <div className="h-5 w-5 bg-muted rounded" />
                <div className="h-4 bg-muted rounded flex-1" style={{ width: `${60 + (i % 3) * 15}%` }} />
              </div>
            ))}
          </div>
          {/* User footer */}
          <div className="border-t border-border pt-4 flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-2.5 w-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      </aside>

      {/* Fake main content */}
      <div className="sm:ml-64 flex flex-col flex-1 min-h-screen">
        {/* Fake navbar */}
        <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 animate-pulse">
          <div className="h-4 w-40 bg-muted rounded" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
        </div>

        {/* Fake page content */}
        <main className="flex-1 p-6 space-y-6 animate-pulse">
          {/* Page title */}
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded" />
            <div className="h-4 w-72 bg-muted rounded" />
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>

          {/* Content rows */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="h-5 w-32 bg-muted rounded" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <div className="h-4 w-4 rounded bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded" style={{ width: `${50 + (i % 3) * 15}%` }} />
                    <div className="h-2.5 w-24 bg-muted rounded" />
                  </div>
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="h-5 w-24 bg-muted rounded" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
