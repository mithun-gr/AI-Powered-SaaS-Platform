# Morchantra — Full Build Log & Feature Document
**Status:** ✅ Active Development  
**Started:** January 2026  
**Last Updated:** 21 March 2026  
**Built By:** Mithunraj GR (Founder & CEO, Morchantra)

---

## 🧱 Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Custom CSS |
| Animations | Framer Motion |
| UI Components | shadcn/ui (Card, Button, Input, etc.) |
| Icons | Lucide React |
| Fonts | Google Fonts (Inter) |
| Auth | Supabase Auth + TOTP 2FA (local TOTP library) |
| Database Client | Supabase JS (`@supabase/supabase-js`) |
| Currency | Custom `currency-provider` context |
| QR Code | `qrcode.react` |
| Smooth Scroll | Custom smooth-scroll provider |
| Accessibility | Custom accessibility panel provider |

### Backend (AI Engine)
| Layer | Technology |
|---|---|
| Runtime | Python 3.9 |
| Framework | FastAPI + Uvicorn |
| AI Agent | LlamaIndex (ReActAgent) |
| LLM | Groq API — `llama-3.1-8b-instant` (lightning fast, free tier) |
| Local LLM (dev) | Ollama — `llama3.2` / `llama3.2:1b` |
| Vector DB | Qdrant (for RAG pipeline) |
| RAG | LlamaIndex VectorStoreIndex |
| Database | Supabase (PostgreSQL) via `supabase-py` |
| Chat Storage | SQLite (local — `morchantra_chat.db`) |
| Env Config | `python-dotenv` |

### Database (Supabase PostgreSQL)
| Table | Purpose |
|---|---|
| `users` | Registered client profiles |
| `requests` | Client service requests |
| `invoices` | Billing and invoice records |
| `activity_logs` | Admin audit — registrations & password changes |
| `chat_messages` | (Planned) AI chat message history |

---

## 📅 Features Built — Day by Day

---

### Phase 1 — Landing Page & Marketing Site

- [x] Built full **Morchantra.com landing page**
- [x] Hero section with animated gradient headline
- [x] Services section (8 core service cards)
- [x] Pricing section (top-layer only — contact-for-quote strategy)
- [x] About section with founder info
- [x] Contact section with mailto links
- [x] Responsive design (mobile, tablet, desktop)
- [x] Dark mode by default (premium aesthetic)
- [x] Red glow card effects (`red-glow` utility class)
- [x] Smooth scroll navigation
- [x] SEO meta tags and page title

---

### Phase 2 — Client Portal (Authentication)

- [x] **Login Page** — email + password via Supabase Auth
- [x] **Signup Page** — creates real Supabase Auth user + inserts into `users` table
- [x] Domain validation — only Gmail and iCloud emails allowed
- [x] Role-based routing — clients → `/dashboard`, admins → `/admin`
- [x] Admin tab / Client tab toggle on login
- [x] Mock user fallback (for offline / Supabase-down scenarios)
- [x] **2FA (Two-Factor Authentication)** — TOTP via Microsoft/Google Authenticator
  - [x] Setup flow: generate secret → QR code displayed → verify code → enable
  - [x] Login flow: if 2FA enabled, intercept login → show 6-digit OTP screen
  - [x] TOTP verified locally using time-based algorithm (`lib/totp.ts`)
  - [x] Verified end-to-end
- [x] localStorage session persistence
- [x] Remember me checkbox
- [x] Show/hide password toggle

---

### Phase 3 — Client Dashboard

- [x] **Overview Dashboard** — stats cards (requests, payments, documents)
- [x] Greeting with live time-based message (Good Morning / Afternoon / Evening)
- [x] Recent Requests widget
- [x] Recent Invoices widget
- [x] Quick Action buttons (New Request, Upload Doc, Expert Call, Visit Website)
- [x] Animated stat counters
- [x] Collapsible sidebar navigation
- [x] Sidebar toggle button with smooth animation
- [x] Responsive layout (sidebar collapses on mobile)
- [x] Active route highlighting in sidebar

---

### Phase 4 — Client Portal Pages

#### Requests
- [x] **Requests List Page** — view all past requests with status badges
- [x] **New Request Page** — 2-step form
  - Step 1: Choose service type (8 animated cards)
  - Step 2: Fill request details
- [x] Request form fields: Title, Description, Urgency, Budget Min/Max, Preferred Date
- [x] **Budget validation** — blocks negative values + blocks min > max on submit
- [x] Date input with `min` set to today (no past dates)
- [x] Character counter on description field
- [x] Success animation on submission

#### Documents
- [x] Documents page — upload vault placeholder
- [x] File listing with mock document data

#### Payments / Invoices
- [x] Payments page — invoice list with status badges
- [x] Currency display based on user's country setting
- [x] Wise payment integration mention

#### Settings
- [x] Profile settings tab
- [x] Notification preferences tab
- [x] Security tab — **real password change** via Supabase Auth
- [x] Password change now logs to `activity_logs` table for admin auditing
- [x] 2FA toggle in security settings
- [x] Theme settings tab
- [x] Preferences tab — country/currency selector

#### Support
- [x] Support page with contact options

---

### Phase 5 — Admin Dashboard

- [x] Admin-only route guard
- [x] **Admin Overview Dashboard**
  - Total Clients stat
  - Active Requests stat
  - Total Revenue stat
  - Recent Requests table
  - Recent Clients table
- [x] **Admin Clients Page (rewritten)** — now pulls **live data from Supabase**
  - Shows all registered users in real-time
  - Displays name, email, role, 2FA status, join date
  - Search by name or email
  - Refresh button to re-fetch live data
- [x] **Activity Log section** — shows registrations and password changes (admin-only)
- [x] Admin Analytics page
- [x] Admin Invoices page
- [x] Admin Requests page

---

### Phase 6 — AI Chat Bot ("Later")

- [x] **Chat Widget** (`chat-widget.tsx`) — floating bottom-right button
  - Opens a full chat panel
  - Animated typing indicator (3-dot bounce)
  - User messages (right-aligned) + Bot messages (left-aligned)
  - Suggestion chip buttons for quick actions
  - Minimise and close (hide) controls
  - Hidden on login / signup / admin pages
- [x] Widget reads real `userId` from localStorage (logged-in user's Supabase ID)
- [x] **Offline fallback** — if backend is down, falls back to local `chatbotService` (dummy responses)
- [x] Online fallback shows `"⚠️ [Offline Mode]"` prefix

#### AI Backend (`ai-backend/`)

- [x] FastAPI server with `/chat`, `/health`, `/ingest`, `/support-ticket` endpoints
- [x] ReActAgent (LlamaIndex) with tool calling
- [x] Groq `llama-3.1-8b-instant` — ultra fast cloud LLM (free tier)
- [x] Local dev option: Ollama (`llama3.2`, `llama3.2:1b`)

#### AI Tools (what the bot can do)

| Tool | Function |
|---|---|
| `get_company_info` | Returns Morchantra company info (founder, motto, services, address, pricing strategy) |
| `get_user_requests` | Queries Supabase `requests` table for logged-in user |
| `get_user_documents` | Returns user's document vault info |
| `schedule_consultation` | Simulates booking an expert call |
| `get_payment_status` | Queries Supabase `invoices` table for logged-in user |
| `send_email` | Sends a message to any email (pulls user profile from Supabase for From name/email) |

#### AI Knowledge Base

- [x] Morchantra HQ: `49, ullur, Kumbakonam, Thanjavur district 612001 TN, India`
- [x] Founder & CEO: Mithunraj GR
- [x] Motto: "Empowering Digital Excellence"
- [x] Founded: 2024
- [x] Services: Web Design, Legal Advice, Tech (MERN/Cloud), Property Support, AI Automation, Insurance Renewal
- [x] Pricing: Top-layer only (custom quotes via contact)
- [x] Support email: support@morchantra.com
- [x] Support hours: Mon–Fri, 9AM–6PM

#### Chat Storage
- [x] SQLite local DB (`morchantra_chat.db`) stores every chat message server-side
- [x] Each entry: user_id, sender (user/bot), content, timestamp

---

### Phase 7 — Polish & Bug Fixes

- [x] **Dark mode calendar visibility** — `color-scheme: dark` + background/text CSS overrides
- [x] Calendar icon hover glow (red brand colour)
- [x] Login crash fix — Supabase failures now fall back cleanly to mock users without error overlay
- [x] Admin clients page — removed localStorage dependency, now reads from Supabase live
- [x] Backend startup fix — uses `python -m uvicorn` to avoid shell encoding `--reload` bug
- [x] `MONGO_URI` import error fixed in `main.py` (replaced with `SUPABASE_URL`)
- [x] Agent tool name conflict fixed (`send_contact_email` → `send_email`)
- [x] Tool description precision — AI now picks email tool vs. consultation tool correctly
- [x] CEO title added to AI knowledge ("Founder and CEO: Mithunraj GR")
- [x] Switched from Ollama (slow on MacBook Air) back to Groq for rapid responses
- [x] 2FA end-to-end verified

---

## 🔐 Security Features

- Supabase Row Level Security (RLS) on all tables
- TOTP-based 2FA (time-based — rotates every 30 seconds)
- Password hashed by Supabase Auth (bcrypt)
- API keys stored in `.env` / `.env.local` (never committed)
- Admin routes guard — only `role: admin` users can access `/admin`
- Email domain whitelist on signup (Gmail + iCloud only)

---

## 🚀 How to Run Locally

### Frontend
```bash
cd /Users/mithunrajgr/Desktop/Desktop/Morchantra
npm run dev
# → http://localhost:3000
```

### AI Backend
```bash
cd /Users/mithunrajgr/Desktop/Desktop/Morchantra/ai-backend
source venv/bin/activate
python -m uvicorn main:app --port 8000 --reload
# → http://localhost:8000
```

---

## 📌 Pending / Next Steps

- [ ] Create `activity_logs` table in Supabase SQL Editor
- [ ] Wire email tool to real provider (Resend / SendGrid) for actual Gmail delivery
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway / Render (switch to Groq for production)
- [ ] Add Qdrant RAG with real Morchantra website content
- [ ] Admin: view individual client detail pages
- [ ] Push notifications for new requests

---

*Document auto-generated on 21 March 2026 from full conversation build history.*
