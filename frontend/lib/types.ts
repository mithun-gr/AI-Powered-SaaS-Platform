export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    role: "client" | "admin";
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
}

export interface Request {
    id: string;
    title: string;
    description: string;
    service: ServiceType;
    status: "new" | "in-progress" | "waiting" | "completed";
    priority: "low" | "medium" | "high";
    budgetMin: number;
    budgetMax: number;
    createdAt: string;
    updatedAt: string;
    assignedExpert?: string;
    timeline: TimelineItem[];
    attachments: Attachment[];
    notes: Note[];
}

export type ServiceType =
    | "legal-advisor"
    | "insurance"
    | "mern-development"
    | "aws-cloud"
    | "azure-cloud"
    | "chatbot-building"
    | "data-analytics"
    | "property-support";

export interface TimelineItem {
    id: string;
    date: string;
    title: string;
    description: string;
    type: "update" | "comment" | "status-change";
}

export interface Attachment {
    id: string;
    name: string;
    size: string;
    type: string;
    url: string;
    uploadedAt: string;
}

export interface Note {
    id: string;
    author: string;
    content: string;
    createdAt: string;
}

export interface Document {
    id: string;
    name: string;
    type: "pdf" | "image" | "doc";
    size: string;
    folder: "legal" | "insurance" | "property" | "tech" | "analytics";
    uploadedAt: string;
    url: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    service: string;
    amount: number;
    status: "paid" | "pending" | "overdue";
    issuedDate: string;
    dueDate: string;
    downloadUrl: string;
}

export interface ChatMessage {
    id: string;
    sender: "user" | "bot";
    content: string;
    timestamp: string;
}

export interface PricingTier {
    name: string;
    price: number;
    period: string;
    features: string[];
    popular?: boolean;
}

export interface DashboardMetric {
    label: string;
    value: string | number;
    icon: string;
    trend?: {
        value: number;
        direction: "up" | "down";
    };
}
