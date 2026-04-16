"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Loader2, CheckCircle2, FileText, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { serviceTypes } from "@/lib/dummy-data";
import { fadeIn, staggerContainer } from "@/lib/animations";
import {
  Scale,
  Shield,
  Code,
  Cloud,
  CloudCog,
  Bot,
  BarChart,
  Home,
  Palette,
} from "lucide-react";

const iconMap: Record<string, any> = {
  Scale,
  Shield,
  Code,
  Cloud,
  CloudCog,
  Bot,
  BarChart,
  Home,
  Palette,
};

import { useCurrency } from "@/components/providers/currency-provider";
import { incrementRequests, getUsage, PLAN_LIMITS } from "@/lib/usage-tracker";
import { fireLimitModal } from "@/components/global-limit-modal";

export default function NewRequestPage() {
  const { currencyCode, formatPrice } = useCurrency();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    urgency: "medium",
    budgetMin: "",
    budgetMax: "",
    preferredTime: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAttach = useCallback((files: FileList | null) => {
    if (!files) return;
    setAttachedFiles(prev => [...prev, ...Array.from(files)]);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    // Budget validation
    const budMin = parseFloat(formData.budgetMin);
    const budMax = parseFloat(formData.budgetMax);

    if (formData.budgetMin && budMin < 0) {
      newErrors.budgetMin = "Budget cannot be negative";
    }
    if (formData.budgetMax && budMax < 0) {
      newErrors.budgetMax = "Budget cannot be negative";
    }
    if (formData.budgetMin && formData.budgetMax && budMin > budMax) {
      newErrors.budgetMax = "Maximum budget must be greater than minimum budget";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Quota Check
    const currentUsage = getUsage();
    const limits = PLAN_LIMITS[currentUsage.plan] ?? PLAN_LIMITS.starter;
    if (currentUsage.requestsUsed >= limits.requests) {
      fireLimitModal("requests", limits.label, limits.requests);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // ── Real-time usage tracking ──────────────────────────────────────────
      incrementRequests();

      // ── Mark onboarding step done ─────────────────────────────────────────
      try {
        const done: string[] = JSON.parse(localStorage.getItem("mrc_onboard_done") ?? "[]");
        if (!done.includes("request")) {
          localStorage.setItem("mrc_onboard_done", JSON.stringify([...done, "request"]));
        }
      } catch {}

      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => router.push("/requests"), 2000);
    }, 1500);
  };

  if (showSuccess) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-12"
        >
          <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Request Submitted Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your request has been received and an expert will be assigned shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to your requests...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Submit New Request</h1>
          <p className="text-muted-foreground mt-1">
            Step {step} of 2: {step === 1 ? "Select Service" : "Request Details"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      {step === 1 ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Select Service Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {serviceTypes.map((service, index) => {
                  const Icon = iconMap[service.icon];
                  return (
                    <motion.div key={service.id} variants={fadeIn} custom={index} className="h-full">
                      <Card
                        className={`cursor-pointer transition-all h-full ${
                          selectedService === service.id
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "hover:border-primary/50 hover:shadow-md"
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <CardContent className="p-5 h-full flex flex-col justify-center">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-h-[80px]">
                              <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {service.description}
                              </p>
                            </div>
                            {selectedService === service.id && (
                              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedService}
              className="gap-2 font-bold"
            >
              Proceed to Project Specification
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Project Specification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Project Title *
                </label>
                <Input
                  placeholder="E.g., Q3 Cloud Infrastructure Audit"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: "" });
                  }}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Scope of Work *
                </label>
                <textarea
                  className={`flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.description ? "border-red-500" : "border-border bg-input"
                  }`}
                  placeholder="Outline your specific operational requirements and objectives... (min 20 characters)"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: "" });
                  }}
                />
                <div className="flex justify-between mt-1">
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.description.length} characters
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-3 block">
                    Priority SLA (Expedited Service) *
                  </label>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { id: "low", title: "Standard", time: "5-7 days", price: "Free", color: "border-zinc-800" },
                      { id: "medium", title: "Express", time: "48 hours", price: `${formatPrice(49)} fee`, color: "border-primary/50 bg-primary/5" },
                      { id: "high", title: "Emergency", time: "Under 4 hours", price: `${formatPrice(199)} fee`, color: "border-rose-500/50 bg-rose-500/5" },
                    ].map(p => (
                      <div 
                        key={p.id}
                        onClick={() => setFormData({ ...formData, urgency: p.id })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.urgency === p.id ? p.color : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/50"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-bold ${formData.urgency === p.id && p.id === "high" ? "text-rose-500" : formData.urgency === p.id ? "text-primary" : "text-white"}`}>{p.title}</h4>
                          {formData.urgency === p.id && <CheckCircle2 className={`w-4 h-4 ${p.id === "high" ? "text-rose-500" : "text-primary"}`} />}
                        </div>
                        <p className="text-xs text-zinc-400 capitalize">{p.time}</p>
                        <p className={`text-xs mt-2 font-bold ${p.id === "low" ? "text-zinc-600" : "text-emerald-400"}`}>{p.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Budget Min ({currencyCode})
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      min="0"
                      value={formData.budgetMin}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setFormData({ ...formData, budgetMin: String(val) });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Budget Max ({currencyCode})
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 1000"
                      min="0"
                      value={formData.budgetMax}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setFormData({ ...formData, budgetMax: String(val) });
                        if (errors.budgetMax) setErrors({ ...errors, budgetMax: "" });
                      }}
                      className={errors.budgetMax ? "border-red-500" : ""}
                    />
                    {errors.budgetMax && (
                      <p className="text-xs text-red-500 mt-1">{errors.budgetMax}</p>
                    )}
                  </div>
                </div>
                {formData.budgetMin && formData.budgetMax && parseFloat(formData.budgetMin) > parseFloat(formData.budgetMax) && !errors.budgetMax && (
                  <p className="text-xs text-amber-500 mt-1">⚠ Minimum budget should not exceed maximum budget.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Preferred Start Time
                </label>
                <Input
                  type="date"
                  value={formData.preferredTime}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredTime: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Upload Files (Optional)
                </label>
                <div
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileAttach(e.dataTransfer.files); }}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, Images (max 10MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={e => handleFileAttach(e.target.files)}
                />
                {attachedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-zinc-300 flex-1 truncate">{file.name}</span>
                        <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-zinc-500 hover:text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
