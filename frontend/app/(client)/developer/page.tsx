"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Copy, Check, Shield, AlertTriangle, Terminal, RefreshCw, EyeOff, Eye, Plus, Database, Activity, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DeveloperAPIPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleShow = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const API_KEYS = [
    { id: "pk_1", name: "Production Key", key: "mrc_live_8f92a4b7c6d5e3f1g0h2j4k6l8n", created: "12 Oct 2025", lastUsed: "2 mins ago", status: "Active", type: "live" },
    { id: "pk_2", name: "Development Testing", key: "mrc_test_1k3m5p7q9s2u4w6y8a0c2e4g", created: "04 Jan 2026", lastUsed: "14 hours ago", status: "Active", type: "test" },
    { id: "pk_3", name: "Legacy Integration", key: "mrc_live_old_9z8x7v6c5b4n3m2l1k0j", created: "01 Mar 2024", lastUsed: "Never", status: "Revoked", type: "revoked" }
  ];

  const WEBHOOKS = [
    { id: "wh_1", url: "https://api.starkindustries.com/webhooks/morchantra", events: "request.updated, payment.success", status: "Healthy" },
    { id: "wh_2", url: "https://hook.zapier.com/hooks/catch/12345/abcde", events: "invoice.generated", status: "Failing" }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Terminal className="w-8 h-8 text-primary" />
          Developer & API
        </h1>
        <p className="text-zinc-400 mt-2">Manage your API keys, webhooks, and REST integrations for Morchantra.</p>
      </div>

      {/* Security Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-primary">Keep your keys secure</p>
          <p className="text-xs text-primary/80 mt-1 leading-relaxed">
            Your live API keys carry the same privileges as your user account. Do not share them in publicly accessible areas such as GitHub, client-side code, and so forth.
          </p>
        </div>
      </div>

      {/* Usage Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardContent className="p-6">
             <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">API Requests (30d)</span>
             </div>
             <p className="text-3xl font-bold text-white">24,592</p>
             <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1">↑ 12% vs last month</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardContent className="p-6">
             <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Error Rate</span>
             </div>
             <p className="text-3xl font-bold text-white">0.02%</p>
             <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">Highly healthy infrastructure</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardContent className="p-6">
             <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <Database className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Rate Limit</span>
             </div>
             <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-white">100</p>
                <p className="text-sm text-zinc-500 font-medium mb-1">req / sec</p>
             </div>
             <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary w-[15%]" />
             </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            Standard API Keys
          </h2>
          <Button variant="default" size="sm" className="gap-2 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-shadow">
            <Plus className="w-4 h-4" /> Create New Key
          </Button>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/40 text-zinc-400 text-xs tracking-widest uppercase">
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold">Key Token</th>
                  <th className="px-6 py-4 font-bold">Created</th>
                  <th className="px-6 py-4 font-bold">Last Used</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {API_KEYS.map((key) => (
                  <tr key={key.id} className="hover:bg-zinc-900/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {key.type === "live" && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                        {key.type === "test" && <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                        {key.type === "revoked" && <div className="w-2 h-2 rounded-full bg-zinc-600" />}
                        <span className={`font-semibold ${key.type === "revoked" ? "text-zinc-500 line-through" : "text-white"}`}>{key.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {key.type !== "revoked" ? (
                        <div className="flex items-center gap-3">
                          <code className="px-3 py-1 bg-zinc-900 border border-zinc-700/50 rounded-md text-zinc-300 font-mono text-xs tracking-wider">
                            {showKey[key.id] ? key.key : "mrc_" + key.type + "••••••••••••••••••••••••"}
                          </code>
                          <button onClick={() => toggleShow(key.id)} className="text-zinc-500 hover:text-white transition-colors">
                            {showKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic">Revoked permanently</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{key.created}</td>
                    <td className="px-6 py-4 text-zinc-400">{key.lastUsed}</td>
                    <td className="px-6 py-4 text-right">
                      {key.type !== "revoked" && (
                        <div className="flex items-center justify-end gap-2">
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => handleCopy(key.key, key.id)}
                             className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                           >
                             {copied === key.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                           </Button>
                           <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 hover:border-primary/50">
                             Revoke
                           </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Webhooks
          </h2>
          <Button variant="outline" size="sm" className="gap-2 font-bold text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors">
            <Plus className="w-4 h-4" /> Add Endpoint
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
           {WEBHOOKS.map((hook) => (
             <Card key={hook.id} className="bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardContent className="p-5">
                   <div className="flex items-start justify-between mb-4">
                      <div>
                         <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded bg-zinc-900 border ${hook.status === "Healthy" ? "border-emerald-500/30 text-emerald-500" : "border-primary/30 text-primary"}`}>
                            {hook.status}
                         </span>
                      </div>
                      <div className="flex text-zinc-500 gap-2">
                         <button className="hover:text-white px-2"><RefreshCw className="w-4 h-4" /></button>
                         <button className="hover:text-white px-2"><Settings2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                   <p className="text-sm font-semibold text-white truncate mb-1">{hook.url}</p>
                   <p className="text-xs text-zinc-500">Events: <span className="text-zinc-400">{hook.events}</span></p>
                </CardContent>
             </Card>
           ))}
        </div>
      </div>

    </div>
  );
}
