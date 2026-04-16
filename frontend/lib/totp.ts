/**
 * lib/totp.ts
 *
 * Client-side TOTP utility — only QR-code URI generation.
 * All cryptographic operations (generate secret, verify token)
 * are handled server-side via /api/2fa for security and reliability.
 */

/**
 * Generate the otpauth:// URI required for QR code scanning.
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, etc.
 *
 * @param label  - User identifier (e.g. email address)
 * @param issuer - App / service name shown in the authenticator app
 * @param secret - Base32-encoded TOTP secret from the server
 */
export function totpKeyUri(label: string, issuer: string, secret: string): string {
  if (!label || !issuer || !secret) {
    throw new Error("totpKeyUri: label, issuer, and secret are all required");
  }
  const base = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `${base}?${params.toString()}`;
}
