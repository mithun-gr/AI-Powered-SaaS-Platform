"use client";

// Force TS re-evaluation

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  MoreVertical,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { invoices, currentUser } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { useSearch } from "@/lib/use-search";

// Mock client names for the admin view
const getClientName = (id: string) => {
  const clients = [
    "Acme Corp",
    "TechStart Inc",
    "Global Solutions",
    "Future Systems",
  ];
  // Return a consistent random client based on ID char code
  return clients[id.charCodeAt(id.length - 1) % clients.length];
};

export function AdminInvoiceTable() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { query, setQuery, results: searchResults, clearSearch, hasQuery } = useSearch(
    invoices,
    ["invoiceNumber", "service"]
  );

  // Filter by status on top of search
  const filteredInvoices = statusFilter
    ? searchResults.filter(inv => inv.status === statusFilter)
    : searchResults;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice ID or service…"
            className="pl-9 bg-card border-border focus-visible:ring-primary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {hasQuery && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("paid")}>
                Paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("overdue")}>
                Overdue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="default"
            className="gap-2 bg-primary hover:bg-primary/90 text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[100px]">Invoice ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date Issued</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice, index) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-border hover:bg-secondary/50 transition-colors"
                >
                  <TableCell className="font-medium text-primary">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{getClientName(invoice.id)}</TableCell>
                  <TableCell>{invoice.service}</TableCell>
                  <TableCell>
                    {new Date(invoice.issuedDate).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.dueDate).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-green-500">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-yellow-500">
                          <Clock className="mr-2 h-4 w-4" />
                          Mark as Pending
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
