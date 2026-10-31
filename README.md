# BRIGHTLOOP — Enterprise Subscription Management System

> **Hackathon Edition — Member 1 Frontend Architecture & UI/UX Implementation**

Brightloop is a commercial-grade, enterprise financial operations platform purpose-built for modern SaaS recurring billing, CPQ, revenue intelligence, and customer self-service. Designed with an original, sophisticated identity benchmarked against modern financial systems like Stripe Billing and Ramp.

---

## 🎨 Visual Identity & Brand Design System

Brightloop deliberately avoids generic SaaS gradients and standard admin templates. It is crafted around a bespoke, high-contrast financial palette:

| Design Token | Hex Code | Purpose |
|---|---|---|
| **Obsidian Graphite** | `#171B19` | Deep, focused navigation sidebar, headers, and active anchors |
| **Deep Forest** | `#263D32` | Secondary containers, badges, and trust indicators |
| **Electric Chartreuse** | `#C5F36A` | Primary action buttons, active navigation accents, key metrics |
| **Warm Ivory** | `#F5F3EA` | Soft, glare-reducing financial workspace canvas background |
| **Muted Sage** | `#A5B5A4` | Subdued borders, secondary icons, and subtle dividers |
| **Slate Grey** | `#737C77` | Metadata, subtitles, and secondary tabular labels |
| **Border Grey** | `#DDE1D8` | Crisp structural borders and table outlines |
| **Pure White** | `#FFFFFF` | Card surfaces, modals, and input controls |

---

## 📂 Exact Project Structure

The project strictly follows the requested architecture:

```
brightloop/
├── frontend/                     # Member 1 Development Workspace
│   ├── public/
│   │   └── logo.svg              # Brand vector logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Button, Modal, Loader, DataTable, SearchBar
│   │   │   ├── layout/           # Sidebar, Navbar, DashboardLayout
│   │   │   └── dashboard/        # StatCard, RevenueChart, RecentActivity
│   │   ├── pages/
│   │   │   ├── auth/             # Login, Register, ForgotPassword
│   │   │   ├── admin/            # Dashboard, Customers, Products, Plans, Quotations,
│   │   │   │                     # Subscriptions, Invoices, Payments, Discounts,
│   │   │   │                     # Analytics, RevenueSentinel, Team, AuditLogs, Settings
│   │   │   └── customer/         # CustomerDashboard, MySubscription, MyInvoices,
│   │   │                         # MyPayments, MyProfile
│   │   ├── services/             # Axios instance & service abstractions
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── customerService.ts
│   │   │   ├── productService.ts
│   │   │   ├── subscriptionService.ts
│   │   │   ├── invoiceService.ts
│   │   │   ├── paymentService.ts
│   │   │   └── analyticsService.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # JWT session, auto-login, instant persona switcher
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.tsx # RBAC route guard
│   │   │   └── AppRoutes.tsx      # Comprehensive client routing
│   │   ├── types/
│   │   ├── utils/
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                      # Running REST API backend (Port 5000)
├── shared/                       # Shared models and schemas
├── docs/                         # API Contracts and architecture guides
│   └── API_CONTRACTS.md
└── README.md
```

---

## ⚡ Quickstart

### 1. Backend Service (Port 5000)
The backend features an automatic `mongodb-memory-server` fallback. It boots instantly without any local MongoDB installation required, auto-seeding realistic enterprise data:
```bash
cd backend
npm install
node server.js
```
*API Base URL:* `http://localhost:5000/api`

### 2. Frontend Development Server (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
*Access UI at:* `http://localhost:5173`

### 3. Production Build & Typecheck
```bash
cd frontend
npm run build
```
*(Verified: Compiles 100% cleanly with zero TypeScript or Vite errors).*

---

## 👥 Demo Personas & Fast Role Switching

For seamless live hackathon judging, the interface includes an **instant Role Switcher** in the top navigation bar, as well as one-click demo login buttons on the `/login` screen:

| Role | Demo Credentials | Scope & Capabilities |
|---|---|---|
| **ADMIN** | `admin@brightloop.io` / `Brightloop@2025` | Full Command Center, MRR/ARR analytics, Revenue Sentinel anomalies, team RBAC, audit logs, and catalog management. |
| **STAFF** | `staff@brightloop.io` / `Brightloop@2025` | Customer operations, custom B2B CPQ quotations, invoice issuance, and payment ledger recording. |
| **CUSTOMER** | `arun.nair@vertexmedia.in` / `Brightloop@2025` | Customer Self-Service Portal: current plan status, upgrade/downgrade requests, period-end cancellation, GST tax invoices (print/PDF), and electronic payment receipts. |

---

## 🚀 Key Features Implemented by Member 1

### A. Authentication & Onboarding
- **Login screen**: Password visibility toggle, credentials validation, loading and error states, and one-click demo credentials loader.
- **Registration screen**: Organization name, business email, password strength indicator, and role provisioning.
- **Forgot Password**: Verification code request flow with clear instructional states.

### B. Admin Command Center (`/admin/dashboard`)
- Real-time financial KPIs calculated directly from integer paise minor units:
  - **MRR (Monthly Recurring Revenue)** with period-over-period percentage growth.
  - **ARR (Annual Run Rate)**.
  - **Active Subscriptions** count.
  - **Total Customers** enrolled.
  - **Churn Rate** and **Outstanding Revenue**.
- **Interactive Recharts visualizer**: 6-month historical MRR trajectory with responsive tooltip formatting in Indian Rupees (`₹`).
- **Revenue Sentinel live widget**: Anomaly detection surfacing overdue accounts, failed payments, and high-value churn risks.
- **Recent activity ledger**: Real-time event log of created quotes, issued invoices, and plan modifications.

### C. Enterprise Customer Management (`/admin/customers`)
- Complete customer directory with real-time text search and lifecycle filtering (Active, Trial, Inactive).
- **Create Customer Modal**: Legal entity name, primary contact email, phone, GSTIN, and structured registered billing address.
- **Customer Details Drawer/Modal**: Tabular summary of linked subscriptions, billing invoices, payment history, and audit timeline.

### D. Customer Self-Service Portal (`/customer/*`)
- **Customer Dashboard**: Overview of current plan tier, recurring price, renewal date, and balance due.
- **My Subscription (`/customer/subscription`)**:
  - Subscription details card with active status badges.
  - Plan upgrade / downgrade request modal with target tier selector and change justification.
  - Self-service cancellation request modal with cancellation reason capture and period-end effectuation.
- **My Invoices (`/customer/invoices`)**:
  - Chronological invoice ledger with GST tax breakdown, due dates, and settlement status.
  - Modal with **Print / Save PDF** capability.
  - "Pay Now" action modal with UPI, Card, and Net Banking options.
- **My Payments (`/customer/payments`)**:
  - Audit trail of transactions with banking UTR numbers and reconciliation verification.
  - Electronic receipt view modal for legal GST compliance.
- **My Profile (`/customer/profile`)**:
  - Edit contact phone and registered GST billing address with real-time API sync.

### E. Unified Navigation & Design Utilities
- **Sidebar**: Collapsible Obsidian Graphite navigation with clear section grouping (Overview, Commerce, Revenue, Intelligence, System).
- **Navbar**: Active breadcrumbs, global search modal (`Ctrl+K` ready), notification tray, and instant persona quick-switcher.
- **Formatters**: `formatINR()` implementing standard Indian Numbering System grouping (lakhs/crores) with strict tabular numerals (`font-mono`).
- **Services Architecture**: Centralized Axios client (`src/services/api.ts`) managing JWT auth headers, response interceptors, and typed endpoints.

---

## 🛡️ Hackathon Review Checklist
- [x] Strict adherence to Member 1 boundary (isolated inside `frontend/`).
- [x] Exact project directory hierarchy followed.
- [x] Zero duplicate backends or rogue databases.
- [x] TypeScript build passes with 0 errors.
- [x] Backend running on port 5000 with seed data ready.
- [x] Responsive layout with custom Brightloop palette tokens.
