/**
 * proxy.ts — server-side route protection (Next.js 16+)
 *
 * Runs on every request BEFORE the page renders.
 * No flash. No client-side bypass.
 */

import { NextRequest, NextResponse } from "next/server";

// ── Public paths (no auth required) ────────────────────────────────────────
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",           // OAuth callbacks: /auth/callback
  "/api/auth",       // Supabase auth helpers
];

// ── Admin-only paths ────────────────────────────────────────────────────────
const ADMIN_PREFIXES = ["/admin"];

function isStaticOrApi(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.[a-z0-9]+$/i.test(pathname) // any file with extension
  );
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?")
  );
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// ── Read auth cookie ─────────────────────────────────────────────────────────
function getAuthFromCookie(req: NextRequest): { role: string; email: string; exp: number } | null {
  try {
    const raw = req.cookies.get("mrc_auth")?.value;
    if (!raw) return null;

    // Try plain JSON first (new path — set by response.cookies.set which handles encoding)
    // Then try URL-decoded (old path — set by document.cookie with encodeURIComponent)
    let data: { role: string; email: string; exp: number } | null = null;
    for (const attempt of [raw, decodeURIComponent(raw)]) {
      try {
        const parsed = JSON.parse(attempt);
        if (parsed?.role && parsed?.exp) { data = parsed; break; }
      } catch {}
    }

    if (!data?.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

// ── Proxy handler ────────────────────────────────────────────────────────────
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Never intercept static assets or API routes
  if (isStaticOrApi(pathname)) return NextResponse.next();

  // 2. Always allow public paths
  if (isPublicPath(pathname)) {
    // If already authenticated, bounce away from login
    const auth = getAuthFromCookie(req);
    if (auth && (pathname === "/login" || pathname === "/")) {
      return NextResponse.redirect(
        new URL(auth.role === "admin" ? "/admin" : "/dashboard", req.url)
      );
    }
    return NextResponse.next();
  }

  // 3. Root path "/" — redirect to login if not auth'd, or to dashboard if auth'd
  if (pathname === "/") {
    const auth = getAuthFromCookie(req);
    return NextResponse.redirect(
      new URL(auth ? (auth.role === "admin" ? "/admin" : "/dashboard") : "/login", req.url)
    );
  }

  // 4. Check auth for protected routes
  const auth = getAuthFromCookie(req);
  if (!auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Role guard — client can't reach /admin, admin gets redirected to /admin
  if (isAdminPath(pathname) && auth.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
