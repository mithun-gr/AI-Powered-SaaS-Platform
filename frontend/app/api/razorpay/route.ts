/**
 * /api/razorpay
 * Handles Razorpay order creation and payment signature verification.
 * Uses HMAC-SHA256 for tamper-proof verification (never trust client-side).
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const KEY_ID     = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

const json = (data: object, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });

const err = (msg: string, status = 400) => json({ error: msg }, status);

// ── POST /api/razorpay ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Invalid JSON body"); }

  const { action } = body;

  // ── Create Order ────────────────────────────────────────────────────────────
  if (action === "create-order") {
    const amount   = Number(body.amount);   // in INR (we convert to paise)
    const currency = String(body.currency ?? "INR");
    const receipt  = String(body.receipt ?? `order_${Date.now()}`);
    const notes    = body.notes as Record<string, string> ?? {};

    if (!amount || amount < 1) return err("amount is required and must be ≥ 1 INR");
    if (!KEY_ID || !KEY_SECRET) return err("Razorpay keys not configured", 500);

    try {
      // Call Razorpay Orders API directly (no SDK needed at runtime — avoids Node-only issues)
      const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Razorpay uses paise
          currency,
          receipt,
          notes,
        }),
      });

      if (!rzpRes.ok) {
        const e = await rzpRes.json();
        return err(e?.error?.description ?? "Failed to create Razorpay order", 500);
      }

      const order = await rzpRes.json();
      return json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (e: any) {
      console.error("Razorpay create-order error:", e);
      return err("Order creation failed. Please try again.", 500);
    }
  }

  // ── Verify Payment ──────────────────────────────────────────────────────────
  if (action === "verify-payment") {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as any;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return err("Missing payment verification fields");
    }
    if (!KEY_SECRET) return err("Razorpay secret not configured", 500);

    // HMAC-SHA256 — Razorpay's official verification flow
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = createHmac("sha256", KEY_SECRET).update(payload).digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("⚠️ Razorpay signature mismatch — possible tamper attempt");
      return json({ success: false, error: "Signature verification failed" }, 400);
    }

    // ✅ Payment verified — return success with payment details
    return json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  }

  return err("Unknown action");
}

export async function GET() { return err("Method not allowed", 405); }
