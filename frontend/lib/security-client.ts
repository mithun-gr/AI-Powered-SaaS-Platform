/**
 * lib/security-client.ts
 * Client-side security utilities — fingerprint, session checks, API wrappers.
 */

// ─── Device fingerprint (non-invasive, privacy-safe) ─────────────────────────
export async function getDeviceFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency ?? 0,
  ].join("|");

  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown Device";
}

// ─── Session version guard ────────────────────────────────────────────────────
const SESSION_KEY = "morchantra_sv"; // session version

export function storeSessionVersion(version: number): void {
  localStorage.setItem(SESSION_KEY, String(version));
}

export function getStoredSessionVersion(): number {
  return Number(localStorage.getItem(SESSION_KEY) ?? "1");
}

export async function validateSession(userId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get-session-version", userId }),
    });
    const { version } = await res.json();
    return version <= getStoredSessionVersion(); // server version must not exceed stored
  } catch {
    return true; // if API fails, don't block the user
  }
}

// ─── Security API wrappers ────────────────────────────────────────────────────
async function secApi(body: object): Promise<any> {
  const res = await fetch("/api/security", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function logSecurityEvent(
  userId: string,
  event: string,
  level: "info" | "warning" | "critical" = "info"
): Promise<void> {
  await secApi({ action: "log-event", userId, event, level }).catch(() => {});
}

export async function sendSecurityAlert(
  userId: string,
  email: string,
  title: string,
  body: string
): Promise<boolean> {
  const res = await secApi({ action: "send-security-alert", userId, email, title, body });
  return res?.sent === true;
}

export async function invalidateSessions(userId: string): Promise<number> {
  const res = await secApi({ action: "invalidate-sessions", userId });
  if (res?.version) storeSessionVersion(res.version);
  return res?.version ?? 1;
}

export async function generateBackupCodes(userId: string): Promise<string[]> {
  const res = await secApi({ action: "generate-backup-codes", userId });
  return res?.codes ?? [];
}

export async function getBackupCodeStatus(userId: string): Promise<{ total: number; remaining: number }> {
  const res = await secApi({ action: "backup-code-status", userId });
  return res ?? { total: 0, remaining: 0 };
}

export async function listTrustedDevices(userId: string): Promise<any[]> {
  const res = await secApi({ action: "list-trusted-devices", userId });
  return res?.devices ?? [];
}

export async function revokeTrustedDevice(userId: string, fingerprint: string): Promise<void> {
  await secApi({ action: "revoke-trusted-device", userId, fingerprint });
}

export async function revokeAllDevices(userId: string): Promise<void> {
  await secApi({ action: "revoke-all-devices", userId });
}

export async function sendEmailOTP(userId: string, email: string): Promise<boolean> {
  const res = await secApi({ action: "send-email-otp", userId, email });
  return res?.sent === true;
}

export async function verifyEmailOTP(userId: string, otp: string): Promise<"ok" | "expired" | "invalid" | "too_many"> {
  const res = await secApi({ action: "verify-email-otp", userId, otp });
  return res?.result ?? "invalid";
}

export async function registerTrustedDevice(userId: string): Promise<void> {
  const fingerprint = await getDeviceFingerprint();
  const label = getDeviceLabel();
  await secApi({ action: "register-trusted-device", userId, fingerprint, label });
}

export async function checkTrustedDevice(userId: string): Promise<boolean> {
  const fingerprint = await getDeviceFingerprint();
  const res = await secApi({ action: "check-trusted-device", userId, fingerprint });
  return res?.trusted === true;
}
