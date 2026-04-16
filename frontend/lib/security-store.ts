/**
 * lib/security-store.ts
 * Server-side in-memory stores for security subsystems.
 * In production, replace with Supabase/Redis persistence.
 */

import { createHash, randomBytes } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  userId: string;
  event: string;       // e.g. "2FA_ENABLED", "LOGIN_SUCCESS"
  ip: string;
  userAgent: string;
  timestamp: number;
  level: "info" | "warning" | "critical";
}

export interface BackupCode {
  hash: string;       // SHA-256(code)
  used: boolean;
  usedAt?: number;
}

export interface EmailOTP {
  hash: string;       // SHA-256(otp)
  email: string;
  expiresAt: number;  // 10-minute TTL
  attempts: number;
}

export interface TrustedDevice {
  fingerprint: string;
  label: string;
  ip: string;
  addedAt: number;
  expiresAt: number;  // 30-day TTL
  lastUsed: number;
}

export interface SecuritySession {
  version: number;          // increment on security events to invalidate other sessions
  trustedDevices: Map<string, TrustedDevice>;
  backupCodes: BackupCode[];
  auditLog: AuditEvent[];
  emailOTP: EmailOTP | null;
}

// ─── In-memory store (keyed by userId/email) ──────────────────────────────────

const store = new Map<string, SecuritySession>();

function getOrCreate(userId: string): SecuritySession {
  if (!store.has(userId)) {
    store.set(userId, {
      version: 1,
      trustedDevices: new Map(),
      backupCodes: [],
      auditLog: [],
      emailOTP: null,
    });
  }
  return store.get(userId)!;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export function logAuditEvent(
  userId: string,
  event: string,
  ip: string,
  userAgent: string,
  level: AuditEvent["level"] = "info"
): AuditEvent {
  const session = getOrCreate(userId);
  const entry: AuditEvent = {
    id: randomBytes(8).toString("hex"),
    userId,
    event,
    ip,
    userAgent,
    timestamp: Date.now(),
    level,
  };
  session.auditLog.unshift(entry);
  if (session.auditLog.length > 100) session.auditLog.pop(); // keep last 100
  return entry;
}

export function getAuditLog(userId: string, limit = 20): AuditEvent[] {
  return (store.get(userId)?.auditLog ?? []).slice(0, limit);
}

// ─── Session versioning ───────────────────────────────────────────────────────

export function getSessionVersion(userId: string): number {
  return getOrCreate(userId).version;
}

export function incrementSessionVersion(userId: string): number {
  const s = getOrCreate(userId);
  s.version++;
  return s.version;
}

// ─── Backup Codes ─────────────────────────────────────────────────────────────

function hashCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function generateBackupCodes(userId: string): string[] {
  const plainCodes: string[] = [];
  const hashed: BackupCode[] = [];

  for (let i = 0; i < 8; i++) {
    const raw = randomBytes(4).toString("hex").toUpperCase(); // e.g. "A1B2C3D4"
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`; // "A1B2-C3D4"
    plainCodes.push(formatted);
    hashed.push({ hash: hashCode(formatted), used: false });
  }

  getOrCreate(userId).backupCodes = hashed;
  return plainCodes;
}

export function verifyBackupCode(userId: string, code: string): boolean {
  const session = store.get(userId);
  if (!session) return false;

  const target = hashCode(code);
  const entry = session.backupCodes.find((bc) => bc.hash === target && !bc.used);
  if (!entry) return false;

  entry.used = true;
  entry.usedAt = Date.now();
  return true;
}

export function getBackupCodeStatus(userId: string): { total: number; remaining: number } {
  const codes = store.get(userId)?.backupCodes ?? [];
  return {
    total: codes.length,
    remaining: codes.filter((c) => !c.used).length,
  };
}

// ─── Email OTP ────────────────────────────────────────────────────────────────

export function createEmailOTP(userId: string, email: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const session = getOrCreate(userId);
  session.emailOTP = {
    hash: createHash("sha256").update(otp).digest("hex"),
    email,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    attempts: 0,
  };
  return otp;
}

export function verifyEmailOTP(userId: string, otp: string): "ok" | "expired" | "invalid" | "too_many" {
  const session = store.get(userId);
  if (!session?.emailOTP) return "invalid";

  const entry = session.emailOTP;
  if (Date.now() > entry.expiresAt) { session.emailOTP = null; return "expired"; }
  if (entry.attempts >= 5) return "too_many";

  entry.attempts++;
  const hash = createHash("sha256").update(otp.trim()).digest("hex");
  if (hash !== entry.hash) return "invalid";

  session.emailOTP = null; // one-time use
  return "ok";
}

// ─── Trusted Devices ──────────────────────────────────────────────────────────

export function registerTrustedDevice(
  userId: string,
  fingerprint: string,
  label: string,
  ip: string
): void {
  const session = getOrCreate(userId);
  session.trustedDevices.set(fingerprint, {
    fingerprint,
    label,
    ip,
    addedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    lastUsed: Date.now(),
  });
}

export function isTrustedDevice(userId: string, fingerprint: string): boolean {
  const device = store.get(userId)?.trustedDevices.get(fingerprint);
  if (!device) return false;
  if (Date.now() > device.expiresAt) {
    store.get(userId)!.trustedDevices.delete(fingerprint);
    return false;
  }
  device.lastUsed = Date.now();
  return true;
}

export function listTrustedDevices(userId: string): TrustedDevice[] {
  const devices = store.get(userId)?.trustedDevices ?? new Map();
  const now = Date.now();
  return Array.from(devices.values())
    .filter((d) => now < d.expiresAt)
    .sort((a, b) => b.lastUsed - a.lastUsed);
}

export function revokeTrustedDevice(userId: string, fingerprint: string): void {
  store.get(userId)?.trustedDevices.delete(fingerprint);
}

export function revokeAllTrustedDevices(userId: string): void {
  const s = store.get(userId);
  if (s) s.trustedDevices.clear();
}

// ─── Cleanup expired entries every hour ───────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [, session] of store) {
    // Expire OTPs
    if (session.emailOTP && now > session.emailOTP.expiresAt) {
      session.emailOTP = null;
    }
    // Expire trusted devices
    for (const [fp, device] of session.trustedDevices) {
      if (now > device.expiresAt) session.trustedDevices.delete(fp);
    }
  }
}, 60 * 60 * 1000);
