/**
 * /api/2fa — Production-grade server-side TOTP
 *
 * Hardening:
 *  ✅ Atomic rate limiting (IP + endpoint)
 *  ✅ ±3-window clock skew tolerance (±90s — NIST recommended)
 *  ✅ Constant-time HMAC comparison (timing-attack resistant)
 *  ✅ Strict base32 validation before compute
 *  ✅ Request body size guard
 *  ✅ Cache-Control: no-store on every response
 *  ✅ Non-leaking errors (no internal details exposed)
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// ─── Rate limiter ─────────────────────────────────────────────────────────────
// JS is single-threaded → Map operations are atomic within one process.
// For multi-instance deployments (Vercel / PM2), use Redis or Upstash instead.
interface RateBucket { count: number; resetAt: number }
const limitMap = new Map<string, RateBucket>();

const RATE_LIMIT_MAX = 15;          // max attempts
const RATE_WINDOW_MS = 60_000;      // per 60 seconds

function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  let bucket = limitMap.get(key);

  if (!bucket || now > bucket.resetAt) {
    limitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;                // atomic in single-threaded JS
  if (bucket.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true, retryAfter: 0 };
}

// Purge expired buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of limitMap.entries()) if (now > v.resetAt) limitMap.delete(k);
}, 300_000);

// ─── Base32 ───────────────────────────────────────────────────────────────────
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(raw: string): Buffer {
  const clean = raw.toUpperCase().replace(/[\s=]/g, "");
  if (!/^[A-Z2-7]+$/.test(clean)) throw new Error("Invalid base32");

  let bits = "";
  for (const ch of clean) bits += B32.indexOf(ch).toString(2).padStart(5, "0");

  const bytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return bytes;
}

// ─── TOTP (RFC 4226 / RFC 6238) ───────────────────────────────────────────────
function computeTOTP(secret: string, counter: number): Buffer {
  const key  = base32Decode(secret);
  const buf  = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x1_0000_0000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);

  const hmac   = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code   =
    ((hmac[offset]     & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) <<  8) |
     (hmac[offset + 3] & 0xff);

  return Buffer.from((code % 1_000_000).toString().padStart(6, "0"));
}

/**
 * Verify TOTP with ±3-window tolerance = ±90 seconds of clock drift.
 * Uses timingSafeEqual to prevent timing attacks.
 */
function verifyTOTP(token: string, secret: string, window = 3): boolean {
  const tokenBuf  = Buffer.from(token);
  const counter   = Math.floor(Date.now() / 1000 / 30);

  for (let delta = -window; delta <= window; delta++) {
    try {
      const expected = computeTOTP(secret, counter + delta);
      if (expected.length === tokenBuf.length && timingSafeEqual(expected, tokenBuf))
        return true;
    } catch { /* skip malformed */ }
  }
  return false;
}

function generateSecret(): string {
  const bytes = randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5)
    out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

// ─── Response helpers ─────────────────────────────────────────────────────────
const SECURE_HEADERS = {
  "Cache-Control":          "no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options":        "DENY",
};

const ok  = (data: object)           => NextResponse.json(data,            { status: 200, headers: SECURE_HEADERS });
const err = (msg: string, s = 400)  => NextResponse.json({ error: msg },   { status: s,   headers: SECURE_HEADERS });

// ─── POST /api/2fa ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Reject oversized requests (>4 KB)
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 4096) return err("Request too large", 413);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  // Parse body
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Invalid JSON body"); }

  const { action } = body;

  // ── Generate ──────────────────────────────────────────────────────────────
  if (action === "generate") {
    const rl = checkRateLimit(`gen:${ip}`);
    if (!rl.allowed)
      return err(`Too many requests. Retry in ${rl.retryAfter}s.`, 429);

    try {
      return ok({ secret: generateSecret() });
    } catch {
      return err("Secret generation failed. Please try again.", 500);
    }
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  if (action === "verify") {
    const rl = checkRateLimit(`verify:${ip}`);
    if (!rl.allowed)
      return err(`Too many attempts. Wait ${rl.retryAfter}s before trying again.`, 429);

    const token  = String(body.token  ?? "").replace(/\s/g, "").slice(0, 6);
    const secret = String(body.secret ?? "").trim().toUpperCase();

    if (!/^\d{6}$/.test(token)) return err("Token must be exactly 6 digits.");
    if (secret.length < 16)     return err("Secret is invalid or too short.");

    try {
      const valid = verifyTOTP(token, secret);
      return ok({ valid });
    } catch {
      // Never expose internal crypto errors — just return invalid
      return ok({ valid: false });
    }
  }

  return err("Unknown action.");
}

// Block non-POST
export async function GET()    { return err("Method not allowed", 405); }
export async function PUT()    { return err("Method not allowed", 405); }
export async function DELETE() { return err("Method not allowed", 405); }
