"use client";

import { useState, useEffect } from "react";
import {
  getUsage,
  subscribeToUsage,
  PLAN_LIMITS,
  type UsageData,
} from "@/lib/usage-tracker";
import { getAuthSession } from "@/lib/auth-session";

export type UsageStats = UsageData & {
  requestLimit: number;
  storageLimit: number;
  aiLimit: number;
  planLabel: string;
  requestPct: number;
  storagePct: number;
  aiPct: number;
  nearRequestLimit: boolean;
  atRequestLimit: boolean;
  nearAiLimit: boolean;
  atAiLimit: boolean;
};

export function useUsage(): UsageStats {
  const email = getAuthSession()?.email;

  const compute = (): UsageStats => {
    const usage = getUsage(email);
    const limits = PLAN_LIMITS[usage.plan] ?? PLAN_LIMITS.starter;
    const requestPct = Math.min(
      100,
      (usage.requestsUsed / limits.requests) * 100
    );
    const storagePct = Math.min(
      100,
      (usage.storageUsedMB / (limits.storage * 1024)) * 100
    );
    const aiPct = Math.min(
      100,
      ((usage.aiUsed || 0) / limits.aiMessages) * 100
    );
    return {
      ...usage,
      requestLimit: limits.requests,
      storageLimit: limits.storage,
      aiLimit: limits.aiMessages,
      planLabel: limits.label,
      requestPct,
      storagePct,
      aiPct,
      nearRequestLimit: requestPct >= 70,
      atRequestLimit: usage.requestsUsed >= limits.requests,
      nearAiLimit: aiPct >= 70,
      atAiLimit: (usage.aiUsed || 0) >= limits.aiMessages,
    };
  };

  const [stats, setStats] = useState<UsageStats>(compute);

  useEffect(() => {
    // Re-read on mount (handles stale server snapshot)
    setStats(compute());
    // Subscribe to real-time push updates
    const unsub = subscribeToUsage(() => setStats(compute()));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return stats;
}
