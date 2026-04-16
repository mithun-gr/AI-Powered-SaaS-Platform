"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, BarChart3, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, ShieldCheck, Zap, Database, Wand2 } from "lucide-react";
import { useCurrency } from "@/components/providers/currency-provider";
import { useUsage } from "@/lib/use-usage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
    const { formatPrice, currencyCode } = useCurrency();
    const usage = useUsage();
    
    const handleMaxOut = () => {
        if (typeof window === "undefined") return;
        const currentData = JSON.parse(localStorage.getItem(`mrc_usage_guest_2026-04`) || "{}");
        const forcedData = {
           ...currentData,
           requestsUsed: 10,
           storageUsedMB: 5120, // 5GB limit for starter
           aiUsed: 20
        };
        // Trigger save and event manually so it propagates everywhere
        import("@/lib/usage-tracker").then(m => m.saveUsage(forcedData as any));
    };

    const [monthlyRequests, setMonthlyRequests] = useState([
        { month: 'Jan', requests: 4, costSaved: 1200 },
        { month: 'Feb', requests: 7, costSaved: 2100 },
        { month: 'Mar', requests: 3, costSaved: 900 },
        { month: 'Apr', requests: 8, costSaved: 2400 },
    ]);

    // ROI Calculator State
    const [traditionalCost, setTraditionalCost] = useState(5000); // Standard cost outside Morchantra
    const [morchantraCost, setMorchantraCost] = useState(1500); // Estimated Morchantra spend

    const roiPercentage = ((traditionalCost - morchantraCost) / morchantraCost) * 100;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Business Intelligence</h1>
                <p className="text-zinc-400">Exclusive AI-driven insights for your enterprise.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. AI Business Health Score */}
                <Card className="col-span-1 lg:col-span-1 border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-lg">AI Health Score</h3>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                {/* Circular progress representation */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" className="stroke-zinc-800" strokeWidth="12" fill="none" />
                                    <circle cx="80" cy="80" r="70" className="stroke-emerald-500 max-w-full origin-center transition-all duration-1000" strokeWidth="12" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * 84) / 100} strokeLinecap="round" />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-5xl font-black text-white">84</span>
                                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Excellent</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mt-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-3 items-start">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-emerald-100 leading-relaxed">Your business risk profile is very low based on consistent document compliance.</p>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 items-start">
                                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-100 leading-relaxed">Action recommended: Update your Annual Service Agreement before Q3 ends.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Business ROI Calculator */}
                <Card className="col-span-1 lg:col-span-2 border-zinc-800 bg-zinc-900/50 backdrop-blur content-start">
                    <CardContent className="p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-lg">ROI Calculator</h3>
                            </div>
                            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold ring-1 ring-primary/40">
                                Saves {roiPercentage.toFixed(0)}%
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 flex-1">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2 block">Traditional External Costs (Monthly)</label>
                                    <input 
                                        type="range" 
                                        min="1000" max="25000" step="500" 
                                        value={traditionalCost} 
                                        onChange={(e) => setTraditionalCost(Number(e.target.value))}
                                        className="w-full accent-primary h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="mt-2 text-xl font-bold text-white">{formatPrice(traditionalCost)}</div>
                                </div>

                                <div>
                                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2 block">Estimated Morchantra Spending</label>
                                    <div className="text-2xl font-black text-primary">{formatPrice(morchantraCost)}</div>
                                </div>
                            </div>
                            <div className="bg-zinc-950/80 rounded-2xl p-6 border border-zinc-800 flex flex-col justify-center items-center text-center">
                                <p className="text-sm text-zinc-400 mb-2 font-medium">Your Annual Projected Savings</p>
                                <h4 className="text-5xl font-black text-emerald-400 tracking-tighter shadow-emerald-500/20 drop-shadow-2xl">
                                    {formatPrice((traditionalCost - morchantraCost) * 12)}
                                </h4>
                                <p className="text-xs text-zinc-500 mt-4 leading-relaxed max-w-[250px]">
                                    Calculated based on standard industry rates vs Morchantra's integrated AI service fees.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Client Analytics Dashboard (Chart) */}
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
                <CardContent className="p-6">
                     <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-lg">Value Generated Over Time</h3>
                        </div>
                    </div>

                    <div className="h-64 mt-4 flex items-end gap-6 px-4">
                        {monthlyRequests.map((data, index) => {
                            const maxSave = Math.max(...monthlyRequests.map(d => d.costSaved));
                            const heightPct = (data.costSaved / maxSave) * 100;
                            return (
                                <div key={data.month} className="flex-1 flex flex-col items-center justify-end gap-3 group">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPct}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="w-full bg-blue-600/20 hover:bg-blue-500/40 border-t-2 border-blue-500 rounded-t-xl relative transition-colors cursor-pointer"
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {formatPrice(data.costSaved)}
                                        </div>
                                    </motion.div>
                                    <span className="text-sm font-medium text-zinc-400">{data.month}</span>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* 4. Forensic Usage Breakdown (The Tech Giant Addition) */}
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                        <div>
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400" />
                                Plan & Usage Breakdown
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">Detailed metric tracking for your {usage.planLabel} Plan cycle</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="destructive" size="sm" onClick={handleMaxOut} className="h-8 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white border-none">
                                Test Max Limits (Demo)
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-bold border-zinc-700">
                                Download CSV
                            </Button>
                        </div>
                    </div>
                    <div className="divide-y divide-zinc-800/60">
                        {/* Request Quota */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-zinc-800/20 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                <Activity className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">Expert Requests</h4>
                                <p className="text-xs text-zinc-400">Standard and priority platform requests handled by human legal/finance experts.</p>
                            </div>
                            <div className="md:w-64">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className={usage.nearRequestLimit ? "text-amber-400" : "text-white"}>{usage.requestsUsed} Used</span>
                                    <span className="text-zinc-500">{usage.requestLimit} Limit</span>
                                </div>
                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                    <motion.div animate={{ width: `${usage.requestPct}%` }} transition={{ duration: 1 }}
                                        className={`h-full rounded-full ${usage.atRequestLimit ? "bg-red-500" : usage.nearRequestLimit ? "bg-amber-400" : "bg-primary"}`} />
                                </div>
                            </div>
                        </div>

                        {/* Storage Quota */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-zinc-800/20 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                <Database className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">Document Storage</h4>
                                <p className="text-xs text-zinc-400">Encrypted secure vault storage for contracts, invoices, and KYC documents.</p>
                            </div>
                            <div className="md:w-64">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-white">{usage.storageUsedMB.toFixed(2)} MB</span>
                                    <span className="text-zinc-500">{usage.storageLimit * 1024} MB Limit</span>
                                </div>
                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                    <motion.div animate={{ width: `${usage.storagePct}%` }} transition={{ duration: 1, delay: 0.1 }}
                                        className="h-full bg-blue-500 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* AI Quota */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-zinc-800/20 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                                <Wand2 className="w-6 h-6 text-violet-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">Generative AI Executions</h4>
                                <p className="text-xs text-zinc-400">Tokens used for smart contract drafting, proposal generation, and AI chat support.</p>
                            </div>
                             <div className="md:w-64">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className={usage.nearAiLimit ? "text-amber-400" : "text-white"}>{usage.aiUsed} Generated</span>
                                    <span className="text-zinc-500">{usage.aiLimit} Limit</span>
                                </div>
                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                    <motion.div animate={{ width: `${usage.aiPct}%` }} transition={{ duration: 1, delay: 0.2 }}
                                        className={`h-full rounded-full ${usage.atAiLimit ? "bg-red-500" : usage.nearAiLimit ? "bg-amber-400" : "bg-violet-500"}`} />
                                </div>
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
