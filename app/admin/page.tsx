"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, FileText, DollarSign, TrendingUp, Calendar, 
  CheckCircle2, Clock, AlertCircle, Search 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminStats, allAdminRequests, allClients } from "@/lib/admin-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { fadeIn, staggerContainer } from "@/lib/animations";

import { usePlatform } from "@/components/providers/platform-provider";
import Link from "next/link";
import { Zap, Megaphone, Terminal, Brain, ShieldAlert, Monitor, X } from "lucide-react";
import { useSearch } from "@/lib/use-search";

export default function AdminDashboard() {
  const { config } = usePlatform();
  const [stats, setStats] = useState(adminStats);
  const [recentClientsList, setRecentClientsList] = useState(allClients.slice(0, 4));

  useEffect(() => {
    // Fetch users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem("all_users") || "[]");
    
    if (storedUsers.length > 0) {
        // Update Total Clients count
        setStats(prev => ({
            ...prev,
            totalClients: adminStats.totalClients + storedUsers.length
        }));

        // Update Recent Clients (Newest first)
        const newClients = storedUsers.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: "N/A",
            role: "client",
            joinedDate: new Date().toISOString().split("T")[0],
            status: "active",
            totalRequests: 0,
            totalSpent: 0,
        })).reverse(); // Show newest first

        // Merge: New users + Static users, slice top 4
        setRecentClientsList([...newClients, ...allClients].slice(0, 4));
    }
  }, []);
  
  const { query, setQuery, results: filteredAll, clearSearch, hasQuery } = useSearch(
    allAdminRequests,
    ["title", "clientName", "service", "status", "id"]
  );
  const filteredRequests = filteredAll.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold italic tracking-tighter uppercase">MORCHANTRA<span className="text-primary">.COMMAND</span></h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
             Consolidated platform governance & high-end executive monitoring
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/settings">
            <Button variant="outline" className="h-10 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs gap-2">
               <ShieldAlert className="w-4 h-4" /> HIGH COMMAND
            </Button>
          </Link>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Search requests, clients…" 
              className="pl-9 bg-secondary/50 border-border h-10 text-xs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {hasQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COMMAND PULSE - THE 18 FEATURES OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: "Maintenance", active: config.governance.maintenanceMode, icon: Terminal, color: "text-red-500", bg: "bg-red-500/10" },
           { label: "AI Personality", active: true, value: config.ai.persona, icon: Brain, color: "text-primary", bg: "bg-primary/10" },
           { label: "Broadcast", active: config.operations.broadcastActive, icon: Megaphone, color: "text-amber-500", bg: "bg-amber-500/10" },
           { label: "Audit Watchdog", active: config.ai.anomalyDetection, icon: ShieldAlert, color: "text-emerald-500", bg: "bg-emerald-500/10" },
         ].map((item, idx) => (
           <Card key={idx} className="bg-zinc-900/50 border-zinc-800/50 hover:border-primary/20 transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3 min-w-0 overflow-hidden">
                 <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                 </div>
                 <div className="min-w-0 flex-1">
                    <h4 className="text-[10px] font-black uppercase text-zinc-500 truncate">{item.label}</h4>
                    <p className={`text-xs font-bold truncate tracking-widest ${item.active ? item.color : "text-zinc-700"}`}>
                       {item.active ? (item.value ? item.value.toUpperCase() : "ACTIVE") : "INACTIVE"}
                    </p>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={fadeIn}>
          <Card className="red-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalClients}</p>
                  <p className="text-xs text-green-500 mt-1">↑ 12% from last month</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn} custom={1}>
          <Card className="red-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Requests</p>
                  <p className="text-3xl font-bold mt-1">{adminStats.activeRequests}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {adminStats.completedThisMonth} completed this month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn} custom={2}>
          <Card className="red-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">
                    ${adminStats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    ↑ {adminStats.revenueGrowth}% growth
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Requests & Clients */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Requests</CardTitle>
            <span className="px-2 py-0.5 text-[10px] bg-primary/20 text-primary uppercase rounded-full tracking-widest font-bold">Live Data Pending</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{request.title}</h3>
                    <p className="text-sm text-muted-foreground">{request.clientName}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-primary font-semibold">${request.revenue}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentClientsList.map((client) => (
              <div
                key={client.id}
                className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      client.status === "active"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-gray-500/20 text-gray-500"
                    }`}
                  >
                    {client.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {client.totalRequests > 0 ? `${client.totalRequests} requests` : "No requests yet"}
                  </span>
                  <span className="text-primary font-semibold">
                    {client.totalSpent > 0 ? `$${client.totalSpent.toLocaleString()}` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{adminStats.completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Invoices</p>
                <p className="text-xl font-bold">{adminStats.pendingInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue Growth</p>
                <p className="text-xl font-bold">+{adminStats.revenueGrowth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
