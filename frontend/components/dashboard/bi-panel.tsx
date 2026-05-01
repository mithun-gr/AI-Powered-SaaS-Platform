"use client";

/**
 * components/dashboard/bi-panel.tsx
 *
 * Real-time Business Intelligence Panel
 * ─ Left:  30-day animated sparkline chart (requests + revenue)
 * ─ Right: 3 AI-generated insight cards powered by Groq (auto-refresh every 5 min)
 *
 * Pattern used by: Google Analytics 4, Salesforce Einstein, Stripe Dashboard
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw,
  AlertTriangle, CheckCircle2, Zap, BarChart2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DataPoint {
  day: string;       // "Apr 01"
  requests: number;
  revenue: number;   // in thousands ₹
}

interface Insight {
  id: string;
  type: "positive" | "warning" | "neutral";
  title: string;
  body: string;
  metric?: string;
}

// ── Seed deterministic 30-day data ────────────────────────────────────────────

function generate30DayData(): DataPoint[] {
  const points: DataPoint[] = [];
  const now = new Date();
  // Stable seed so data doesn't flicker on every render
  let seed = 42;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-GB", { month: "short", day: "2-digit" });
    // Simulate realistic upward trend with noise
    const base = 3 + (29 - i) * 0.15;
    points.push({
      day: label,
      requests: Math.max(1, Math.round(base + rand() * 3 - 1)),
      revenue:  Math.max(5, Math.round((base * 2.5 + rand() * 8) * 10) / 10),
    });
  }
  return points;
}

const STATIC_DATA = generate30DayData();

// ── Sparkline SVG component ───────────────────────────────────────────────────

function Sparkline({ data, color, fill }: {
  data: number[];
  color: string;
  fill: string;
}) {
  const W = 100; const H = 40;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 4) - 2,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.4" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Full 30-day chart ─────────────────────────────────────────────────────────

function TrendChart({ data, activeMetric, onMetricChange }: {
  data: DataPoint[];
  activeMetric: "requests" | "revenue";
  onMetricChange: (m: "requests" | "revenue") => void;
}) {
  const W = 600; const H = 160;
  const PADDING = { top: 12, right: 16, bottom: 28, left: 36 };

  const values = data.map(d => d[activeMetric]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;

  const toX = (i: number) =>
    PADDING.left + (i / (data.length - 1)) * (W - PADDING.left - PADDING.right);
  const toY = (v: number) =>
    PADDING.top + (1 - (v - min) / range) * (H - PADDING.top - PADDING.bottom);

  const pts = values.map((v, i) => ({ x: toX(i), y: toY(v), v, day: data[i].day }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${toX(data.length - 1)},${H - PADDING.bottom} L${PADDING.left},${H - PADDING.bottom} Z`;

  const color = activeMetric === "requests" ? "#ef4444" : "#10b981";
  const gradId = `bi-grad-${activeMetric}`;

  // Show every 5th label
  const xLabels = pts.filter((_, i) => i % 5 === 0 || i === pts.length - 1);
  // 4 y-gridlines
  const yGrids = [0, 0.33, 0.66, 1].map(t => ({
    y: PADDING.top + t * (H - PADDING.top - PADDING.bottom),
    val: max - t * range,
  }));

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {/* Metric toggle */}
      <div className="flex gap-2">
        {(["requests", "revenue"] as const).map(m => (
          <button
            key={m}
            onClick={() => onMetricChange(m)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeMetric === m
                ? m === "requests"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            {m === "requests" ? "Requests" : "Revenue (₹K)"}
          </button>
        ))}
      </div>

      {/* SVG chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: "160px" }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yGrids.map((g, i) => (
            <g key={i}>
              <line x1={PADDING.left} y1={g.y} x2={W - PADDING.right} y2={g.y}
                stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
              <text x={PADDING.left - 4} y={g.y + 4} textAnchor="end"
                fill="#52525b" fontSize="9" fontFamily="monospace">
                {activeMetric === "revenue" ? g.val.toFixed(1) : Math.round(g.val)}
              </text>
            </g>
          ))}

          {/* Area */}
          <motion.path
            d={areaPath}
            fill={`url(#${gradId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Hover zones + dots */}
          {pts.map((p, i) => (
            <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: "crosshair" }}>
              <rect x={p.x - 8} y={PADDING.top} width={16} height={H - PADDING.top - PADDING.bottom}
                fill="transparent" />
              {hovered === i && (
                <>
                  <line x1={p.x} y1={PADDING.top} x2={p.x} y2={H - PADDING.bottom}
                    stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                  <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="#09090b" strokeWidth="2" />
                </>
              )}
            </g>
          ))}

          {/* X labels */}
          {xLabels.map((p, i) => (
            <text key={i} x={p.x} y={H - 4} textAnchor="middle"
              fill="#52525b" fontSize="8.5" fontFamily="sans-serif">
              {p.day}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hovered !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-2 right-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs pointer-events-none"
            >
              <p className="text-zinc-400">{pts[hovered].day}</p>
              <p className="font-bold text-white mt-0.5">
                {activeMetric === "revenue"
                  ? `₹${pts[hovered].v.toFixed(1)}K`
                  : `${pts[hovered].v} request${pts[hovered].v !== 1 ? "s" : ""}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── AI Insight Cards ──────────────────────────────────────────────────────────

const FALLBACK_INSIGHTS: Insight[] = [
  {
    id: "1",
    type: "positive",
    title: "Request Volume Up 18%",
    body: "Service requests have grown steadily over the last 30 days, led by Legal Advisory and AWS Cloud.",
    metric: "+18%",
  },
  {
    id: "2",
    type: "warning",
    title: "2 Compliance Deadlines Soon",
    body: "Annual Privacy Audit is due in 5 days. Quarterly GST Filing in 14 days. Use AI Auto-Resolve to clear them.",
    metric: "5 days",
  },
  {
    id: "3",
    type: "neutral",
    title: "Peak Activity: Tues & Thurs",
    body: "Most requests are submitted mid-week. Consider scheduling expert consultations on those days for faster turnaround.",
    metric: "Tue / Thu",
  },
];

async function fetchAIInsights(): Promise<Insight[]> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `You are analyzing a B2B enterprise SaaS dashboard. Generate exactly 3 concise business insights in valid JSON array format. Each insight must have: id (string), type ("positive"|"warning"|"neutral"), title (max 8 words), body (max 25 words), metric (short KPI string like "+18%" or "5 days"). Return ONLY the JSON array, no markdown, no explanation. Example: [{"id":"1","type":"positive","title":"Revenue up this quarter","body":"...","metric":"+12%"}]`,
        history: [],
      }),
    });

    if (!res.ok) return FALLBACK_INSIGHTS;

    // Collect streamed text
    const reader = res.body?.getReader();
    if (!reader) return FALLBACK_INSIGHTS;
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return FALLBACK_INSIGHTS;
    const parsed = JSON.parse(match[0]) as Insight[];
    if (!Array.isArray(parsed) || parsed.length < 1) return FALLBACK_INSIGHTS;
    return parsed.slice(0, 3);
  } catch {
    return FALLBACK_INSIGHTS;
  }
}

function InsightCard({ insight, delay }: { insight: Insight; delay: number }) {
  const config = {
    positive: { icon: TrendingUp,     bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400" },
    warning:  { icon: AlertTriangle,  bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   badge: "bg-amber-500/20  text-amber-400"   },
    neutral:  { icon: Minus,          bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    badge: "bg-blue-500/20   text-blue-400"    },
  }[insight.type];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-2xl border p-4 space-y-3 ${config.bg} ${config.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
          <Icon className={`w-4 h-4 ${config.text}`} />
        </div>
        {insight.metric && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg leading-none ${config.badge}`}>
            {insight.metric}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-white leading-tight">{insight.title}</p>
        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{insight.body}</p>
      </div>
    </motion.div>
  );
}

// ── Summary mini-stats ────────────────────────────────────────────────────────

function MiniStat({ label, value, trend }: { label: string; value: string; trend: "up" | "down" | "flat" }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400";
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-xl font-black text-white">{value}</p>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function BIPanel() {
  const [activeMetric, setActiveMetric] = useState<"requests" | "revenue">("requests");
  const [insights, setInsights] = useState<Insight[]>(FALLBACK_INSIGHTS);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const data = STATIC_DATA;

  // Derived summary stats from last 7 vs prev 7 days
  const last7 = data.slice(-7).reduce((s, d) => s + d.requests, 0);
  const prev7 = data.slice(-14, -7).reduce((s, d) => s + d.requests, 0);
  const trend = last7 > prev7 ? "up" : last7 < prev7 ? "down" : "flat";
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = (last7 / 7).toFixed(1);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchAIInsights();
    setInsights(result);
    setLastRefresh(new Date());
    setCountdown(REFRESH_INTERVAL_MS / 1000);
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh every 5 min
  useEffect(() => {
    timerRef.current = setInterval(() => { refresh(); }, REFRESH_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refresh]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastRefresh]);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Business Intelligence</h2>
            <p className="text-[10px] text-zinc-500">30-day trend · AI insights refresh every 5 min</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 rounded-lg px-2.5 py-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing…" : `${mins}:${String(secs).padStart(2, "0")}`}
        </button>
      </div>

      {/* Body: chart + insights */}
      <div className="grid lg:grid-cols-5 gap-0">
        {/* Chart — 3 cols */}
        <div className="lg:col-span-3 p-5 border-b lg:border-b-0 lg:border-r border-zinc-800/50 space-y-5">
          {/* Mini stats */}
          <div className="flex items-center gap-6">
            <MiniStat label="Last 7 days" value={String(last7)} trend={trend} />
            <div className="w-px h-8 bg-zinc-800" />
            <MiniStat label="Avg / day" value={avgDaily} trend="flat" />
            <div className="w-px h-8 bg-zinc-800" />
            <MiniStat label="30-day revenue" value={`₹${totalRevenue.toFixed(0)}K`} trend="up" />
          </div>

          {/* Sparkline chart */}
          <TrendChart
            data={data}
            activeMetric={activeMetric}
            onMetricChange={setActiveMetric}
          />

          {/* Mini sparklines */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {(["requests", "revenue"] as const).map(m => {
              const vals = data.slice(-14).map(d => d[m]);
              const last = vals[vals.length - 1];
              const first = vals[0];
              const pct = first > 0 ? (((last - first) / first) * 100).toFixed(0) : "0";
              const up = Number(pct) >= 0;
              return (
                <div key={m} className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">{m === "requests" ? "Requests" : "Revenue"}</p>
                    <span className={`text-[10px] font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                      {up ? "+" : ""}{pct}%
                    </span>
                  </div>
                  <div className="h-10">
                    <Sparkline
                      data={vals}
                      color={m === "requests" ? "#ef4444" : "#10b981"}
                      fill={m === "requests" ? "#ef4444" : "#10b981"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights — 2 cols */}
        <div className="lg:col-span-2 p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-bold text-white">AI Insights</p>
            {loading && (
              <span className="text-[9px] text-primary animate-pulse font-semibold ml-auto">Generating…</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="rounded-2xl border border-zinc-800/50 p-4 space-y-2 animate-pulse">
                    <div className="flex gap-2">
                      <div className="h-8 w-8 rounded-xl bg-zinc-800" />
                      <div className="h-5 w-12 rounded-lg bg-zinc-800 ml-auto" />
                    </div>
                    <div className="h-3.5 w-3/4 bg-zinc-800 rounded" />
                    <div className="h-3 w-full bg-zinc-800/60 rounded" />
                    <div className="h-3 w-5/6 bg-zinc-800/40 rounded" />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3">
                {insights.map((ins, i) => (
                  <InsightCard key={ins.id} insight={ins} delay={i * 0.1} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[9px] text-zinc-600 text-center pt-1">
            Last updated: {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}
