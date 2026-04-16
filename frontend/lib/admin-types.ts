// Admin-specific types

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "client" | "admin";
  joinedDate: string;
  status: "active" | "inactive";
  totalRequests: number;
  totalSpent: number;
}

export interface AdminRequest {
  id: string;
  title: string;
  service: string;
  status: "new" | "in-progress" | "waiting" | "completed";
  createdAt: string;
  description: string;
  priority: "low" | "medium" | "high";
  budget: string;
  assignedExpert?: string;
  clientName: string;
  clientEmail: string;
  assignedTo?: string;
  revenue: number;
}

export interface AdminStats {
  totalClients: number;
  activeRequests: number;
  totalRevenue: number;
  pendingInvoices: number;
  completedThisMonth: number;
  revenueGrowth: number;
}

export interface Expert {
  id: string;
  name: string;
  expertise: string[];
  activeRequests: number;
  rating: number;
  availability: "available" | "busy" | "offline";
}
