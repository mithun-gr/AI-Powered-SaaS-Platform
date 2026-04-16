# Morchantra - Client Portal Dashboard

A premium client portal dashboard for business services with a stunning **black and red theme**. Built with Next.js, React, Tailwind CSS, and Framer Motion.

![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwind-css)

## ✨ Features

- 🎨 **Premium Dark Theme**: True black backgrounds with red accents
- 🔐 **Authentication**: Login and signup pages with session management
- 📊 **Dashboard**: Metrics, charts, and recent activity overview
- 📝 **Request Management**: Create, track, and manage service requests
- 📁 **Document Vault**: Secure document storage with folder organization
- 💳 **Payments**: Pricing tiers and invoice management
- 💬 **Chat Support**: Interactive chatbot interface
- ⚙️ **Settings**: Profile, notifications, security, and theme settings
- ✨ **Animations**: Smooth Framer Motion transitions throughout
- 📱 **Responsive**: Fully responsive design for mobile and desktop

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🔑 Demo Access

The application uses simulated authentication. **Any email and password will work**:

**Suggested credentials:**

- Email: `demo@morchantra.com`
- Password: `demo123`

## 📱 Pages

### Authentication

- **Login** (`/login`) - Email/password authentication with demo credentials
- **Signup** (`/signup`) - New account creation with validation

### Dashboard Pages

- **Dashboard** (`/dashboard`) - Overview with metrics and recent activity
- **My Requests** (`/requests`) - Service request list with detail panel
- **Submit Request** (`/requests/new`) - Two-step service request form
- **Document Vault** (`/documents`) - File management with folders
- **Payments** (`/payments`) - Pricing plans and invoice history
- **Chat Support** (`/support`) - AI chatbot interface
- **Settings** (`/settings`) - User preferences and account settings

## 🎨 Design Highlights

### Color Palette

- **Primary**: Red (#ef4444)
- **Background**: True Black (#000000)
- **Card**: Dark Gray (#0a0a0a)
- **Accent**: Red glow effects on interactive elements

### Animations

- Smooth page transitions
- Staggered card animations
- Pulse effects on notifications
- Red glow on hover
- Loading skeletons

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── requests/          # Request management
│   ├── documents/         # Document vault
│   ├── payments/          # Payment pages
│   ├── support/           # Chat support
│   ├── settings/          # Settings pages
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/
│   ├── layout/            # Sidebar, Navbar
│   └── ui/                # Reusable UI components
├── lib/
│   ├── dummy-data.ts      # Mock data
│   ├── types.ts           # TypeScript types
│   └── animations.ts      # Animation variants
└── tailwind.config.ts     # Tailwind configuration
```

## 🎯 Key Features

### Service Types Offered

- Legal Advisor
- Insurance Services (Apply/Renewal/Claims)
- MERN Fullstack Development
- AWS Cloud Setup
- Azure Cloud Setup
- Chatbot Building
- Data Analytics
- Civil/Home Property Support

### Request Management

- Create new requests with detailed forms
- Track request status (New, In Progress, Waiting, Completed)
- View assigned experts
- Timeline of updates
- File attachments

### Document Organization

- Encrypted storage notice
- Folder structure: Legal, Insurance, Property, Tech, Analytics
- File preview modal
- Download and delete actions

### Payment System

- 3 pricing tiers (Starter, Pro, Enterprise)
- Invoice history with status tracking
- Payment method management

## 📄 License

This project is for demonstration purposes.

## 👨‍💻 Development

Built with ❤️ using modern web technologies for a premium user experience.

---

**Note**: This is a demo application with simulated backend. For production use, integrate with real authentication API, database, and payment processors.
