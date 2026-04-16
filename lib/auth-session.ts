/**
 * lib/auth-session.ts
 *
 * Google-style session management:
 * ─ Always persistent (no expiry under normal use)
 * ─ Sliding window: expiry resets on every page visit (active use → never expires)
 * ─ Only ends on: explicit logout | password change | security revocation
 * ─ Read by proxy.ts server-side before any page renders (zero flash)
 */

const COOKIE_NAME = "mrc_auth";

// 10 years in ms/s — effectively permanent (matches Google's approach)
const PERMANENT_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;
const PERMANENT_S  = Math.floor(10 * 365.25 * 24 * 60 * 60);
const SHORT_MS     = 2 * 60 * 60 * 1000; // 2 hours

// Slide threshold: renew cookie if less than 30 days remain (keeps it perpetually fresh)
const SLIDE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthSession {
  role: "client" | "admin";
  email: string;
  name: string;
  exp: number;
}

/** Write (or renew) the auth cookie */
export function setAuthCookie(
  role: "client" | "admin",
  email: string,
  name: string,
  rememberMe = true
): void {
  const session: AuthSession = {
    role,
    email,
    name,
    exp: Date.now() + (rememberMe ? PERMANENT_MS : SHORT_MS),
  };
  const value = encodeURIComponent(JSON.stringify(session));
  const maxAge = rememberMe ? `; max-age=${PERMANENT_S}` : "";
  document.cookie = `${COOKIE_NAME}=${value}; path=/; SameSite=Lax${maxAge}`;
}
/** Clear the auth cookie on logout */
export function clearAuthCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Read the auth session from the cookie (client-side).
 * Implements sliding window — renews expiry if < 30 days remain.
 */
export function getAuthSession(): AuthSession | null {
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`));
    if (!match) return null;
    const raw = match.split("=").slice(1).join("=");

    // Handle both plain JSON (set by server) and URI-encoded (set by client)
    let data: AuthSession | null = null;
    for (const attempt of [raw, decodeURIComponent(raw)]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(attempt));
        if (parsed?.role && parsed?.email && parsed?.exp) { data = parsed; break; }
      } catch {}
      try {
        const parsed = JSON.parse(attempt);
        if (parsed?.role && parsed?.email && parsed?.exp) { data = parsed; break; }
      } catch {}
    }

    if (!data) return null;

    // Expired? Clear and return null (explicit revocation)
    if (Date.now() > data.exp) {
      clearAuthCookie();
      return null;
    }

    // Sliding window: if < 30 days remain, silently renew to full 10 years
    // We assume if it has > 2 days remaining initially, it was a permanent session
    if (data.exp - Date.now() > 2 * 24 * 60 * 60 * 1000 && data.exp - Date.now() < SLIDE_THRESHOLD_MS) {
      setAuthCookie(data.role, data.email, data.name, true);
    }

    return data;
  } catch {
    return null;
  }
}

/** Check if a valid session exists (client-side) */
export function isAuthenticated(): boolean {
  return getAuthSession() !== null;
}
