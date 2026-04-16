/**
 * usage-tracker.ts
 * Real-time per-user usage tracking via localStorage + CustomEvents.
 *
 * Data is keyed by:  mrc_usage_<email>_<YYYY-MM>
 * This ensures the counter resets every calendar month automatically.
 *
 * Any component can subscribe to the "mrc:usage-update" event to get
 * live updates without a page refresh — just like Google Analytics.
 */

export const PLAN_LIMITS: Record<string, { requests: number; storage: number; aiMessages: number; label: string }> = {
  free:       { requests: 3,   storage: 1,   aiMessages: 5,     label: "Free"       },
  starter:    { requests: 10,  storage: 5,   aiMessages: 20,    label: "Starter"    },
  pro:        { requests: 30,  storage: 20,  aiMessages: 100,   label: "Pro"        },
  enterprise: { requests: 999, storage: 100, aiMessages: 10000, label: "Enterprise" },
};

export type UsageData = {
  requestsUsed: number;
  storageUsedMB: number;
  documentsUploaded: number;
  aiUsed: number;
  plan: keyof typeof PLAN_LIMITS;
  lastUpdated: string;
};

const USAGE_EVENT = "mrc:usage-update";

function getKey(email: string): string {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `mrc_usage_${email}_${month}`;
}

function getEmail(): string {
  try {
    const u = JSON.parse(localStorage.getItem("user") ?? "{}");
    return u.email ?? "guest";
  } catch {
    return "guest";
  }
}

export function getUsage(email?: string): UsageData {
  const key = getKey(email ?? getEmail());
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as UsageData;
  } catch {}
  // Default for brand-new users
  return {
    requestsUsed: 0,
    storageUsedMB: 0,
    documentsUploaded: 0,
    aiUsed: 0,
    plan: "starter",
    lastUpdated: new Date().toISOString(),
  };
}

export function saveUsage(data: UsageData, email?: string): void {
  const key = getKey(email ?? getEmail());
  data.lastUpdated = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(data));
  // Broadcast real-time update to all listeners on this page
  window.dispatchEvent(new CustomEvent(USAGE_EVENT, { detail: data }));
}

/** Call when user submits a new request */
export function incrementRequests(email?: string): void {
  const data = getUsage(email);
  data.requestsUsed += 1;
  saveUsage(data, email);
}

/** Call when user uploads a document */
export function incrementStorage(fileSizeBytes: number, email?: string): void {
  const data = getUsage(email);
  data.storageUsedMB += fileSizeBytes / (1024 * 1024);
  data.documentsUploaded += 1;
  saveUsage(data, email);
}

/** Call when user uses an AI tool (chat or document generator) */
export function incrementAiUsage(email?: string): void {
  const data = getUsage(email);
  data.aiUsed = (data.aiUsed || 0) + 1;
  saveUsage(data, email);
}

/** Update the user's plan tier */
export function setPlan(plan: keyof typeof PLAN_LIMITS, email?: string): void {
  const data = getUsage(email);
  data.plan = plan;
  saveUsage(data, email);
}

/** Subscribe to real-time usage updates */
export function subscribeToUsage(callback: (data: UsageData) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<UsageData>).detail);
  window.addEventListener(USAGE_EVENT, handler);
  return () => window.removeEventListener(USAGE_EVENT, handler);
}
