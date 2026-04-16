"use client";

import { useState } from "react";
import { Search, UserPlus, CheckCircle2, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { allAdminRequests, experts } from "@/lib/admin-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { useSearch } from "@/lib/use-search";

type Request = (typeof allAdminRequests)[0] & { assignedTo?: string; status: string };

const STATUS_OPTIONS = ["new", "in-progress", "waiting", "completed"];

export default function AdminRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [requests, setRequests] = useState<Request[]>(allAdminRequests as Request[]);

  // Assign modal state
  const [assignTarget, setAssignTarget] = useState<Request | null>(null);
  const [selectedExpert, setSelectedExpert] = useState("");

  // Status change dropdown state
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const { query, setQuery, results: searchResults, clearSearch, hasQuery } = useSearch(
    requests,
    ["id", "title", "clientName", "service", "description"]
  );

  const filteredRequests = statusFilter === "all"
    ? searchResults
    : searchResults.filter(r => r.status === statusFilter);

  const handleAssign = () => {
    if (!assignTarget || !selectedExpert) return;
    setRequests(prev =>
      prev.map(r => r.id === assignTarget.id ? { ...r, assignedTo: selectedExpert, status: "in-progress" } : r)
    );
    setAssignTarget(null);
    setSelectedExpert("");
  };

  const handleStatusChange = (requestId: string, newStatus: string) => {
    setRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, status: newStatus as any } : r)
    );
    setStatusDropdown(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and assign client requests to experts
          </p>
        </div>
        <div className="text-sm text-zinc-500 font-medium">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, title, client, or service…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
              {hasQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "new", "in-progress", "waiting", "completed"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                  className="capitalize"
                >
                  {status === "all" ? "All" : status.replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-zinc-400">No requests found</p>
              </div>
            ) : filteredRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{request.title}</h3>
                      <StatusBadge status={request.status} />
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        request.priority === "high" ? "bg-red-500/20 text-red-500"
                        : request.priority === "medium" ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-blue-500/20 text-blue-500"
                      }`}>
                        {request.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {request.description}
                    </p>
                  </div>
                  <span className="text-primary font-bold text-xl ml-4">${request.revenue}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="text-sm font-semibold">{request.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Request ID</p>
                    <p className="text-sm font-mono">{request.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">{new Date(request.createdAt).toLocaleDateString("en-GB")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="text-sm capitalize">{request.service}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
                  {request.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Assigned to: <span className="font-semibold">{request.assignedTo}</span></span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not assigned</span>
                  )}

                  <div className="flex gap-2">
                    {/* Status change dropdown */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setStatusDropdown(statusDropdown === request.id ? null : request.id)}
                      >
                        Change Status <ChevronDown className="w-3 h-3" />
                      </Button>
                      <AnimatePresence>
                        {statusDropdown === request.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                            className="absolute right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-20 min-w-[140px] overflow-hidden"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(request.id, s)}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors capitalize ${request.status === s ? "text-primary font-semibold" : "text-zinc-300"}`}
                              >
                                {s.replace("-", " ")}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => { setAssignTarget(request); setSelectedExpert(request.assignedTo || ""); }}
                    >
                      <UserPlus className="h-4 w-4" />
                      {request.assignedTo ? "Reassign" : "Assign Expert"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assign Expert Modal */}
      <AnimatePresence>
        {assignTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAssignTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-white text-lg">Assign Expert</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">{assignTarget.title}</p>
                </div>
                <button onClick={() => setAssignTarget(null)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
                {experts.map(expert => (
                  <button
                    key={expert.id}
                    onClick={() => setSelectedExpert(expert.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedExpert === expert.name
                        ? "border-primary bg-primary/10"
                        : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                      {expert.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{expert.name}</p>
                      <p className="text-xs text-zinc-500 capitalize">{expert.expertise.join(", ")}</p>
                    </div>
                    {selectedExpert === expert.name && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setAssignTarget(null)}>Cancel</Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!selectedExpert}
                  onClick={handleAssign}
                >
                  <UserPlus className="w-4 h-4" />
                  {assignTarget.assignedTo ? "Reassign" : "Assign"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
