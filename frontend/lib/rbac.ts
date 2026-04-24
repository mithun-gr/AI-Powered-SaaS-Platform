/**
 * lib/rbac.ts
 *
 * Enterprise Role-Based Access Control (RBAC) Engine
 * Inspired by Salesforce's Role Hierarchy + Territory Management model.
 *
 * TWO dimensions of access control:
 *
 * 1. ROLE HIERARCHY (vertical)  — what features/pages you can access
 *    founder → ceo → [cfo | cto] → supervisor → employee → client
 *
 * 2. DOMAIN SCOPE (horizontal) — which RECORDS you can see within those features
 *    Each supervisor/employee is assigned a single service domain.
 *    They can only see requests tagged to that domain.
 *    C-Suite (founder/ceo/cfo/cto) see ALL domains.
 */

import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  Cpu,
  Radio,
  TrendingUp,
  UserCog,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// 1. SERVICE DOMAINS
// ─────────────────────────────────────────────────────────────────────────────

/** The 8 service verticals Morchantra offers */
export type ServiceDomain =
  | "legal"
  | "insurance"
  | "aws"
  | "azure"
  | "mern"
  | "ai_chatbot"
  | "data_analytics"
  | "civil_property"
  | "all"; // C-Suite and Founder can see all domains

export const DOMAIN_META: Record<ServiceDomain, { label: string; color: string }> = {
  legal:          { label: "Legal Advisory",         color: "text-amber-400"  },
  insurance:      { label: "Insurance Services",     color: "text-blue-400"   },
  aws:            { label: "AWS Cloud",              color: "text-orange-400" },
  azure:          { label: "Azure Cloud",            color: "text-sky-400"    },
  mern:           { label: "MERN Development",       color: "text-green-400"  },
  ai_chatbot:     { label: "AI Chatbot",             color: "text-purple-400" },
  data_analytics: { label: "Data Analytics",         color: "text-pink-400"   },
  civil_property: { label: "Civil & Property",       color: "text-yellow-400" },
  all:            { label: "All Domains",            color: "text-white"      },
};

/**
 * Roles that can see ALL domains regardless of their assigned domain.
 * Mirrors Salesforce's "Modify All Data" and "View All Data" permissions.
 */
const CROSS_DOMAIN_ROLES: Role[] = ["founder", "ceo", "cfo", "cto"];

/** Returns true if this role can see records from all domains */
export function hasGlobalDomainAccess(role: Role): boolean {
  return CROSS_DOMAIN_ROLES.includes(role);
}

/**
 * Given a user's role and assigned domain, returns which service domains
 * they are allowed to see records from.
 */
export function getAllowedDomains(role: Role, assignedDomain: ServiceDomain): ServiceDomain[] {
  if (hasGlobalDomainAccess(role)) {
    // C-Suite: all domains
    return ["legal", "insurance", "aws", "azure", "mern", "ai_chatbot", "data_analytics", "civil_property"];
  }
  // Supervisors and employees: only their assigned domain
  return assignedDomain === "all"
    ? ["legal", "insurance", "aws", "azure", "mern", "ai_chatbot", "data_analytics", "civil_property"]
    : [assignedDomain];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ROLE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type Role =
  | "founder"
  | "ceo"
  | "cfo"
  | "cto"
  | "supervisor"
  | "employee"
  | "client";

export const ROLE_META: Record<Role, { label: string; color: string; level: number }> = {
  founder:    { label: "FOUNDER",    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", level: 1 },
  ceo:        { label: "CEO",        color: "text-purple-400 bg-purple-400/10 border-purple-400/30", level: 2 },
  cfo:        { label: "CFO",        color: "text-blue-400   bg-blue-400/10   border-blue-400/30",   level: 3 },
  cto:        { label: "CTO",        color: "text-cyan-400   bg-cyan-400/10   border-cyan-400/30",   level: 3 },
  supervisor: { label: "SUPERVISOR", color: "text-green-400  bg-green-400/10  border-green-400/30",  level: 4 },
  employee:   { label: "EMPLOYEE",   color: "text-gray-300   bg-gray-400/10   border-gray-400/30",   level: 5 },
  client:     { label: "CLIENT",     color: "text-primary    bg-primary/10    border-primary/30",    level: 6 },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERMISSION KEYS
// ─────────────────────────────────────────────────────────────────────────────

export type Permission =
  | "view_dashboard"
  | "view_clients"
  | "edit_clients"
  | "view_requests"
  | "manage_requests"
  | "view_invoices"
  | "manage_invoices"
  | "view_financial_reports"
  | "view_analytics"
  | "view_advanced_analytics"
  | "view_team"
  | "manage_team"
  | "view_settings"
  | "manage_settings"
  | "view_security"
  | "manage_security"
  | "view_ai_engine"
  | "manage_ai_engine"
  | "broadcast_messages"
  | "view_audit_log"
  | "manage_all";

// ─────────────────────────────────────────────────────────────────────────────
// 4. PERMISSION SETS (additive per role — inherited downward)
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  employee: [
    "view_dashboard",
    "view_clients",
    "view_requests",
    "manage_requests",
    "view_analytics",
  ],
  supervisor: [
    "edit_clients",
    "view_team",
    "view_invoices",
    "view_security",
  ],
  cfo: [
    "manage_invoices",
    "view_financial_reports",
    "view_advanced_analytics",
    "broadcast_messages",
  ],
  cto: [
    "view_settings",
    "view_ai_engine",
    "manage_ai_engine",
    "manage_security",
    "view_audit_log",
    "view_advanced_analytics",
    "broadcast_messages",
  ],
  ceo: [
    "manage_team",
    "manage_settings",
    "view_audit_log",
    "broadcast_messages",
    "view_financial_reports",
    "view_advanced_analytics",
    "manage_security",
  ],
  founder: [
    "manage_all",
    "manage_team",
    "manage_settings",
    "manage_invoices",
    "view_audit_log",
    "broadcast_messages",
    "manage_security",
    "view_financial_reports",
    "view_advanced_analytics",
  ],
  client: [],
};

// Inheritance chain: role at index N inherits from all roles below it
const HIERARCHY_CHAIN: Role[] = ["founder", "ceo", "cto", "cfo", "supervisor", "employee", "client"];

function computePermissions(role: Role): Set<Permission> {
  const perms = new Set<Permission>();
  const idx = HIERARCHY_CHAIN.indexOf(role);
  if (idx === -1) return perms;
  for (let i = idx; i < HIERARCHY_CHAIN.length; i++) {
    for (const p of ROLE_PERMISSIONS[HIERARCHY_CHAIN[i]] ?? []) {
      perms.add(p);
    }
  }
  return perms;
}

const COMPUTED: Record<Role, Set<Permission>> = {
  founder:    computePermissions("founder"),
  ceo:        computePermissions("ceo"),
  cfo:        computePermissions("cfo"),
  cto:        computePermissions("cto"),
  supervisor: computePermissions("supervisor"),
  employee:   computePermissions("employee"),
  client:     new Set(),
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/** Check if a role has a specific permission */
export function can(role: Role, permission: Permission): boolean {
  if (role === "founder") return true;
  const perms = COMPUTED[role];
  return perms?.has(permission) || perms?.has("manage_all") || false;
}

/** Check if a role is an internal staff role (not a client) */
export function isInternalRole(role: string): boolean {
  return ["founder", "ceo", "cfo", "cto", "supervisor", "employee"].includes(role);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DOMAIN-EMAIL MAPPING
// Maps email addresses to their assigned domain (for supervisor/employee roles)
// In production this would be stored in the DB; for now it's a config map.
// ─────────────────────────────────────────────────────────────────────────────

export const DOMAIN_EMAIL_MAP: Record<string, ServiceDomain> = {
  // Supervisors — one per domain
  "legal.supervisor@morchantra.com":      "legal",
  "insurance.supervisor@morchantra.com":  "insurance",
  "aws.supervisor@morchantra.com":        "aws",
  "azure.supervisor@morchantra.com":      "azure",
  "mern.supervisor@morchantra.com":       "mern",
  "ai.supervisor@morchantra.com":         "ai_chatbot",
  "analytics.supervisor@morchantra.com":  "data_analytics",
  "civil.supervisor@morchantra.com":      "civil_property",

  // Employees — domain-scoped too
  "legal.employee@morchantra.com":        "legal",
  "insurance.employee@morchantra.com":    "insurance",
  "aws.employee@morchantra.com":          "aws",
  "azure.employee@morchantra.com":        "azure",
  "mern.employee@morchantra.com":         "mern",
  "ai.employee@morchantra.com":           "ai_chatbot",
  "analytics.employee@morchantra.com":    "data_analytics",
  "civil.employee@morchantra.com":        "civil_property",

  // C-Suite — all domains
  "founder@morchantra.com":   "all",
  "ceo@morchantra.com":       "all",
  "cfo@morchantra.com":       "all",
  "cto@morchantra.com":       "all",

  // Legacy admin defaults to supervisor with full domain
  "admin@morchantra.com":     "all",
  "supervisor@morchantra.com": "all",
  "employee@morchantra.com":  "all",
};

/** Get the domain for a given email, defaulting to "all" for C-suite */
export function getDomainForEmail(email: string): ServiceDomain {
  return DOMAIN_EMAIL_MAP[email.toLowerCase()] ?? "all";
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ADMIN SIDEBAR NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission: Permission;
  dividerBefore?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  // Core
  { name: "Dashboard",         href: "/admin",              icon: LayoutDashboard, permission: "view_dashboard" },
  { name: "Clients",           href: "/admin/clients",      icon: Users,           permission: "view_clients" },
  { name: "Requests",          href: "/admin/requests",     icon: FileText,        permission: "view_requests" },

  // Finance
  { name: "Invoices",          href: "/admin/invoices",     icon: Receipt,         permission: "view_invoices",         dividerBefore: true },
  { name: "Financial Reports", href: "/admin/financials",   icon: TrendingUp,      permission: "view_financial_reports" },

  // Intelligence
  { name: "Analytics",         href: "/admin/analytics",    icon: BarChart3,       permission: "view_analytics",        dividerBefore: true },

  // Operations
  { name: "Team",              href: "/admin/team",         icon: UserCog,         permission: "view_team",             dividerBefore: true },
  { name: "Broadcast",         href: "/admin/broadcast",    icon: Radio,           permission: "broadcast_messages" },

  // System
  { name: "AI Engine",         href: "/admin/ai-engine",    icon: Cpu,             permission: "view_ai_engine",        dividerBefore: true },
  { name: "Security & Audit",  href: "/admin/security",     icon: ShieldCheck,     permission: "view_security" },
  { name: "Settings",          href: "/settings",           icon: Settings,        permission: "view_settings" },
];

/** Returns only the nav items a given role is allowed to see */
export function getNavForRole(role: Role): NavItem[] {
  if (!isInternalRole(role)) return [];
  return ADMIN_NAV.filter((item) => can(role, item.permission));
}
