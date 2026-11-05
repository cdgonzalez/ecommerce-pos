# EcoPOS — Unified E-Commerce & In-Store Point of Sale Engine

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7%2B-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Tests](https://img.shields.io/badge/Tests-76%2F76%20Passing%20(100%25)-brightgreen?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Enterprise-grade, dual-channel retail engine** synchronizing digital B2C storefront sales, counter POS register terminals, and back-office order fulfillment over a unified relational data model, backed by ACID transactional concurrency and cash drawer reconciliation (Corte Z).

---

## Table of Contents

- [Overview & Core Value](#overview--core-value)
- [System Architecture & Invariants](#system-architecture--invariants)
  - [Architectural Flow](#architectural-flow)
  - [Core Design Invariants](#core-design-invariants)
- [Feature Matrix](#feature-matrix)
  - [1. B2C Digital Storefront](#1-b2c-digital-storefront)
  - [2. High-Speed POS Counter Terminal](#2-high-speed-pos-counter-terminal)
  - [3. Cash Register Shifts & Corte Z Reconciliation](#3-cash-register-shifts--corte-z-reconciliation)
  - [4. Order Fulfillment Pipeline](#4-order-fulfillment-pipeline)
  - [5. Centralized Administration & Auditing](#5-centralized-administration--auditing)
- [Technology Stack](#technology-stack)
- [Monorepo Project Structure](#monorepo-project-structure)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Installation & Database Setup](#installation--database-setup)
  - [Running the Application](#running-the-application)
- [REST API Reference](#rest-api-reference)
- [Architectural Deep Dives](#architectural-deep-dives)
  - [Session Security & Token Rotation](#session-security--token-rotation)
  - [POS Shift Lifecycle & Arqueo Z Formula](#pos-shift-lifecycle--arqueo-z-formula)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Project Roadmap & Governance](#project-roadmap--governance)
- [License](#license)

---

## Overview & Core Value

Traditional retail systems suffer from split-brain state: online sales occur on an e-commerce platform while physical in-store sales run on separate cash register hardware, causing inventory discrepancies, overselling, and manual end-of-day reconciliation nightmares.

**EcoPOS** solves this by unifying both channels on a single PostgreSQL relational backbone and Redis caching layer:
- **Zero-Overselling Guarantee**: Simultaneous online and counter checkout requests compete under conditional database locks and deterministic ordering, eliminating deadlocks and negative stock.
- **Audited Cash Lifecycle**: Physical cash register sessions enforce starting float declarations, mid-shift cash drops (sangrías a bóveda), cash inflows, and automated physical count reconciliation (*Corte Z*) with variance calculations.
- **Enterprise Session Security**: Dual-token authentication with short-lived JWTs and rotating refresh tokens stored in the database, fortified with automatic token reuse detection that revokes compromised sessions instantly.
- **Fulfillment Transparency**: Digital customer orders follow an auditable multi-step fulfillment state machine with printable packing slips and automatic stock restoration upon cancellation.

---

## System Architecture & Invariants

### Architectural Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIER                                  │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│    B2C Storefront       │   In-Store POS Terminal │   Admin Back-Office     │
│   (Catalog & Cart)      │ (Cashier Sales & Shifts)│ (Orders, Inventory, KPi)│
└────────────┬────────────┴────────────┬────────────┴────────────┬────────────┘
             │                         │                         │
             └──────────────────┐      │      ┌──────────────────┘
                                ▼      ▼      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY (EXPRESS)                            │
│  ├── Helmet & CORS Security Headers                                         │
│  ├── Rate Limiters (Global & Auth Brute-Force Protection)                   │
│  ├── JWT Authentication & Token Rotation Engine                             │
│  ├── Declarative RBAC Middleware (requirePermission)                        │
│  └── Contract-Driven Request Validation (Zod boundary schemas)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS & SERVICE LAYER                            │
│  ├── SalesService (Atomic shift-bound sale execution & inventory deduction) │
│  ├── ShiftsService (Cash drawer float, movements & Corte Z reconciliation)  │
│  ├── OrdersService (Fulfillment lifecycle, cancellations & stock restores)  │
│  ├── CatalogService (Redis read-caching & deterministic invalidation)       │
│  └── AuditService (Universal immutable operational audit trail)             │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        ▼                             ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────────┐
│     POSTGRESQL (via Prisma ORM)   │ │           REDIS (In-Memory)           │
│  ├── ACID Transaction Isolation   │ │  ├── Catalog Cache (Products/Cats)    │
│  ├── Deadlock-Free Product Sort   │ │  ├── Rate Limiting Store              │
│  ├── Immutable Line Item Snapshots│ │  └── Deterministic Cache Invalidation │
│  └── Universal Audit Logs         │ └───────────────────────────────────────┘
└───────────────────────────────────┘
```

### Core Design Invariants

1. **Dual-Channel Unified Commerce (E-Commerce & POS Parity)**:
   A single, consolidated source of truth governs products, categories, stock levels, and customer profiles. A physical sale processed at a counter terminal deducts available stock from the exact same inventory pool as a web customer cart checkout.
2. **ACID Consistency & Zero-Overselling**:
   Every mutation affecting inventory executes inside `prisma.$transaction`. Items are pre-sorted deterministically by `productId` (`a.productId.localeCompare(b.productId)`) to prevent deadlocks under concurrent traffic. Stock deductions enforce conditional SQL constraints (`quantity: { gte: requested }`). If stock is insufficient, the transaction cleanly rolls back with zero partial writes.
3. **Immutable Snapshots**:
   `OrderItem` and `SaleItem` records snapshot unit price, item name, and SKU at the exact instant of purchase. Subsequent catalog price adjustments or product renames never alter historic financial ledgers.
4. **Contract-Driven Boundary Validation & RBAC**:
   All incoming payloads are strictly validated against Zod schemas prior to reaching controller or service layers. Protected routes enforce bearer authentication and granular RBAC (`PROCESS_SALES`, `VIEW_REPORTS`, `MANAGE_USERS`, `MANAGE_PRODUCTS`).
5. **Multi-Tier Redis Caching with Deterministic Invalidation**:
   Read-heavy catalog endpoints (`GET /catalog/products`, `GET /catalog/categories`) cache responses in Redis with configurable TTLs. Any catalog update or stock mutation purges matching cache patterns (`catalog:products:*`) post-commit to guarantee immediate storefront freshness.

---

## Feature Matrix

### 1. B2C Digital Storefront
- **Responsive Catalog**: Debounced keyword and SKU search, category-based filtering, and real-time pagination.
- **Product Detail**: Full specifications, dynamic pricing, and intuitive quantity selectors.
- **Persistent Shopping Cart**: Client-side reactive cart managed via Zustand with automatic subtotal, 16% tax, and total computations.
- **Multi-Method Checkout**: Structured payment options (`CREDIT_CARD`, `TRANSFER`, `DIGITAL`), shipping address capture, and atomic order creation.
- **Customer Account Portal**: Order history with visual fulfillment tracking badges and personal profile inspection.

### 2. High-Speed POS Counter Terminal
- **Cashier Terminal Interface**: Split-screen design with responsive product catalog buttons on the left and live digital sales ticket on the right.
- **Instant Product Lookups**: Real-time SKU and product scanning with debounced typeahead.
- **Shift Binding Enforcement**: POS register automatically locks if no active cashier shift is open, preventing orphan sales.
- **Payment Method Toggle**: One-click switching between Cash, Credit Card, and Debit Card payments.

### 3. Cash Register Shifts & Corte Z Reconciliation
- **Opening Cash Float**: Mandatory initial drawer float prompt unlocking the terminal for operations.
- **Mid-Shift Cash Movements**: Categorized records for cash injections (`CASH_IN`) and cash drops to safe (`CASH_OUT`) with mandatory reasons.
- **End-of-Day Blind/Guided Arqueo**: Cashiers enter counted physical cash; the system computes expected cash and variance:
  $$\text{Expected Cash} = \text{Initial Float} + \text{Cash Sales} + \text{Cash In} - \text{Cash Out}$$
  $$\text{Variance} = \text{Counted Cash} - \text{Expected Cash}$$
- **Printable Corte Z Report**: Monospace fiscal/administrative receipt layout rendering initial float, gross sales breakdown by payment method, net movements, counted cash, and variance badges.

### 4. Order Fulfillment Pipeline
- **Deterministic Status Machine**: Structured state progression: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED` (or `CANCELLED`).
- **Inventory Restitution**: Cancelling an order automatically returns allocated stock back to inventory within an atomic database transaction.
- **Printable Packing Slips**: Warehouse-ready packing slips detailing recipient information, shipping address, ordered items, and SKU codes.

### 5. Centralized Administration & Auditing
- **Executive Dashboard**: Real-time metrics tracking gross revenue, transaction counts, low stock alerts, and customer registrations.
- **Inventory Control**: Real-time stock counts, minimum stock thresholds, manual adjustments (`IN` / `OUT`), and low stock filters.
- **Unified Transaction Ledger**: Consolidated view merging digital web orders and physical POS sales chronologically.
- **Universal Audit Log**: Structured chronological timeline tracking actor identity, IP address, action types, affected entity IDs, and metadata snapshots.

---

## Technology Stack

| Layer | Technology | Key Capabilities & Rationale |
|---|---|---|
| **Backend Framework** | [Express 5](https://expressjs.com/) on [Node.js 20+](https://nodejs.org/) | Scalable, non-blocking asynchronous REST API architecture |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end type safety across backend and frontend |
| **Database & ORM** | [PostgreSQL 15+](https://www.postgresql.org/) & [Prisma ORM 7](https://www.prisma.io/) | Relational consistency, migrations, and atomic `$transaction` blocks |
| **Caching & Invalidation** | [Redis 7](https://redis.io/) | Multi-tier response caching and rapid token revocation |
| **Contract Validation** | [Zod 3](https://zod.dev/) | Strict runtime payload validation at HTTP boundaries |
| **Frontend Framework** | [React 19](https://react.dev/) & [Vite 8](https://vitejs.dev/) | Fast single-page application bundling with instant HMR |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) | Minimalist, unopinionated client stores for Cart, POS, and Auth |
| **Styling & Icons** | [Tailwind CSS 3](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) | Utility-first responsive styling and modern SVG iconography |
| **Testing Framework** | [Vitest 3](https://vitest.dev/) & [Supertest 7](https://github.com/ladjs/supertest) | High-speed unit tests and API integration testing |

---

## Monorepo Project Structure

```text
ecommerce-pos/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Data models (User, Shift, Sale, Order, Inventory, etc.)
│   │   └── migrations/                # Versioned SQL migrations
│   ├── src/
│   │   ├── core/                      # Shared infrastructure (Prisma, Redis, middlewares, logger)
│   │   │   ├── cache/redis.client.ts
│   │   │   ├── database/prisma.client.ts
│   │   │   ├── middlewares/           # auth, rbac, rate-limiting, request validation
│   │   │   └── utils/                 # AppError, calculations, pagination
│   │   ├── modules/                   # Domain modules (Clean Architecture)
│   │   │   ├── audit/                 # Universal audit logging service & controller
│   │   │   ├── auth/                  # JWT, rotating refresh tokens, session revocation
│   │   │   ├── catalog/               # Products, categories, Redis cached routes
│   │   │   ├── customers/             # Customer profiles & addresses
│   │   │   ├── dashboard/             # Aggregated executive KPI metrics
│   │   │   ├── inventory/             # Stock levels, movements & threshold alerts
│   │   │   ├── orders/                # Order creation, fulfillment state machine
│   │   │   ├── sales/                 # POS checkout, shift binding & payments
│   │   │   ├── shifts/                # Cash drawer sessions, movements & Corte Z
│   │   │   ├── transactions/          # Unified multi-channel ledger & refunds
│   │   │   └── users/                 # User directory & RBAC role assignments
│   │   ├── app.ts                     # Express application configuration
│   │   └── server.ts                  # Server entry point & graceful shutdown
│   └── tests/
│       ├── unit/                      # Unit tests (auth, shifts, sales, orders, calculations)
│       └── integration/               # API integration tests with Supertest
│
├── frontend/
│   ├── src/
│   │   ├── features/                  # Domain feature modules
│   │   │   ├── account/               # Customer account portal & order tracking
│   │   │   ├── admin/                 # OrdersList, ShiftsManagement, Inventory, Reports, Audit
│   │   │   ├── auth/                  # Login & authentication view
│   │   │   ├── cart/                  # Shopping cart overview
│   │   │   ├── checkout/              # B2C order checkout
│   │   │   ├── pos/                   # Cashier register, Shift modals (Open, Move, Close)
│   │   │   └── products/              # Catalog grid, category filters, product details
│   │   ├── layouts/                   # MainLayout (Storefront), POSLayout, AdminLayout
│   │   ├── routes/                    # React Router configuration & ProtectedRoute
│   │   ├── services/api/              # Axios client with bearer interceptors
│   │   └── store/                     # Zustand state stores (auth, cart, pos)
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── specs/                             # Spec Kit architectural specifications & roadmaps
    ├── 001-admin-order-management/    # Order fulfillment state machine spec
    ├── 002-auth-session-refresh/      # Refresh token rotation spec
    ├── 003-pos-cash-shifts/           # Cash drawer shifts & Corte Z spec
    └── 004-project-readme/            # Documentation & architecture spec
```

---

## Getting Started & Local Setup

### Prerequisites

Ensure the following tools are installed and running locally:
- **Node.js**: `v20.x` or later (LTS recommended)
- **npm**: `v9.x` or later
- **PostgreSQL**: `v15.x` or later
- **Redis**: `v7.x` or later (standalone or via Docker)

> **Quick Docker tip for databases**:
> ```bash
> docker run --name ecopos-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15-alpine
> docker run --name ecopos-redis -p 6379:6379 -d redis:7-alpine
> ```

### Environment Variables (.env)

#### Backend (`backend/.env`)
Create `backend/.env` with the following configuration:
```env
PORT=3000
NODE_ENV=development

# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_pos_db?schema=public"

# Redis connection string
REDIS_URL="redis://localhost:6379"

# Security & Tokens
JWT_ACCESS_SECRET="your-super-secret-jwt-access-key-32-chars-minimum"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-32-chars-minimum"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"
```

#### Frontend (`frontend/.env`)
Create `frontend/.env` with the following configuration:
```env
VITE_API_URL="http://localhost:3000/api/v1"
```

### Installation & Database Setup

1. **Install Dependencies**:
   ```bash
   # Install backend dependencies
   npm --prefix backend install

   # Install frontend dependencies
   npm --prefix frontend install
   ```

2. **Generate Prisma Client & Run Migrations**:
   ```bash
   # Run Prisma database migrations
   npx --prefix backend prisma migrate dev --name init

   # Generate Prisma client types
   npm --prefix backend run prisma:generate
   ```

### Running the Application

In development mode, launch both services concurrently:

```bash
# Terminal 1: Launch Backend API (runs on http://localhost:3000)
npm --prefix backend run dev

# Terminal 2: Launch Frontend Web App (runs on http://localhost:5173)
npm --prefix frontend run dev
```

Visit `http://localhost:5173` to access the Storefront, `http://localhost:5173/pos` for the Cashier Terminal, or `http://localhost:5173/admin` for the Back-Office Dashboard.

---

## REST API Reference

All API routes are prefixed with `/api/v1` and return standardized JSON responses:
`{ "status": "success", "data": ... }` or `{ "status": "error", "message": ... }`.

### Authentication & Sessions (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new customer account |
| `POST` | `/auth/login` | Public | Authenticate user, issue access + refresh tokens |
| `POST` | `/auth/refresh-token` | Public | Rotate refresh token, issue fresh access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token and terminate active session |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile and RBAC permissions |
| `POST` | `/auth/revoke-user-sessions/:userId` | Admin (`MANAGE_USERS`) | Force-revoke all sessions for a specific user |

### POS Cash Drawer Shifts (`/shifts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/shifts/open` | `PROCESS_SALES` | Open new cashier shift with initial cash float |
| `GET` | `/shifts/current` | `PROCESS_SALES` | Get active open shift details for current cashier |
| `POST` | `/shifts/:id/movements` | `PROCESS_SALES` | Record cash drop (`CASH_OUT`) or cash injection (`CASH_IN`) |
| `POST` | `/shifts/:id/close` | `PROCESS_SALES` | Finalize shift, perform physical count & compute Corte Z variance |
| `GET` | `/shifts` | `VIEW_REPORTS` | List historical shifts with pagination and status filters |
| `GET` | `/shifts/:id/summary` | Authenticated | Retrieve complete Corte Z financial audit breakdown |

### Point of Sale Terminal (`/sales`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/sales` | `PROCESS_SALES` | Execute POS counter sale, bind to active shift, deduct stock |
| `GET` | `/sales` | `VIEW_REPORTS` | Retrieve recent in-store sales transactions |

### Customer Orders & Fulfillment (`/orders`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/orders` | Authenticated | Create new digital customer order with atomic stock allocation |
| `GET` | `/orders/my-orders` | Authenticated | Retrieve order history for current customer |
| `GET` | `/orders` | Admin (`PROCESS_SALES`) | Paginated administrative order list with search & status filters |
| `GET` | `/orders/:id` | Admin (`PROCESS_SALES`) | Retrieve detailed order view with item snapshots & payments |
| `PATCH` | `/orders/:id/status` | Admin (`PROCESS_SALES`) | Advance fulfillment state (`CONFIRMED`, `PROCESSING`, `SHIPPED`, etc.) |
| `POST` | `/orders/:id/cancel` | Admin (`PROCESS_SALES`) | Cancel order and automatically restore stock via ACID transaction |

### Inventory & Stock Movements (`/inventory`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/inventory` | Authenticated | List all inventory items with optional `lowStock=true` filter |
| `POST` | `/inventory/adjust` | Admin (`MANAGE_PRODUCTS`) | Manual stock adjustment (`IN` / `OUT`) with mandatory reason |

### Product Catalog (`/catalog`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/catalog/categories` | Public (Cached) | List all product categories |
| `POST` | `/catalog/categories` | Admin (`MANAGE_PRODUCTS`) | Create category and purge Redis cache |
| `GET` | `/catalog/products` | Public (Cached) | Search & filter active products with pagination |
| `GET` | `/catalog/products/:slug`| Public (Cached) | Retrieve detailed product information by slug |
| `POST` | `/catalog/products` | Admin (`MANAGE_PRODUCTS`) | Create new product and invalidate Redis cache keys |

### Unified Transactions & Refunds (`/transactions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/transactions` | `VIEW_REPORTS` | Chronological multi-channel ledger merging Orders and Sales |
| `POST` | `/transactions/refund` | Admin (`PROCESS_SALES`) | Process full refund and restore product inventory |

### System Audit Trail (`/audit`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/audit/logs` | Admin (`MANAGE_USERS`) | Retrieve paginated immutable audit log events |

---

## Architectural Deep Dives

### Session Security & Token Rotation

```text
Cashier Login ─────────► Returns Access Token (15m) + Refresh Token (7d)
                              │
When Access Token Expires ───► POST /auth/refresh-token with Refresh Token
                              │
               Is Token Valid & Unused?
               ├── YES ──► Issue New Access Token + New Rotating Refresh Token
               │           (Old Refresh Token marked as REVOKED in DB)
               │
               └── NO (Replayed / Reused Token Detected)
                           │
                           ▼
               CRITICAL SECURITY TRIGGER:
               Token Reuse Detected!
               └── Invalidate ALL active sessions for this user in DB
               └── Log Audit Action: TOKEN_REUSE_DETECTED
               └── Return 401 Unauthorized
```

### POS Shift Lifecycle & Arqueo Z Formula

```text
 1. APERTURA (Shift Opening)
    └── Cashier declares Initial Float ($) ──► Shift status: OPEN
                                              └── Terminal Unlocks
 2. OPERACIÓN (During Shift)
    ├── Process POS Sales ──► Sale bound to active shiftId atomically
    ├── Cash Injection ─────► CASH_IN movement logged (+ expected cash)
    └── Vault Drop ─────────► CASH_OUT movement logged (- expected cash)

 3. CORTE Z (Shift Closing & Reconciliation)
    └── Cashier performs physical count: Counted Cash ($)
        ├── Expected Cash = Initial Float + Cash Sales + Inflows - Drops
        ├── Variance = Counted Cash - Expected Cash
        ├── Shift status updated to: CLOSED
        ├── Audit Action logged: SHIFT_CLOSED_CORTE_Z
        └── System generates printable Corte Z thermal audit ticket
```

---

## Testing & Quality Assurance

EcoPOS enforces automated testing across backend business logic, concurrency control, and API contracts.

### Running Backend Tests
Execute the complete Vitest test suite (unit and integration tests):
```bash
npm --prefix backend test
```
**Expected Test Output**:
```text
Test Files  9 passed (9)
     Tests  76 passed (76)
  Duration  ~18.0s
```

### Coverage Scope
- **`shifts.service.spec.ts` & `shifts.api.spec.ts`**: Shift uniqueness, initial float, cash movements, Corte Z variance computation, summary breakdown, and permission gates.
- **`sales.service.spec.ts`**: Rejection of sales without open shift, shift binding, atomic inventory deduction, and deadlock-free product sorting.
- **`auth.service.spec.ts` & `auth.api.spec.ts`**: Password hashing, JWT creation, rotating refresh token lifecycle, and token reuse attack defense.
- **`orders.service.spec.ts` & `orders.api.spec.ts`**: Order creation, status progression, cancellation inventory restitution, and authorization.
- **`calculations.spec.ts` & `pagination.spec.ts`**: Tax computations, financial rounding, and pagination metadata builders.

### Build Verification & Type Checking
Verify clean compilation across both projects:
```bash
# Verify backend TypeScript compilation
npm --prefix backend run build

# Verify frontend TypeScript compilation and Vite bundling
npm --prefix frontend run build
```

---

## Project Roadmap & Governance

The platform's architectural evolution is governed by [Spec Kit](https://github.com/github/spec-kit) specifications located in `/specs`:

### Implemented Milestones
- [x] **Feature 001 — Admin Order Management & Fulfillment**: Deterministic status machine, stock restitution on cancel, packing slips.
- [x] **Feature 002 — Auth Session Refresh & Invalidation**: Refresh token rotation, reuse detection, and session management.
- [x] **Feature 003 — POS Cash Register Shifts & Corte Z**: Shift lifecycle, cash drops, arqueo reconciliation, and audit tickets.
- [x] **Feature 004 — Professional Project README Documentation**: Comprehensive technical specification, architecture guides, and developer quickstart.

### Upcoming Roadmap
- [ ] **Catalog Media Storage & Brand Management**: Cloud bucket / S3 image upload integration and full Brand CRUD.
- [ ] **POS Quick-Customer & Thermal Sales Receipts**: In-terminal customer selection and thermal receipt generation.
- [ ] **B2C Customer Self-Service**: Public registration (`/register`), profile management, and saved shipping addresses.
- [ ] **Inventory Kárdex Audit Trail**: Dedicated historical movement inspection view per product.
- [ ] **Asynchronous Payment Gateways**: Stripe / MercadoPago webhook listeners with idempotent event deduplication.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
You are free to use, modify, and distribute this software for personal and commercial applications.

