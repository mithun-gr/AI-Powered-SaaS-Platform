import { Request, Invoice, Document } from "./types";

export interface ChatbotResponse {
  message: string;
  suggestions?: string[];
}

// System Persona: Business Concierge "Morchy"
export class ChatbotService {
  private requests: Request[];
  private invoices: Invoice[];
  private documents: Document[];
  private persona: "helpful" | "neutral" | "aggressive";

  constructor(
    requests: Request[], 
    invoices: Invoice[], 
    documents: Document[], 
    persona: "helpful" | "neutral" | "aggressive" = "helpful"
  ) {
    this.requests = requests;
    this.invoices = invoices;
    this.documents = documents;
    this.persona = persona;
  }

  setPersona(persona: "helpful" | "neutral" | "aggressive") {
    this.persona = persona;
  }

  processMessage(message: string): ChatbotResponse {
    const lowerMessage = message.toLowerCase();
    
    // AI Feature 16: Sentiment Sentiment Escalation
    const negativeSignals = ["angry", "bad", "terrible", "worst", "hate", "issue", "problem", "broken", "fraud", "scam"];
    const isDistressed = negativeSignals.some(s => lowerMessage.includes(s));

    if (isDistressed && this.persona !== "aggressive") {
        return {
            message: this.wrapTone("I detect some frustration in your query. I'm escalating this to a senior human advisor immediately to ensure we resolve this correctly."),
            suggestions: ["Connect to representative", "Back to dashboard"]
        };
    }
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 9 && currentHour < 18;

    // 1. Identify Intent & Map to Service

    // --- Core Functionality (Data Aware) ---
    
    // Track Requests
    if (lowerMessage.includes("track") || lowerMessage.includes("status") || (lowerMessage.includes("request") && !lowerMessage.includes("submit"))) {
      return this.handleRequestTracking(lowerMessage);
    }

    // Payment/Invoice
    if (lowerMessage.includes("payment") || lowerMessage.includes("invoice") || lowerMessage.includes("bill")) {
      return this.handlePaymentQuery();
    }

    // Documents
    if (lowerMessage.includes("upload") || lowerMessage.includes("document") || lowerMessage.includes("vault")) {
      return this.handleDocumentQuery();
    }

    // --- Service Knowledge Base (8 Core Services) ---

    // 1. Legal Advisor
    if (lowerMessage.includes("legal") || lowerMessage.includes("law") || lowerMessage.includes("contract") || lowerMessage.includes("jurisdiction")) {
      return {
        message: "As your Legal Advisor guide, I can assist with consultation overviews and document reviews. Please note that I provide guidance, not final legal definitions. Our legal services are sensitive to your jurisdiction.\n\nWould you like to schedule a consultation with a legal expert?",
        suggestions: ["Schedule Legal Consult", "Document Review Info"]
      };
    }

    // 2. Insurance Services
    if (lowerMessage.includes("insurance") || lowerMessage.includes("policy") || lowerMessage.includes("claim")) {
      return this.handleInsuranceQuery();
    }

    // 3. MERN Fullstack Development
    if (lowerMessage.includes("mern") || lowerMessage.includes("react") || lowerMessage.includes("node") || lowerMessage.includes("web app")) {
      return {
        message: "Our MERN Fullstack Development services cover end-to-end web application architecture. We can discuss feature feasibility, development timelines, and the MERN (MongoDB, Express, React, Node.js) stack best suited for your project.\n\nShall we review your feature requirements?",
        suggestions: ["Discuss Feasibility", "View Tech Stack"]
      };
    }

    // 4. AWS Cloud Setup
    if (lowerMessage.includes("aws") || lowerMessage.includes("amazon") || (lowerMessage.includes("cloud") && !lowerMessage.includes("azure"))) {
      return {
        message: "For AWS Cloud Setup, I can guide you through cloud architecture, deployment best practices, and cost scalability. We focus on building secure and efficient AWS environments.\n\nAre you looking to migrate or build a new infrastructure?",
        suggestions: ["New AWS Setup", "Migration Guide"]
      };
    }

    // 5. Azure Cloud Setup
    if (lowerMessage.includes("azure") || lowerMessage.includes("microsoft cloud")) {
      return {
        message: "Our Azure Cloud Setup services assist with Microsoft Azure infrastructure, including seamless deployment and migration strategies. We ensure your Azure environment is optimized for enterprise needs.\n\nDo you have existing Azure infrastructure?",
        suggestions: ["Azure Migration", "Infrastructure Setup"]
      };
    }

    // 6. Chatbot Building
    if (lowerMessage.includes("chatbot") || lowerMessage.includes("ai") || lowerMessage.includes("automation")) {
      return {
        message: "I can guide you through our Chatbot Building services, covering AI design, automation use cases, and system integration. We build smart assistants—just like me, Morchy!—to enhance customer engagement.\n\nWhat kind of automation are you envisioning?",
        suggestions: ["AI Chatbot Design", "Automation Use Cases"]
      };
    }

    // 7. Data Analytics
    if (lowerMessage.includes("data") || lowerMessage.includes("analytics") || lowerMessage.includes("dashboard") || lowerMessage.includes("visualization")) {
      return {
        message: "Our Data Analytics service focuses on business intelligence, custom dashboards, and data visualization to support data-driven decisions. We turn raw data into actionable insights.\n\nDo you need help visualizing your current data integration?",
        suggestions: ["Dashboard Demo", "BI Consultation"]
      };
    }

    // 8. Civil / Home Property Support
    if (lowerMessage.includes("civil") || lowerMessage.includes("property") || lowerMessage.includes("home") || lowerMessage.includes("real estate")) {
      return {
        message: "For Civil and Home Property Support, allow me to guide you through property management and civil engineering consultation overviews. We ensure all advice adheres to local norms and regulations.\n\nAre you seeking management advice or engineering consultation?",
        suggestions: ["Property Management", "Civil Consultation"]
      };
    }

    // Greetings / Identity
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("who are you") || lowerMessage.includes("later")) {
      const timeGreeting = isBusinessHours ? "it's a productive day!" : "it's currently after hours, but I'm here to help.";
      return {
        message: `Hello! I'm Morchy, your AI-powered Business Concierge. ${timeGreeting}\n\nI can assist you with our 8 core services, including Legal, Insurance, Tech (MERN/Cloud), and Property Support. How can I assist you today?`,
        suggestions: ["Track Request", "Legal Advice", "Tech Services", "Property Support"]
      };
    }

    // Thank you
    if (lowerMessage.includes("thank")) {
      return {
        message: "You're very welcome. It's my pleasure to assist you.\n\nIs there anything else I can help you resolve today?",
        suggestions: ["Check Invoices", "New Request"]
      };
    }

    // Unsupported / Fallback (Global Rule)
    return {
      message: this.wrapTone("That’s a great question. To ensure you get an accurate and personalized response, please share your query at **support@dummyemail.com**. Our team will review it and get back to you."),
      suggestions: ["Contact Support", "Browse Services"]
    };
  }

  // --- Handlers ---

  private wrapTone(content: string): string {
    switch (this.persona) {
      case "aggressive":
        return `[URGENT] ${content.toUpperCase()} - ACTION REQUIRED.`;
      case "neutral":
        return `[LOG]: ${content}`;
      case "helpful":
      default:
        return `✨ ${content}`;
    }
  }

  private handleRequestTracking(message: string): ChatbotResponse {
    const activeRequests = this.requests.filter(r => r.status !== "completed");
    
    if (activeRequests.length === 0) {
      return {
        message: this.wrapTone("I've checked your records, and you currently have no active requests. I can help you submit a new service request if you'd like."),
        suggestions: ["Submit new request", "View services"]
      };
    }

    const requestInfo = activeRequests.map((req, index) => 
      `${index + 1}. ${req.title} (${req.id}) - Status: ${req.status.toUpperCase()}`
    ).join("\n");

    const latest = activeRequests[0];
    
    return {
      message: this.wrapTone(`I've found ${activeRequests.length} active request(s) for you:\n\n${requestInfo}\n\nYour latest request (ID: ${latest.id}) is currently ${latest.status}. I can provide more details or help you contact the assigned expert.`),
      suggestions: ["View details", "Contact expert"]
    };
  }

  private handleDocumentQuery(): ChatbotResponse {
    return {
      message: this.wrapTone(`You currently have ${this.documents.length} secure documents in your vault. I can guide you on how to upload new files or manage existing ones. Our vault supports PDF, DOCX, and image formats with enterprise-grade encryption.\n\nWould you like to proceed to the vault?`),
      suggestions: ["Go to Vault", "Upload Guide"]
    };
  }

  private handleInsuranceQuery(): ChatbotResponse {
    const insuranceRequest = this.requests.find(r => r.service === "insurance");
    
    if (insuranceRequest) {
      return {
        message: this.wrapTone(`Regarding your insurance inquiry: I see an active request (${insuranceRequest.id}) with status: ${insuranceRequest.status.toUpperCase()}.\n\nOur Insurance Services cover policy applications, renewals, and claims. Please remember that all insurance guidance is subject to your specific policy and jurisdiction.\n\nHow can I further assist with this?`),
        suggestions: ["Policy Details", "Claims Help"]
      };
    }

    return {
      message: this.wrapTone("Our Insurance Services team can guide you through policy applications, seamless renewals, and the claims process. We ensure you have the right coverage for your region.\n\nAre you looking to apply for a new policy or renew an existing one?"),
      suggestions: ["New Policy", "Renewal Help", "Claims Info"]
    };
  }

  private handlePaymentQuery(): ChatbotResponse {
    const pending = this.invoices.filter(inv => inv.status === "pending");
    
    if (pending.length > 0) {
      const total = pending.reduce((sum, inv) => sum + inv.amount, 0);
      return {
        message: this.wrapTone(`I've identified ${pending.length} pending invoice(s) totaling $${total}. Staying current ensures uninterrupted service.\n\nWould you like to review the invoice details or proceed to payment?`),
        suggestions: ["View Invoices", "Make Payment"]
      };
    }

    return {
      message: this.wrapTone("Great news—all your invoices are paid and up to date. You can view your complete payment history in the Payments section anytime."),
      suggestions: ["Payment History", "Pricing Plans"]
    };
  }
}
