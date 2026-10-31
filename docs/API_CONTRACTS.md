# Brightloop API Contracts & Specifications

This document outlines the API endpoints, data models, and authentication contracts utilized by the Brightloop Enterprise Subscription Management System.

---

## 1. Authentication & Session Management
All authenticated requests require `Authorization: Bearer <JWT_TOKEN>` header.

### Endpoints
- `POST /api/auth/register`
  - Body: `{ name, email, password, role?: 'ADMIN' | 'STAFF' | 'CUSTOMER' }`
  - Returns: `{ success: true, token, user }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ success: true, token, user }`
- `GET /api/auth/me`
  - Returns: `{ success: true, user }`

### Demo Credentials
| Role | Email | Password | Access Scope |
|---|---|---|---|
| **ADMIN** | `admin@brightloop.io` | `Brightloop@2025` | Full administrative control, Revenue Sentinel, Team & Audit |
| **STAFF** | `staff@brightloop.io` | `Brightloop@2025` | Commerce, Invoicing, Customers, Quotations |
| **CUSTOMER** | `arun.nair@vertexmedia.in` | `Brightloop@2025` | Customer Self-Service Portal only |

---

## 2. Customer Management (`/api/customers`)
- `GET /api/customers` — List customers with search, status, and tag filtering
- `POST /api/customers` — Create new customer organization
- `GET /api/customers/:id` — Get customer details, subscriptions, invoices, and timeline
- `PUT /api/customers/:id` — Update customer information
- `DELETE /api/customers/:id` — Archive / deactivate customer

---

## 3. Product & Catalog Management (`/api/products`, `/api/plans`)
- `GET /api/products` — List software products and modules
- `POST /api/products` — Register new product
- `GET /api/plans` — List pricing tiers with billing frequency (Monthly, Quarterly, Annual)
- `POST /api/plans` — Create plan tier with integer paise pricing

---

## 4. Quotations & CPQ (`/api/quotations`)
- `GET /api/quotations` — List quotes with status filtering
- `POST /api/quotations` — Draft custom B2B quotation
- `POST /api/quotations/:id/convert` — One-click conversion to active subscription & invoice

---

## 5. Subscriptions (`/api/subscriptions`)
- `GET /api/subscriptions` — List subscriptions with status filter
- `POST /api/subscriptions` — Provision new subscription
- `POST /api/subscriptions/:id/pause` — Pause billing cycle
- `POST /api/subscriptions/:id/resume` — Resume subscription
- `POST /api/subscriptions/:id/cancel` — Schedule cancellation
- `POST /api/subscriptions/:id/renew` — Execute manual or scheduled renewal cycle

---

## 6. Invoicing & Billing (`/api/invoices`)
- `GET /api/invoices` — List tax invoices with GST calculations
- `GET /api/invoices/:id` — Detailed invoice breakdown with line items and tax breakdown
- `POST /api/invoices` — Create manual invoice
- `POST /api/invoices/:id/void` — Void invoice

---

## 7. Payments & Banking Reconciliation (`/api/payments`)
- `GET /api/payments` — Audit ledger of all transactions and UTR references
- `POST /api/payments` — Record manual or offline payment
- `POST /api/payments/simulate-gateway` — Real-time automated payment simulation (UPI/Card)
- `POST /api/payments/:id/refund` — Issue full or partial refund

---

## 8. Customer Self-Service Portal (`/api/portal`)
- `GET /api/portal/dashboard` — Unified payload containing:
  - `customer` profile
  - `currentSubscription`
  - `invoices` (recent statements)
  - `payments` (transaction receipts)
  - `availablePlans` (for self-service upgrades)
- `POST /api/portal/request-plan-change` — Customer-initiated upgrade/downgrade request
- `POST /api/portal/request-cancellation` — Customer-initiated cancellation request
- `PUT /api/portal/profile` — Update contact phone and GSTIN registered billing address

---

## 9. Revenue Intelligence & Analytics (`/api/analytics`, `/api/intelligence`)
- `GET /api/analytics/kpis` — MRR, ARR, active subscriber count, churn rate, outstanding revenue
- `GET /api/analytics/mrr-trend` — 6-month historical MRR trajectory
- `GET /api/analytics/plan-distribution` — Distribution of subscribers across pricing tiers
- `GET /api/intelligence/revenue-alerts` — Revenue Sentinel anomaly detection (overdue invoices, churn risk, payment failures)
- `GET /api/intelligence/renewals` — Subscriptions up for renewal within 7-30 days
