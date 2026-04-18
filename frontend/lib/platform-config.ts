/**
 * lib/platform-config.ts
 * 
 * Source of truth for all 18 admin platform controls.
 * Uses localStorage as fast cache with optional Supabase persistence.
 * Designed as a zero-dependency reactive configuration store.
 */

const CONFIG_KEY = "mrc_platform_cfg";

export interface AIConfig {
  model: "llama-3.1-70b-versatile" | "llama-3.1-8b-instant" | "mixtral-8x7b-32768";
  persona: "helpful" | "neutral" | "aggressive";
  maxMessagesPerCycle: number;
  // AI Feature 16: Sentiment Escalation
  sentimentEscalation: boolean;
  sentimentThreshold: "low" | "medium" | "high";
  // AI Feature 17: Smart Reply Suggestions
  smartReplies: boolean;
  // AI Feature 18: Anomaly Detection
  anomalyDetection: boolean;
  anomalySensitivity: "low" | "medium" | "high";
}

export interface SecurityConfig {
  enforce2FA: boolean;
  ipRestricted: boolean;
  allowedIPs: string[];
  sessionMaxAgeHours: number;
  loginRateLimit: number; // attempts per minute
  geoFencingEnabled: boolean;
}

export interface FinancialConfig {
  vatRate: number;
  platformFee: number; // locked at 5, stored for audit
  invoiceDueDays: number;
  autoInvoicingEnabled: boolean;
  multiCurrencyEnabled: boolean;
}

export interface GovernanceConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowPublicSignup: boolean;
  whitelistedDomains: string[];
  enabledRegions: string[];
  requireEmailVerification: boolean;
}

export interface OperationsConfig {
  slaThresholdHours: number;
  broadcastMessage: string;
  broadcastActive: boolean;
  supportEmail: string;
  maxConcurrentRequests: number;
}

export interface PlatformConfig {
  ai: AIConfig;
  security: SecurityConfig;
  financial: FinancialConfig;
  governance: GovernanceConfig;
  operations: OperationsConfig;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

export const DEFAULT_CONFIG: PlatformConfig = {
  ai: {
    model: "llama-3.1-70b-versatile",
    persona: "helpful",
    maxMessagesPerCycle: 50,
    sentimentEscalation: true,
    sentimentThreshold: "medium",
    smartReplies: true,
    anomalyDetection: false,
    anomalySensitivity: "medium",
  },
  security: {
    enforce2FA: false,
    ipRestricted: false,
    allowedIPs: [],
    sessionMaxAgeHours: 720, // 30 days
    loginRateLimit: 5,
    geoFencingEnabled: false,
  },
  financial: {
    vatRate: 18,
    platformFee: 5,
    invoiceDueDays: 30,
    autoInvoicingEnabled: false,
    multiCurrencyEnabled: true,
  },
  governance: {
    maintenanceMode: false,
    maintenanceMessage: "We are performing scheduled maintenance. We'll be back shortly.",
    allowPublicSignup: true,
    whitelistedDomains: ["gmail.com", "icloud.com", "morchantra.com"],
    enabledRegions: ["IN", "US", "EU", "ASEAN"],
    requireEmailVerification: true,
  },
  operations: {
    slaThresholdHours: 4,
    broadcastMessage: "",
    broadcastActive: false,
    supportEmail: "support@morchantra.com",
    maxConcurrentRequests: 10,
  },
  lastUpdatedAt: "2026-01-01T00:00:00.000Z", // Static to prevent server/client hydration mismatch
  lastUpdatedBy: "system",
};

/** Load config from localStorage with default fallback */
export function loadPlatformConfig(): PlatformConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const stored = JSON.parse(raw);
    // Deep merge: stored values take priority, defaults fill missing keys
    return deepMerge(DEFAULT_CONFIG, stored) as PlatformConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** Save config to localStorage */
export function savePlatformConfig(config: PlatformConfig): void {
  try {
    config.lastUpdatedAt = new Date().toISOString();
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent("mrc:config-updated", { detail: config }));
  } catch (e) {
    console.error("[PlatformConfig] Failed to save:", e);
  }
}

/** Sync a specific partial update */
export function updatePlatformConfig(patch: DeepPartial<PlatformConfig>): PlatformConfig {
  const current = loadPlatformConfig();
  const updated = deepMerge(current, patch) as PlatformConfig;
  savePlatformConfig(updated);
  return updated;
}

// ── Utilities ────────────────────────────────────────────────────────────────

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] ?? {}, source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}
