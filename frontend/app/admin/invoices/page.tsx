"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminInvoiceTable } from "@/components/admin/invoice-table";
import { fadeIn } from "@/lib/animations";

export default function AdminInvoicesPage() {
    return (
        <div className="space-y-6">
            <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold">Invoices</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage client billing and payment records
                    </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </Button>
            </motion.div>

            <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
            >
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                        <p className="text-3xl font-bold mt-2 text-white">$45,231.89</p>
                        <span className="text-xs text-green-500 font-medium">+20.1% from last month</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">Outstanding Amount</h3>
                        <p className="text-3xl font-bold mt-2 text-white">$12,450.00</p>
                        <span className="text-xs text-yellow-500 font-medium">15 invoices pending</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">Paid Invoices</h3>
                        <p className="text-3xl font-bold mt-2 text-white">128</p>
                        <span className="text-xs text-muted-foreground">This month</span>
                    </div>
                </div>

                <AdminInvoiceTable />
            </motion.div>
        </div>
    );
}
