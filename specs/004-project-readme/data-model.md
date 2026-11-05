# Phase 1 Data Model: Documentation Section Schema & Taxonomy

**Feature**: `004-project-readme`
**Date**: 2026-11-05
**Status**: Completed

## 1. Documentation Information Architecture

The `README.md` is modeled as a structured hierarchical document designed to satisfy three distinct reader personas: Technical Evaluator, Onboarding Engineer, and Systems Auditor.

```text
README.md
├── 1. Header & Executive Overview
│   ├── Badges Bar
│   ├── System Identity & Core Mission
│   └── Highlights Summary
├── 2. Architecture & Design Principles
│   ├── High-Level System Architecture Diagram
│   ├── Principle I: Dual-Channel Unified Commerce
│   ├── Principle II: ACID Atomicity & Zero-Overselling Invariant
│   ├── Principle III: Immutable Snapshots & Universal Auditability
│   ├── Principle IV: Contract Validation & Granular RBAC
│   └── Principle V: Multi-Tier Redis Caching & Invalidation
├── 3. System Capabilities & Feature Matrix
│   ├── B2C E-Commerce Storefront
│   ├── In-Store POS Register Terminal
│   ├── POS Cash Drawer & Shift Management (Corte Z)
│   ├── Order Management & Fulfillment Pipeline
│   └── Central Back-Office Administration
├── 4. Technology Stack
│   ├── Backend & Infrastructure
│   ├── Frontend & UI
│   └── Developer Tools & Testing
├── 5. Repository Structure
│   └── Annotated Monorepo Tree
├── 6. Getting Started & Local Setup
│   ├── Prerequisites
│   ├── Environment Variables (.env)
│   ├── Database Migrations & Prisma Setup
│   └── Running the Applications
├── 7. REST API Endpoints Overview
│   └── Domain Route Matrices
├── 8. Testing & Quality Gates
│   ├── Unit & Integration Testing
│   └── Build & Type-Check Verification
├── 9. Project Roadmap & Evolution Log
│   ├── Completed Milestones
│   └── Upcoming Capabilities
└── 10. License & Acknowledgments
```

## 2. Section Entities & Metadata Definition

### Entity: `HeaderSection`
- **Title**: EcoPOS — Unified E-Commerce & Point of Sale System
- **Tagline**: Enterprise-grade dual-channel retail engine with real-time inventory synchronization, POS cash drawer reconciliation (Corte Z), and ACID-safe transactional consistency.
- **Badges**:
  - `Node.js`: `v20+`
  - `TypeScript`: `v5+`
  - `React`: `v19`
  - `Prisma`: `v7`
  - `PostgreSQL`: `v15+`
  - `Redis`: `v7+`
  - `Tests`: `76/76 Passing (100%)`
  - `License`: `MIT`

### Entity: `ArchitectureSection`
- **Visual Diagram**: Textual/Mermaid flow showing Client Tier (Web Storefront, POS Terminal, Admin UI) → API Gateway (Express, Middlewares, RBAC) → Service Tier (Atomic Transactions, Cache Invalidation, Audit Logger) → Storage Tier (PostgreSQL, Redis).
- **Core Invariants**:
  - Deterministic deadlock prevention via `productId` sorting.
  - Conditional database updates preventing negative stock.
  - Refresh token reuse detection revoking active user sessions.
  - Closed shift locking preventing orphan post-closure transactions.

### Entity: `EnvironmentConfiguration`
- **Backend Variables**:
  - `PORT`: Server listening port (default `3000`).
  - `DATABASE_URL`: PostgreSQL connection URI with pooled connections.
  - `REDIS_URL`: Redis connection URI.
  - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Cryptographic secrets.
  - `JWT_ACCESS_EXPIRES_IN` (e.g. `15m`) & `JWT_REFRESH_EXPIRES_IN` (e.g. `7d`).
- **Frontend Variables**:
  - `VITE_API_URL`: Backend base URI (default `http://localhost:3000/api/v1`).

### Entity: `ApiRouteMatrix`
- Grouping of 8 core functional modules:
  1. `/api/v1/auth`: Registration, Login, Token Refresh, Revocation, Me.
  2. `/api/v1/shifts`: Open, Current, Movements, Close (Corte Z), List, Summary.
  3. `/api/v1/sales`: POS sale execution, Sales history.
  4. `/api/v1/orders`: Order placement, Admin order fulfillment workflow, Cancellation.
  5. `/api/v1/inventory`: Stock balance, Adjustments, Low stock alerts.
  6. `/api/v1/catalog`: Categories, Products (cached), Slug resolution.
  7. `/api/v1/transactions`: Unified multi-channel ledger, Order & Sale refunds.
  8. `/api/v1/audit`: Administrative audit log query with filtering.

