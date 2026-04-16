/**
 * app/api/security/route.ts
 * Master security API — audit log, email alerts, session versioning, trusted devices.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  logAuditEvent, getAuditLog,
  getSessionVersion, incrementSessionVersion,
  listTrustedDevices, revokeTrustedDevice, revokeAllTrustedDevices,
  registerTrustedDevice, isTrustedDevice,
  generateBackupCodes, verifyBackupCode, getBackupCodeStatus,
  createEmailOTP, verifyEmailOTP,
} from "@/lib/security-store";
import { sendEmail } from "@/services/emailService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ip = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

const ua = (req: NextRequest) => req.headers.get("user-agent") ?? "unknown";

const json = (data: object, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });

const err = (msg: string, status = 400) => json({ error: msg }, status);

// ─── Security email templates ──────────────────────────────────────────────────
function securityEmailHtml(title: string, body: string, time: string, ipAddr: string): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:16px;border:1px solid #27272a;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="width:42px;height:42px;background:#ef4444;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">🔐</div>
      <div>
        <p style="margin:0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Morchantra Security Alert</p>
        <h2 style="margin:2px 0 0;color:#fff;font-size:18px;">${title}</h2>
      </div>
    </div>
    <div style="background:#18181b;border-radius:12px;padding:20px;margin-bottom:20px;">
      ${body}
    </div>
    <div style="background:#18181b;border-radius:8px;padding:12px 16px;font-size:12px;color:#71717a;">
      <p style="margin:0;">🕐 Time: ${time}</p>
      <p style="margin:4px 0 0;">📍 IP Address: ${ipAddr}</p>
    </div>
    <p style="font-size:11px;color:#52525b;margin-top:20px;text-align:center;">
      If you didn't perform this action, <strong style="color:#ef4444;">secure your account immediately</strong> by changing your password.
    </p>
  </div>`;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Invalid JSON"); }

  const { action, userId, email } = body;
  if (!action || !userId) return err("action and userId are required");

  const reqIp = ip(req);
  const reqUa = ua(req);

  // ── Audit log: read ──────────────────────────────────────────────────────────
  if (action === "get-audit-log") {
    const limit = Math.min(Number(body.limit ?? 20), 100);
    return json({ events: getAuditLog(String(userId), limit) });
  }

  // ── Audit log: write ─────────────────────────────────────────────────────────
  if (action === "log-event") {
    const event = String(body.event ?? "UNKNOWN");
    const level = (body.level as "info" | "warning" | "critical") ?? "info";
    const entry = logAuditEvent(String(userId), event, reqIp, reqUa, level);
    return json({ logged: true, entry });
  }

  // ── Session version ──────────────────────────────────────────────────────────
  if (action === "get-session-version") {
    return json({ version: getSessionVersion(String(userId)) });
  }

  if (action === "invalidate-sessions") {
    const version = incrementSessionVersion(String(userId));
    logAuditEvent(String(userId), "SESSIONS_INVALIDATED", reqIp, reqUa, "warning");
    return json({ version });
  }

  // ── Email security alert ─────────────────────────────────────────────────────
  if (action === "send-security-alert") {
    const toEmail = String(email ?? "");
    const title = String(body.title ?? "Security Alert");
    const bodyText = String(body.body ?? "A security action was performed on your account.");
    if (!toEmail) return err("email is required");

    const time = new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "long", timeStyle: "short" }) + " UTC";
    const sent = await sendEmail(toEmail, `🔐 ${title} — Morchantra`, securityEmailHtml(title, `<p style="color:#a1a1aa;margin:0;">${bodyText}</p>`, time, reqIp));
    logAuditEvent(String(userId), `EMAIL_ALERT_SENT:${title}`, reqIp, reqUa, "info");
    return json({ sent });
  }

  // ── Backup codes ─────────────────────────────────────────────────────────────
  if (action === "generate-backup-codes") {
    const codes = generateBackupCodes(String(userId));
    logAuditEvent(String(userId), "BACKUP_CODES_GENERATED", reqIp, reqUa, "warning");
    return json({ codes });
  }

  if (action === "verify-backup-code") {
    const code = String(body.code ?? "");
    const valid = verifyBackupCode(String(userId), code);
    if (valid) logAuditEvent(String(userId), "BACKUP_CODE_USED", reqIp, reqUa, "warning");
    else logAuditEvent(String(userId), "BACKUP_CODE_FAILED", reqIp, reqUa, "critical");
    return json({ valid });
  }

  if (action === "backup-code-status") {
    return json(getBackupCodeStatus(String(userId)));
  }

  // ── Email OTP (recovery) ─────────────────────────────────────────────────────
  if (action === "send-email-otp") {
    const toEmail = String(email ?? "");
    if (!toEmail) return err("email required");
    const otp = createEmailOTP(String(userId), toEmail);
    const time = new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "long", timeStyle: "short" }) + " UTC";
    const sent = await sendEmail(
      toEmail,
      "🔑 Your Morchantra Login Verification Code",
      securityEmailHtml(
        "Sign-in Verification Code",
        `<p style="color:#a1a1aa;margin:0 0 16px;">Your one-time verification code is:</p>
         <div style="font-size:40px;font-weight:bold;letter-spacing:16px;color:#ef4444;text-align:center;padding:16px 0;">${otp}</div>
         <p style="color:#71717a;font-size:12px;margin:12px 0 0;text-align:center;">This code expires in <strong>10 minutes</strong>. Never share this code.</p>`,
        time,
        reqIp
      )
    );
    logAuditEvent(String(userId), "EMAIL_OTP_SENT", reqIp, reqUa, "warning");
    return json({ sent });
  }

  if (action === "verify-email-otp") {
    const otp = String(body.otp ?? "");
    const result = verifyEmailOTP(String(userId), otp);
    if (result === "ok") logAuditEvent(String(userId), "EMAIL_OTP_VERIFIED", reqIp, reqUa, "info");
    else logAuditEvent(String(userId), `EMAIL_OTP_FAILED:${result}`, reqIp, reqUa, "critical");
    return json({ result });
  }

  // ── Trusted devices ──────────────────────────────────────────────────────────
  if (action === "register-trusted-device") {
    const fp = String(body.fingerprint ?? "");
    const label = String(body.label ?? "Unknown Device");
    if (!fp) return err("fingerprint required");
    registerTrustedDevice(String(userId), fp, label, reqIp);
    logAuditEvent(String(userId), `DEVICE_TRUSTED:${label}`, reqIp, reqUa, "info");
    return json({ registered: true });
  }

  if (action === "check-trusted-device") {
    const fp = String(body.fingerprint ?? "");
    const trusted = isTrustedDevice(String(userId), fp);
    return json({ trusted });
  }

  if (action === "list-trusted-devices") {
    return json({ devices: listTrustedDevices(String(userId)) });
  }

  if (action === "revoke-trusted-device") {
    const fp = String(body.fingerprint ?? "");
    revokeTrustedDevice(String(userId), fp);
    logAuditEvent(String(userId), "DEVICE_REVOKED", reqIp, reqUa, "warning");
    return json({ revoked: true });
  }

  if (action === "revoke-all-devices") {
    revokeAllTrustedDevices(String(userId));
    logAuditEvent(String(userId), "ALL_DEVICES_REVOKED", reqIp, reqUa, "critical");
    return json({ revoked: true });
  }

  return err(`Unknown action: ${action}`);
}

export async function GET() { return err("Method not allowed", 405); }
