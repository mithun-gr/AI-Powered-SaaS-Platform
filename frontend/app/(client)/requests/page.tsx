"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Clock, Send, MessageSquare, CheckCircle2, Circle, Loader, Share, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { recentRequests } from "@/lib/dummy-data";
import { fadeIn } from "@/lib/animations";
import { useCurrency } from "@/components/providers/currency-provider";
import { useSearch } from "@/lib/use-search";

// ── Feature 1: Visual Pipeline Timeline Tracker ───────────────────────────────
const PIPELINE_STEPS = ["Submitted", "Under Review", "In Progress", "Quality Check", "Completed"];
const statusToStep: Record<string, number> = {
  "new": 1, "waiting": 1, "in-progress": 2, "completed": 4,
};

function RequestTimeline({ status }: { status: string }) {
  const currentStep = statusToStep[status] ?? 0;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white">Progress</h3>
      <div className="flex items-center">
        {PIPELINE_STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? "bg-emerald-500 border-emerald-500" :
                  active ? "bg-primary border-primary animate-pulse" :
                  "bg-zinc-800 border-zinc-700"
                }`}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> :
                   active ? <Loader className="w-3 h-3 text-white animate-spin" /> :
                   <Circle className="w-3 h-3 text-zinc-600" />}
                </div>
                <p className={`text-[9px] mt-1 text-center leading-tight w-12 ${
                  done ? "text-emerald-400" : active ? "text-primary font-bold" : "text-zinc-600"
                }`}>{step}</p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 mx-0.5 ${done ? "bg-emerald-500" : "bg-zinc-800"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Feature 6: Request Chat Thread ────────────────────────────────────────────
interface ChatMsg { id: string; sender: "user" | "expert"; text: string; time: string; }
const INITIAL_THREAD: Record<string, ChatMsg[]> = {
  "REQ-001": [
    { id: "1", sender: "expert", text: "Hi! I've reviewed your contract. Found 3 clauses needing attention.", time: "2h ago" },
    { id: "2", sender: "user", text: "Thanks Sarah! What are the main concerns?", time: "1h ago" },
    { id: "3", sender: "expert", text: "The non-compete clause is overly broad and the IP section needs revision.", time: "45m ago" },
  ],
};

function RequestChatThread({ requestId, expertName }: { requestId: string; expertName?: string }) {
  const storageKey = `mrc_thread_${requestId}`;
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    // Load from localStorage first, fall back to initial thread data
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved) as ChatMsg[];
    } catch {}
    return INITIAL_THREAD[requestId] ?? [];
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  // Persist messages whenever they change
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch {}
  }, [messages, storageKey]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { id: Date.now().toString(), sender: "user", text: input.trim(), time: "just now" }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { id: (Date.now() + 1).toString(), sender: "expert", text: "Got it! I'll look into that and update you shortly.", time: "just now" }]);
    }, 1400);
  };

  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" /> Thread
        {expertName && <span className="font-normal text-zinc-500">— {expertName.split(",")[0]}</span>}
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-3">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4">No messages yet. Start the conversation.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
              msg.sender === "user"
                ? "bg-primary text-white rounded-br-sm"
                : "bg-zinc-800 text-zinc-300 rounded-bl-sm"
            }`}>
              <p>{msg.text}</p>
              <p className={`text-[9px] mt-0.5 ${msg.sender === "user" ? "text-white/50 text-right" : "text-zinc-600"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Message your expert…" className="h-8 text-xs rounded-xl bg-zinc-800 border-zinc-700" />
        <Button onClick={send} size="sm" className="h-8 w-8 p-0 rounded-xl shrink-0">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const { formatPrice } = useCurrency();
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(recentRequests[0]);

  const { query, setQuery, results: searchResults, clearSearch, hasQuery } = useSearch(
    recentRequests,
    ["id", "title", "description", "service", "assignedExpert"]
  );

  const filteredRequests = filter === "all"
    ? searchResults
    : searchResults.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Requests</h1>
          <p className="text-muted-foreground mt-1">Track and manage your service requests</p>
        </div>
        <Link href="/requests/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />New Request</Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* List */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, title, or keyword…"
                    className="pl-10"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  {hasQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["all","new","in-progress","waiting","completed"].map(s => (
                    <Button key={s} variant={filter === s ? "default" : "outline"} size="sm"
                      onClick={() => setFilter(s)} className="capitalize">
                      {s === "all" ? "All" : s.replace("-", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <Card className="border-dashed bg-zinc-900/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                  <Search className="w-8 h-8 mb-4 opacity-50" />
                  <p className="text-sm font-medium text-white mb-1">No requests found</p>
                  <p className="text-xs">Try adjusting your search or filters.</p>
                  {hasQuery && (
                    <Button
                      variant="ghost"
                      onClick={clearSearch}
                      className="mt-2 text-primary h-auto p-0 text-xs underline"
                    >
                      Clear search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request, index) => (
                <motion.div key={request.id} variants={fadeIn} initial="initial" animate="animate" custom={index}>
                  <Card className={`cursor-pointer transition-all hover:border-primary/40 ${selectedRequest?.id === request.id ? "border-primary" : ""}`}
                    onClick={() => setSelectedRequest(request)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{request.title}</h3>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{request.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{request.id}</span><span>•</span>
                        <span className="capitalize">{request.priority} priority</span><span>•</span>
                        <span>{formatPrice(request.budgetMin)} – {formatPrice(request.budgetMax)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedRequest && (
            <motion.div key={selectedRequest.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="lg:w-96 w-full">
              <Card className="sticky top-20">
                {/* Mobile close button */}
                <div className="flex items-center justify-between px-6 pt-4 lg:hidden">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Request Detail</p>
                  <button onClick={() => setSelectedRequest(null as any)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{selectedRequest.title}</h2>
                    <div className="flex flex-wrap gap-2 items-center mb-4">
                      <StatusBadge status={selectedRequest.status} />
                      {/* Feature 23: Shareable Case Studies */}
                      {selectedRequest.status === "completed" && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] rounded border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1 font-bold group" 
                            onClick={(e) => {
                                const trg = e.currentTarget;
                                trg.innerHTML = `<span class="flex items-center gap-1 justify-center">✓ Published</span>`;
                                trg.classList.replace("border-blue-500/30", "border-emerald-500/30");
                                trg.classList.replace("text-blue-400", "text-emerald-400");
                            }}
                        >
                          <Share className="w-3 h-3 group-hover:scale-110 transition-transform" /> Publish as Case Study
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Feature 1 */}
                  <RequestTimeline status={selectedRequest.status} />

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                  </div>

                  {selectedRequest.assignedExpert && (
                    <div className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {selectedRequest.assignedExpert.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Assigned Expert</p>
                        <p className="text-sm font-semibold text-white">{selectedRequest.assignedExpert}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.timeline.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Update Log</h3>
                      <div className="space-y-3">
                        {selectedRequest.timeline.slice(0, 3).map((item, i) => (
                          <div key={item.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                              {i < 2 && <div className="w-px flex-1 bg-border mt-1" />}
                            </div>
                            <div className="flex-1 pb-3">
                              <p className="font-medium text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="w-2.5 h-2.5" />{new Date(item.date).toLocaleDateString("en-GB")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature 6 */}
                  <RequestChatThread requestId={selectedRequest.id} expertName={selectedRequest.assignedExpert} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
