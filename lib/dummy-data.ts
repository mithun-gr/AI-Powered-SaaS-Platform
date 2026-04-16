import type {
    Request,
    Document,
    Invoice,
    ChatMessage,
    PricingTier,
    DashboardMetric,
    User,
} from "./types";

export const currentUser: User = {
    id: "1",
    name: "Mithunraj G R",
    email: "mithungrraj@gmail.com",
    phone: "9344997505",
    avatar: "",
    role: "client",
    twoFactorEnabled: true,
};

export const MOCK_USERS = [
    {
        id: "demo",
        name: "Demo User",
        email: "demo@morchantra.com",
        password: "demo123",
        role: "client",
        twoFactorEnabled: true,
        twoFactorSecret: "JBSWY3DPEHPK3PXP" // Example base32 secret
    },
    {
        id: "admin",
        name: "Admin User",
        email: "admin@morchantra.com",
        password: "demo123",
        role: "admin",
        twoFactorEnabled: true,
        twoFactorSecret: "ADMINSETUPKEY234" // Valid base32 secret for admin
    }
];

export const dashboardMetrics: DashboardMetric[] = [
    {
        label: "Active Requests",
        value: 3,
        icon: "FileText",
        trend: { value: 2, direction: "up" },
    },
    {
        label: "Pending Invoices",
        value: 1,
        icon: "CreditCard",
    },
    {
        label: "Documents",
        value: 24,
        icon: "FolderOpen",
        trend: { value: 5, direction: "up" },
    },
    {
        label: "Support Tickets",
        value: 0,
        icon: "MessageCircle",
    },
];

export const recentRequests: Request[] = [
    {
        id: "REQ-001",
        title: "Legal Contract Review",
        description: "Need comprehensive review of employment contract with amendments and legal compliance verification.",
        service: "legal-advisor",
        status: "in-progress",
        priority: "high",
        budgetMin: 500,
        budgetMax: 1000,
        createdAt: "2026-01-20T10:00:00Z",
        updatedAt: "2026-01-25T14:30:00Z",
        assignedExpert: "Sarah Johnson, Legal Advisor",
        timeline: [
            {
                id: "1",
                date: "2026-01-25T14:30:00Z",
                title: "Contract Analysis Complete",
                description: "Initial review completed. Found 3 areas requiring attention.",
                type: "update",
            },
            {
                id: "2",
                date: "2026-01-22T09:00:00Z",
                title: "Expert Assigned",
                description: "Sarah Johnson has been assigned to your case.",
                type: "status-change",
            },
            {
                id: "3",
                date: "2026-01-20T10:00:00Z",
                title: "Request Created",
                description: "Your request has been submitted successfully.",
                type: "update",
            },
        ],
        attachments: [
            {
                id: "1",
                name: "employment_contract.pdf",
                size: "2.4 MB",
                type: "pdf",
                url: "#",
                uploadedAt: "2026-01-20T10:00:00Z",
            },
        ],
        notes: [
            {
                id: "1",
                author: "Sarah Johnson",
                content: "I've reviewed the contract. Please check the timeline for details.",
                createdAt: "2026-01-25T14:30:00Z",
            },
        ],
    },
    {
        id: "REQ-002",
        title: "Insurance Policy Renewal",
        description: "Renew business insurance policy with updated coverage for new equipment.",
        service: "insurance",
        status: "waiting",
        priority: "medium",
        budgetMin: 2000,
        budgetMax: 3000,
        createdAt: "2026-01-18T15:00:00Z",
        updatedAt: "2026-01-24T11:00:00Z",
        assignedExpert: "Michael Chen, Insurance Specialist",
        timeline: [
            {
                id: "1",
                date: "2026-01-24T11:00:00Z",
                title: "Waiting for Documents",
                description: "Please upload proof of new equipment purchase.",
                type: "update",
            },
            {
                id: "2",
                date: "2026-01-18T15:00:00Z",
                title: "Request Created",
                description: "Your request has been submitted successfully.",
                type: "update",
            },
        ],
        attachments: [],
        notes: [],
    },
    {
        id: "REQ-003",
        title: "AWS Cloud Infrastructure Setup",
        description: "Set up scalable AWS infrastructure for new web application with auto-scaling and monitoring.",
        service: "aws-cloud",
        status: "new",
        priority: "high",
        budgetMin: 3000,
        budgetMax: 5000,
        createdAt: "2026-01-26T08:00:00Z",
        updatedAt: "2026-01-26T08:00:00Z",
        timeline: [
            {
                id: "1",
                date: "2026-01-26T08:00:00Z",
                title: "Request Created",
                description: "Your request is being reviewed by our team.",
                type: "update",
            },
        ],
        attachments: [],
        notes: [],
    },
    {
        id: "REQ-004",
        title: "Data Analytics Dashboard",
        description: "Create interactive business intelligence dashboard for sales and customer data.",
        service: "data-analytics",
        status: "completed",
        priority: "medium",
        budgetMin: 1500,
        budgetMax: 2500,
        createdAt: "2026-01-10T09:00:00Z",
        updatedAt: "2026-01-24T16:00:00Z",
        assignedExpert: "Emma Davis, Data Analyst",
        timeline: [
            {
                id: "1",
                date: "2026-01-24T16:00:00Z",
                title: "Project Completed",
                description: "Dashboard deployed and documentation provided.",
                type: "status-change",
            },
            {
                id: "2",
                date: "2026-01-20T10:00:00Z",
                title: "Development Started",
                description: "Working on dashboard implementation.",
                type: "update",
            },
            {
                id: "3",
                date: "2026-01-10T09:00:00Z",
                title: "Request Created",
                description: "Your request has been submitted successfully.",
                type: "update",
            },
        ],
        attachments: [
            {
                id: "1",
                name: "dashboard_mockup.pdf",
                size: "1.8 MB",
                type: "pdf",
                url: "#",
                uploadedAt: "2026-01-15T10:00:00Z",
            },
        ],
        notes: [],
    },
];

export const documents: Document[] = [
    {
        id: "DOC-001",
        name: "employment_contract.pdf",
        type: "pdf",
        size: "2.4 MB",
        folder: "legal",
        uploadedAt: "2026-01-20T10:00:00Z",
        url: "#",
    },
    {
        id: "DOC-002",
        name: "insurance_policy_2025.pdf",
        type: "pdf",
        size: "1.2 MB",
        folder: "insurance",
        uploadedAt: "2026-01-15T14:00:00Z",
        url: "#",
    },
    {
        id: "DOC-003",
        name: "property_deed.pdf",
        type: "pdf",
        size: "3.1 MB",
        folder: "property",
        uploadedAt: "2026-01-12T09:00:00Z",
        url: "#",
    },
    {
        id: "DOC-004",
        name: "aws_architecture.pdf",
        type: "pdf",
        size: "890 KB",
        folder: "tech",
        uploadedAt: "2026-01-22T11:00:00Z",
        url: "#",
    },
    {
        id: "DOC-005",
        name: "analytics_report_q4.pdf",
        type: "pdf",
        size: "4.5 MB",
        folder: "analytics",
        uploadedAt: "2026-01-18T16:00:00Z",
        url: "#",
    },
];

export const invoices: Invoice[] = [
    {
        id: "INV-001",
        invoiceNumber: "INV-2026-001",
        service: "Data Analytics Dashboard",
        amount: 2000,
        status: "paid",
        issuedDate: "2026-01-24",
        dueDate: "2026-02-07",
        downloadUrl: "#",
    },
    {
        id: "INV-002",
        invoiceNumber: "INV-2026-002",
        service: "Enterprise Cloud Migration (AWS)",
        amount: 150000,
        status: "pending",
        issuedDate: "2026-01-25",
        dueDate: "2026-02-08",
        downloadUrl: "#",
    },
    {
        id: "INV-003",
        invoiceNumber: "INV-2025-125",
        service: "Insurance Consultation",
        amount: 500,
        status: "paid",
        issuedDate: "2025-12-15",
        dueDate: "2025-12-29",
        downloadUrl: "#",
    },
];

export const chatHistory: ChatMessage[] = [
    {
        id: "1",
        sender: "bot",
        content: "Hello! How can I help you today?",
        timestamp: "2026-01-26T10:00:00Z",
    },
    {
        id: "2",
        sender: "user",
        content: "I want to check the status of my legal contract review.",
        timestamp: "2026-01-26T10:01:00Z",
    },
    {
        id: "3",
        sender: "bot",
        content: "Your Legal Contract Review (REQ-001) is currently in progress. Sarah Johnson has completed the initial analysis and found 3 areas requiring attention. Would you like more details?",
        timestamp: "2026-01-26T10:01:30Z",
    },
];

export const pricingTiers: PricingTier[] = [
    {
        name: "Free",
        price: 0,
        period: "month",
        features: [
            "2 requests/month",
            "Basic dashboard",
            "Email notifications only",
            "Single user",
        ],
    },
    {
        name: "Starter",
        price: 5,
        period: "month",
        features: [
            "Up to 10 requests/month",
            "Basic support",
            "Document storage (5GB)",
            "Email notifications",
            "Single user access",
        ],
    },
    {
        name: "Pro",
        price: 15,
        period: "month",
        popular: true,
        features: [
            "Up to 30 requests/month",
            "Priority support",
            "Document storage (50GB)",
            "Email + SMS notifications",
            "Team access (up to 5 users)",
            "Basic analytics",
        ],
    },
    {
        name: "Enterprise",
        price: 49,
        period: "month",
        features: [
            "Unlimited requests",
            "24/7 premium support",
            "Unlimited storage",
            "All notification channels",
            "Unlimited team access",
            "Advanced analytics + custom integrations",
            "SLA guarantee",
        ],
    },
];

export const serviceTypes = [
    {
        id: "legal-advisor",
        name: "Legal Advisor",
        description: "Expert legal consultation and document review services",
        icon: "Scale",
    },
    {
        id: "insurance",
        name: "Insurance Services",
        description: "Policy application, renewal, and claims assistance",
        icon: "Shield",
    },
    {
        id: "mern-development",
        name: "MERN Fullstack Development",
        description: "Modern web applications using MongoDB, Express, React, Node.js",
        icon: "Code",
    },
    {
        id: "aws-cloud",
        name: "AWS Cloud Setup",
        description: "Cloud infrastructure and deployment on Amazon Web Services",
        icon: "Cloud",
    },
    {
        id: "azure-cloud",
        name: "Azure Cloud Setup",
        description: "Cloud infrastructure and deployment on Microsoft Azure",
        icon: "CloudCog",
    },
    {
        id: "chatbot-building",
        name: "Chatbot Building",
        description: "AI-powered chatbots for customer service and automation",
        icon: "Bot",
    },
    {
        id: "data-analytics",
        name: "Data Analytics",
        description: "Business intelligence and data visualization solutions",
        icon: "BarChart",
    },
    {
        id: "property-support",
        name: "Civil/Home Property Support",
        description: "Property management and civil engineering consultation",
        icon: "Home",
    },
    {
        id: "creative-design",
        name: "Creative Design",
        description: "Logo, Graphic Design, and UI/UX solutions",
        icon: "Palette",
    },
];
