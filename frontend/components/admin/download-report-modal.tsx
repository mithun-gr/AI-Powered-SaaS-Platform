"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Sheet,
    FileJson,
    X,
    Download,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ─── Shared report data ──────────────────────────────────────────────────────
const REPORT_METADATA = {
    generated: new Date().toLocaleString(),
    period: "Jan 2025 – Jul 2025",
    company: "Morchantra",
};

const REVENUE_DATA = [
    { month: "Jan", value: "$35,000" },
    { month: "Feb", value: "$42,000" },
    { month: "Mar", value: "$28,000" },
    { month: "Apr", value: "$45,000" },
    { month: "May", value: "$55,000" },
    { month: "Jun", value: "$68,000" },
    { month: "Jul", value: "$85,000" },
];

const SERVICE_DATA = [
    { service: "Legal", requests: 380, share: "44.3%" },
    { service: "Insurance", requests: 250, share: "29.2%" },
    { service: "Development", requests: 130, share: "15.2%" },
    { service: "Cloud", requests: 95, share: "11.1%" },
];

const TOP_SERVICES = [
    { name: "Legal Consulting", revenue: "$45,200", growth: "+15%" },
    { name: "Cloud Architecture", revenue: "$38,400", growth: "+22%" },
    { name: "MERN Development", revenue: "$28,900", growth: "+8%" },
    { name: "Data Analytics", revenue: "$12,000", growth: "+5%" },
];

const KPI_DATA = [
    { label: "Total Revenue", value: "$124,500", change: "+12%" },
    { label: "Active Clients", value: "1,240", change: "+8.5%" },
    { label: "New Requests", value: "85", change: "-2.4%" },
    { label: "Avg. Response Time", value: "2.4h", change: "+14%" },
];

// ─── Export functions ────────────────────────────────────────────────────────

function exportPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(180, 20, 20);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("MORCHANTRA — Analytics Report", 14, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${REPORT_METADATA.generated}  •  Period: ${REPORT_METADATA.period}`, pageW - 14, 14, { align: "right" });

    doc.setTextColor(30, 30, 30);
    let y = 32;

    // ── KPIs ──
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Key Performance Indicators", 14, y);
    y += 4;
    autoTable(doc, {
        startY: y,
        head: [["Metric", "Value", "Change (MoM)"]],
        body: KPI_DATA.map(k => [k.label, k.value, k.change]),
        theme: "grid",
        headStyles: { fillColor: [180, 20, 20], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [250, 245, 245] },
        margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Revenue ──
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Revenue Overview", 14, y);
    y += 4;
    autoTable(doc, {
        startY: y,
        head: [["Month", "Revenue"]],
        body: REVENUE_DATA.map(r => [r.month, r.value]),
        theme: "striped",
        headStyles: { fillColor: [180, 20, 20], textColor: 255, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Services ──
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Service Distribution", 14, y);
    y += 4;
    autoTable(doc, {
        startY: y,
        head: [["Service", "Requests", "Share"]],
        body: SERVICE_DATA.map(s => [s.service, s.requests, s.share]),
        theme: "striped",
        headStyles: { fillColor: [180, 20, 20], textColor: 255, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Top Services ──
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Top Performing Services", 14, y);
    y += 4;
    autoTable(doc, {
        startY: y,
        head: [["Service", "Revenue", "Growth"]],
        body: TOP_SERVICES.map(s => [s.name, s.revenue, s.growth]),
        theme: "striped",
        headStyles: { fillColor: [180, 20, 20], textColor: 255, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(`Morchantra Confidential  •  Page ${i} of ${pageCount}`, pageW / 2, 290, { align: "center" });
    }

    doc.save(`Morchantra_Report_${Date.now()}.pdf`);
}

function exportExcel() {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, headers: string[], rows: any[][]) => {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        ws["!cols"] = headers.map(() => ({ wch: 22 }));
        XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet("KPIs", ["Metric", "Value", "Change (MoM)"],
        KPI_DATA.map(k => [k.label, k.value, k.change]));

    addSheet("Revenue", ["Month", "Revenue"],
        REVENUE_DATA.map(r => [r.month, r.value]));

    addSheet("Service Distribution", ["Service", "Requests", "Share"],
        SERVICE_DATA.map(s => [s.service, s.requests, s.share]));

    addSheet("Top Services", ["Service", "Revenue", "Growth"],
        TOP_SERVICES.map(s => [s.name, s.revenue, s.growth]));

    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `Morchantra_Report_${Date.now()}.xlsx`);
}

function exportCSV() {
    const allRows: string[] = [
        "=== KPIs ===",
        "Metric,Value,Change (MoM)",
        ...KPI_DATA.map(k => `${k.label},${k.value},${k.change}`),
        "",
        "=== Monthly Revenue ===",
        "Month,Revenue",
        ...REVENUE_DATA.map(r => `${r.month},${r.value}`),
        "",
        "=== Service Distribution ===",
        "Service,Requests,Share",
        ...SERVICE_DATA.map(s => `${s.service},${s.requests},${s.share}`),
        "",
        "=== Top Services ===",
        "Service,Revenue,Growth",
        ...TOP_SERVICES.map(s => `${s.name},${s.revenue},${s.growth}`),
    ];
    const blob = new Blob([allRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Morchantra_Report_${Date.now()}.csv`);
}

function exportJSON() {
    const payload = {
        meta: REPORT_METADATA,
        kpis: KPI_DATA,
        revenue: REVENUE_DATA,
        serviceDistribution: SERVICE_DATA,
        topServices: TOP_SERVICES,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    saveAs(blob, `Morchantra_Report_${Date.now()}.json`);
}

// ─── Format definitions ───────────────────────────────────────────────────────
const FORMATS = [
    {
        id: "pdf",
        label: "PDF Report",
        desc: "Structured, print-ready analytics report with tables & branding",
        icon: FileText,
        badge: "Recommended",
        badgeColor: "bg-primary/20 text-primary border-primary/30",
        action: exportPDF,
    },
    {
        id: "excel",
        label: "Excel Workbook",
        desc: "Multi-sheet .xlsx with KPIs, revenue, distribution & services",
        icon: Sheet,
        badge: "Multi-sheet",
        badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        action: exportExcel,
    },
    {
        id: "csv",
        label: "CSV (Raw Data)",
        desc: "Flat comma-separated file, ideal for data pipelines & imports",
        icon: FileText,
        badge: "Universal",
        badgeColor: "bg-sky-500/15 text-sky-400 border-sky-500/25",
        action: exportCSV,
    },
    {
        id: "json",
        label: "JSON Export",
        desc: "Machine-readable structured data, perfect for API integrations",
        icon: FileJson,
        badge: "Dev-friendly",
        badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/25",
        action: exportJSON,
    },
];

// ─── Modal component ──────────────────────────────────────────────────────────
interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function DownloadReportModal({ isOpen, onClose }: Props) {
    const [downloading, setDownloading] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const handleDownload = async (e: React.MouseEvent, fmt: typeof FORMATS[number]) => {
        e.preventDefault();
        e.stopPropagation();
        setDownloading(fmt.id);
        setDone(null);
        await new Promise(r => setTimeout(r, 900)); // simulate brief processing
        try {
            fmt.action();
            setDone(fmt.id);
            // Auto-close modal after user sees the success state
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (e) {
            console.error(e);
        } finally {
            setDownloading(null);
            setTimeout(() => setDone(null), 2500);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-[0_0_80px_-20px_hsl(var(--primary)/0.4)] overflow-hidden"
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            transition={{ type: "spring", bounce: 0.35, duration: 0.45 }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Ambient glow strip at top */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                            {/* Header */}
                            <div className="flex items-start justify-between p-6 pb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 opacity-80">Analytics Export</div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Download Report</h2>
                                    <p className="text-xs text-zinc-500 mt-1">Period: {REPORT_METADATA.period}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Format list */}
                            <div className="px-4 pb-6 space-y-2">
                                {FORMATS.map(fmt => {
                                    const Icon = fmt.icon;
                                    const isDownloading = downloading === fmt.id;
                                    const isDone = done === fmt.id;

                                    return (
                                        <motion.button
                                            key={fmt.id}
                                            type="button"
                                            onClick={(e) => handleDownload(e, fmt)}
                                            disabled={!!downloading}
                                            whileHover={{ scale: downloading ? 1 : 1.015 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left group ${
                                                isDone
                                                    ? "border-emerald-500/40 bg-emerald-500/5"
                                                    : isDownloading
                                                    ? "border-primary/40 bg-primary/5"
                                                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-900"
                                            }`}
                                        >
                                            {/* Icon */}
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                                isDone ? "bg-emerald-500/15" : isDownloading ? "bg-primary/15" : "bg-zinc-800 group-hover:bg-zinc-700"
                                            }`}>
                                                {isDone ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                ) : isDownloading ? (
                                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                                ) : (
                                                    <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                                                )}
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-sm font-semibold text-white">{fmt.label}</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${fmt.badgeColor}`}>
                                                        {isDone ? "Downloaded!" : fmt.badge}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500 leading-relaxed truncate">{fmt.desc}</p>
                                            </div>

                                            {/* Arrow */}
                                            <Download className={`w-3.5 h-3.5 flex-shrink-0 transition-all ${
                                                isDone ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-300 group-hover:translate-y-0.5"
                                            }`} />
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer note */}
                            <div className="border-t border-zinc-800/80 px-6 py-3">
                                <p className="text-[10px] text-zinc-600 text-center">
                                    All reports contain live dashboard data • Morchantra Confidential
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
