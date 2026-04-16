"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Download, CreditCard, Loader2, CheckCircle2, XCircle,
  Zap, Building2, ShieldCheck, AlertTriangle, Receipt,
  ArrowRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { pricingTiers, invoices, MOCK_USERS } from "@/lib/dummy-data";
import { useCurrency } from "@/components/providers/currency-provider";
import { getAuthSession } from "@/lib/auth-session";
import { initiateRazorpayPayment } from "@/lib/razorpay";
import type { Invoice } from "@/lib/types";

// ── Feature 3: PDF Invoice Download ──────────────────────────────────────────
async function downloadInvoicePDF(invoice: Invoice, formattedAmount: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(239, 68, 68);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("MORCHANTRA", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Empowering Digital Excellence", 14, 19);
  doc.text("support@morchantra.com", 14, 25);

  // Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 14, 45);

  // Invoice details table
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const rows = [
    ["Invoice Number", invoice.invoiceNumber],
    ["Service", invoice.service],
    ["Amount", formattedAmount],
    ["Status", invoice.status.toUpperCase()],
    ["Issued Date", new Date(invoice.issuedDate).toLocaleDateString("en-IN")],
    ["Due Date", new Date(invoice.dueDate).toLocaleDateString("en-IN")],
  ];

  let y = 58;
  rows.forEach(([label, value]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(label, 14, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(value, 80, y);
    doc.setFont("helvetica", "normal");
    y += 10;
  });

  // Footer
  doc.setTextColor(160, 160, 160);
  // Get HQ address from env or use standard fallback
  const hqAddress = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "HQ: Chennai, Tamil Nadu — 600001, India";
  doc.text(hqAddress, 14, 270);
  doc.text("This is a computer-generated invoice. No signature required.", 14, 275);

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

// ── Types ──────────────────────────────────────────────────────────────────────

type PaymentStatus = "idle" | "loading" | "success" | "failed";

interface PaymentResult {
  status: PaymentStatus;
  message: string;
  paymentId?: string;
}

// ── Razorpay Plan Card ─────────────────────────────────────────────────────────

function PlanCard({
  tier,
  index,
  onPay,
  paying,
  selected,
  onSelect,
}: {
  tier: (typeof pricingTiers)[0];
  index: number;
  onPay: (tier: (typeof pricingTiers)[0]) => void;
  paying: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const { formatPrice } = useCurrency();

  const icons  = [Zap, Sparkles, Building2, ShieldCheck];
  const Icon   = icons[index] ?? Zap;
  const isFree = tier.price === 0;
  const isEnt  = tier.name === "Enterprise";
  const isPaid = !isFree && !isEnt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
      onClick={onSelect}
      className={`relative rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col cursor-pointer ${
        selected
          ? "border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-2xl shadow-primary/30 scale-[1.03]"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:scale-[1.01]"
      }`}
    >
      {/* Animated selection ring */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-3xl pointer-events-none"
        >
          {/* Top shimmer line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          {/* Pulsing glow ring */}
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="absolute inset-0 rounded-3xl ring-2 ring-primary/50"
          />
        </motion.div>
      )}

      {/* MOST POPULAR badge — always shown for Pro plan */}
      {tier.popular && (
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-bold px-3 py-1 rounded-full tracking-wider transition-all ${
            selected ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
          }`}>MOST POPULAR</span>
        </div>
      )}

      <div className="p-8 flex flex-col flex-1">
        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${
            selected ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-400"
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white">{tier.name}</p>
            <p className="text-xs text-zinc-500">per {tier.period}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-8">
          {isFree ? (
            <span className="text-5xl font-black text-white">Free</span>
          ) : isEnt ? (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">{formatPrice(tier.price)}+</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Custom pricing available</p>
            </div>
          ) : (
            <span className="text-5xl font-black text-white">{formatPrice(tier.price)}</span>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                selected ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-400"
              }`}>
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm text-zinc-400 leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {isFree && (
          <Button
            className="w-full h-12 rounded-2xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
            onClick={(e) => { e.stopPropagation(); window.location.href = "/dashboard"; }}
          >
            Get Started Free
          </Button>
        )}
        {isEnt && (
          <Button
            className="w-full h-12 rounded-2xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 gap-2"
            onClick={(e) => { e.stopPropagation(); window.location.href = "/support"; }}
          >
            <ArrowRight className="w-4 h-4" /> Contact Sales
          </Button>
        )}
        {isPaid && (
          <Button
            onClick={(e) => { e.stopPropagation(); onPay(tier); }}
            disabled={paying}
            className={`w-full h-12 rounded-2xl font-bold text-sm gap-2 transition-all ${
              selected
                ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
            }`}
          >
            {paying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Pay with Razorpay</>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ── Payment Result Modal ───────────────────────────────────────────────────────

function PaymentResultModal({
  result,
  onClose,
}: {
  result: PaymentResult;
  onClose: () => void;
}) {
  if (result.status === "idle" || result.status === "loading") return null;
  const success = result.status === "success";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl border p-8 text-center space-y-5 ${
          success
            ? "bg-zinc-900 border-emerald-500/20"
            : "bg-zinc-900 border-red-500/20"
        }`}
      >
        <div className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center ${
          success ? "bg-emerald-500/15" : "bg-red-500/15"
        }`}>
          {success
            ? <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            : <XCircle className="w-10 h-10 text-red-400" />}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {success ? "Payment Successful!" : "Payment Failed"}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">{result.message}</p>
          {result.paymentId && (
            <p className="mt-3 font-mono text-xs text-zinc-500 bg-zinc-800 px-4 py-2 rounded-xl">
              ID: {result.paymentId}
            </p>
          )}
        </div>

        <Button
          onClick={onClose}
          className={`w-full h-11 rounded-2xl font-bold ${
            success ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          {success ? "Done" : "Try Again"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { formatPrice } = useCurrency();
  const [paying, setPaying]           = useState(false);
  const [payingTier, setPayingTier]   = useState<string | null>(null);
  const [result, setResult]           = useState<PaymentResult>({ status: "idle", message: "" });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Get user info from session / mock data
  const session  = getAuthSession();
  const mockUser = MOCK_USERS.find(u => u.email === session?.email);
  const prefill  = {
    name:    session?.name  ?? mockUser?.name  ?? "Guest",
    email:   session?.email ?? mockUser?.email ?? "",
    contact: "",
  };

  const handlePay = async (tier: (typeof pricingTiers)[0]) => {
    setPaying(true);
    setPayingTier(tier.name);
    setResult({ status: "loading", message: "" });

    await initiateRazorpayPayment({
      amount:      tier.price,
      currency:    "INR",
      name:        "Morchantra",
      description: `${tier.name} Plan — ${tier.period}`,
      prefill,
      notes: {
        plan:  tier.name,
        email: prefill.email,
      },
      onSuccess: ({ paymentId, orderId }) => {
        setResult({
          status:    "success",
          message:   `Your ${tier.name} plan is now active. Payment ID has been sent to ${prefill.email}.`,
          paymentId,
        });
        setPaying(false); setPayingTier(null);
      },
      onFailure: (error) => {
        if (error === "Payment cancelled.") {
          setResult({ status: "idle", message: "" });
        } else {
          setResult({ status: "failed", message: error });
        }
        setPaying(false); setPayingTier(null);
      },
    });
  };

  const handlePayInvoice = async (amount: number, description: string) => {
    setResult({ status: "loading", message: "" });
    await initiateRazorpayPayment({
      amount,
      currency: "INR",
      name: "Morchantra",
      description,
      prefill,
      onSuccess: ({ paymentId }) => {
        setResult({ status: "success", message: `Payment of ₹${amount} confirmed. Invoice has been sent to ${prefill.email}.`, paymentId });
      },
      onFailure: (error) => {
        if (error !== "Payment cancelled.") setResult({ status: "failed", message: error });
        else setResult({ status: "idle", message: "" });
      },
    });
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Result Modal */}
      <AnimatePresence>
        {(result.status === "success" || result.status === "failed") && (
          <PaymentResultModal
            result={result}
            onClose={() => setResult({ status: "idle", message: "" })}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Payments &amp; Invoices</h1>
        <p className="text-zinc-500 mt-1">Secure payments powered by Razorpay — UPI, Cards, NetBanking &amp; more</p>
      </div>

      {/* Razorpay Badge */}
      <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl w-fit">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Secured by Razorpay</p>
          <p className="text-xs text-zinc-500">PCI-DSS compliant · 100+ payment methods · End-to-end encrypted</p>
        </div>
        <svg viewBox="0 0 120 40" className="h-7 ml-2 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="40" rx="6" fill="#072654"/>
          <text x="10" y="26" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="#3396FF">Razorpay</text>
        </svg>
      </div>

      {/* Test-mode banner — shown when Razorpay key is placeholder */}
      {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === "rzp_test_REPLACE_ME" ||
       !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl">
          <span className="text-amber-400 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-300">Razorpay Test Mode</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live keys are not configured. Add <code className="bg-zinc-800 px-1 rounded text-amber-300">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> and <code className="bg-zinc-800 px-1 rounded text-amber-300">RAZORPAY_KEY_SECRET</code> to <code className="bg-zinc-800 px-1 rounded text-amber-300">.env.local</code> to enable real payments. Payment buttons will open Razorpay in demo mode.
            </p>
          </div>
        </div>
      ) : null}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Choose Your Plan</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pricingTiers.map((tier, i) => (
            <PlanCard
              key={tier.name}
              tier={tier}
              index={i}
              onPay={handlePay}
              paying={paying && payingTier === tier.name}
              selected={selectedPlan === tier.name}
              onSelect={() => setSelectedPlan(tier.name)}
            />
          ))}
        </div>

        {/* Payment method logos */}
        <div className="mt-8 p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl">
          <p className="text-xs text-zinc-500 text-center mb-4 uppercase tracking-widest font-semibold">Accepted Payment Methods</p>
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-60">
            {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking", "EMI", "Wallets"].map(m => (
              <span key={m} className="text-xs font-bold text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Invoice History</h2>
        <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
          {invoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07 }}
              className={`flex items-center justify-between p-5 hover:bg-zinc-800/30 transition-colors ${
                index < invoices.length - 1 ? "border-b border-zinc-800/60" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">{invoice.service}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    {invoice.invoiceNumber} · {new Date(invoice.issuedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-white text-lg">{formatPrice(invoice.amount)}</p>
                  <StatusBadge status={invoice.status} />
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => downloadInvoicePDF(invoice, formatPrice(invoice.amount))}
                  className="rounded-xl border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1.5">
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                {invoice.status === "pending" && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePayInvoice(invoice.amount, `Invoice ${invoice.invoiceNumber} — ${invoice.service}`)}
                      disabled={paying}
                      className="rounded-xl bg-primary hover:bg-primary/90 gap-1.5 shadow-lg shadow-primary/20"
                    >
                      {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      Pay Full Amount
                    </Button>
                    
                    {/* Feature 22: Escrow-Based Milestone Payments */}
                    {invoice.amount >= 50000 && (
                      <div className="relative group/tooltip">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePayInvoice(invoice.amount / 2, `Escrow Milestone 1: ${invoice.invoiceNumber}`)}
                          className="rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 gap-1.5 text-[10px] uppercase font-bold w-full sm:w-auto"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Pay 50% into Escrow
                        </Button>
                        <span className="opacity-0 group-hover/tooltip:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-secondary px-2 py-1 text-xs rounded shadow-lg pointer-events-none w-max text-white">
                          Escrow available for invoices ≥ ₹50,000
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          All transactions are processed securely by Razorpay. Morchantra never stores your card or bank details.
          Payments are verified server-side using HMAC-SHA256 to prevent tampering.
        </p>
      </div>
    </div>
  );
}
