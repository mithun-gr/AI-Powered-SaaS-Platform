"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevenueChart, ServiceDistributionChart, UserGrowthChart } from "@/components/admin/analytics-charts";
import { DownloadReportModal } from "@/components/admin/download-report-modal";
import { fadeIn } from "@/lib/animations";

export default function AdminAnalyticsPage() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Platform usage statistics and revenue metrics
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all"
                    onClick={() => setModalOpen(true)}
                >
                    <Download className="h-4 w-4" />
                    Download Report
                </Button>
            </motion.div>

            {/* KPI cards */}
            <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
                {[
                    { label: "Total Revenue", value: "$124,500", change: "+12%", color: "text-green-500" },
                    { label: "Active Clients", value: "1,240", change: "+8.5%", color: "text-green-500" },
                    { label: "New Requests", value: "85", change: "-2.4%", color: "text-red-500" },
                    { label: "Avg. Response Time", value: "2.4h", change: "+14%", color: "text-green-500" },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border rounded-lg p-6">
                        <div className="text-sm text-neutral-400">{stat.label}</div>
                        <div className="text-2xl font-bold text-white mt-2">{stat.value}</div>
                        <div className={`text-xs mt-1 ${stat.color}`}>{stat.change} vs last month</div>
                    </div>
                ))}
            </motion.div>

            {/* Charts row */}
            <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                <div className="lg:col-span-2">
                    <RevenueChart />
                </div>
                <div>
                    <ServiceDistributionChart />
                </div>
            </motion.div>

            {/* Bottom row */}
            <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.3 }}
                className="grid gap-6 md:grid-cols-2"
            >
                <UserGrowthChart />
                <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Top Performing Services</h3>
                    <div className="space-y-4">
                        {[
                            { name: "Legal Consulting", revenue: "$45,200", growth: "+15%" },
                            { name: "Cloud Architecture", revenue: "$38,400", growth: "+22%" },
                            { name: "MERN Development", revenue: "$28,900", growth: "+8%" },
                            { name: "Data Analytics", revenue: "$12,000", growth: "+5%" },
                        ].map((service, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <div className="text-white font-medium">{service.name}</div>
                                    <div className="text-xs text-muted-foreground">{service.growth} growth</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold">{service.revenue}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Download Modal */}
            <DownloadReportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}
