/**
 * lib/razorpay.ts
 * Client-side Razorpay helper — loads the SDK script, creates an order,
 * opens the payment modal, and verifies the signature server-side.
 */

export interface RazorpayOptions {
  amount: number;         // in INR (e.g. 999 = ₹999)
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  onSuccess?: (data: { paymentId: string; orderId: string }) => void;
  onFailure?: (error: string) => void;
}

/** Dynamically loads the Razorpay checkout script. */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id  = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Full Razorpay payment flow:
 * 1. Create order via /api/razorpay → get orderId
 * 2. Open Razorpay checkout modal
 * 3. On payment success → verify signature via /api/razorpay
 * 4. Call onSuccess/onFailure
 */
export async function initiateRazorpayPayment(opts: RazorpayOptions): Promise<void> {
  // 1. Load SDK
  const loaded = await loadRazorpayScript();
  if (!loaded) { opts.onFailure?.("Failed to load payment gateway. Check your connection."); return; }

  // 2. Create server-side order
  let orderId: string, orderAmount: number, orderCurrency: string;
  try {
    const res = await fetch("/api/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-order",
        amount: opts.amount,
        currency: opts.currency ?? "INR",
        receipt: `receipt_${Date.now()}`,
        notes: opts.notes ?? {},
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { opts.onFailure?.(data.error ?? "Failed to create payment order."); return; }
    orderId       = data.orderId;
    orderAmount   = data.amount;
    orderCurrency = data.currency;
  } catch {
    opts.onFailure?.("Network error. Please try again."); return;
  }

  // 3. Open Razorpay checkout
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId || keyId === "rzp_test_REPLACE_ME") {
    opts.onFailure?.(
      "Razorpay is not configured. Add your Key ID to .env.local (NEXT_PUBLIC_RAZORPAY_KEY_ID) and restart the server. Get keys at: dashboard.razorpay.com/app/keys"
    );
    return;
  }

  const rzp = new (window as any).Razorpay({
    key:         keyId,
    amount:      orderAmount,
    currency:    orderCurrency,
    name:        opts.name        ?? "Morchantra",
    description: opts.description ?? "Service Payment",
    order_id:    orderId,
    prefill:     opts.prefill ?? {},
    theme:       { color: "#ef4444" },   // matches Morchantra primary red
    modal: {
      ondismiss: () => opts.onFailure?.("Payment cancelled."),
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id:   string;
      razorpay_signature:  string;
    }) => {
      // 4. Verify signature server-side
      try {
        const vRes = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify-payment",
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_signature:  response.razorpay_signature,
          }),
        });
        const vData = await vRes.json();
        if (vData.success) {
          opts.onSuccess?.({ paymentId: vData.paymentId, orderId: vData.orderId });
        } else {
          opts.onFailure?.(vData.error ?? "Payment verification failed.");
        }
      } catch {
        opts.onFailure?.("Could not verify payment. Contact support.");
      }
    },
  });

  rzp.on("payment.failed", (resp: any) => {
    opts.onFailure?.(resp?.error?.description ?? "Payment failed.");
  });

  rzp.open();
}
