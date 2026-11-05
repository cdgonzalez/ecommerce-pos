# Phase 0 Research: Professional Project README Documentation

**Feature**: `004-project-readme`
**Date**: 2026-11-05
**Status**: Completed

## 1. Objective & Scope

The objective is to produce an enterprise-grade, comprehensive, and professional `README.md` in English at the root of the `ecommerce-pos` repository. The documentation must serve as a unified technical showcase, a reliable onboarding guide for engineers, and an architectural reference for evaluators.

## 2. Research Dimensions & Best Practice Analysis

### 2.1 Documentation Taxonomy & Header Aesthetics
- **Badges**: Use Shields.io badges for tech stack (`TypeScript`, `Node.js`, `Express`, `PostgreSQL`, `Prisma`, `Redis`, `React`, `Vite`, `Tailwind CSS`, `Vitest`), license, and test pass rate.
- **Tone & Voice**: Authoritative, technically precise, active voice, clean Markdown formatting without marketing fluff.
- **Table of Contents**: Functional anchor links (`#table-of-contents`) allowing rapid jumping across sections.

### 2.2 System Architecture & Design Pattern Articulation
- **Dual-Channel Unified Commerce Paradigm**: Clearly explain how online B2C e-commerce orders and in-store POS register transactions share unified inventory, product catalog, customer identity, and tax calculations.
- **ACID & Concurrency Strategy**: Document the deterministic item sorting (`productId.localeCompare`) preventing deadlocks, along with atomic database conditional updates (`quantity >= requested`) eliminating overselling.
- **Session & Token Security Model**: Document short-lived JWT access tokens (15m) paired with rotating refresh tokens (7d), including automated token reuse detection that revokes all active cashier/user sessions upon compromise.
- **POS Cash Drawer Shift & Reconciliation (Corte Z)**: Explain the lifecycle from initial cash float declaration, mid-shift cash movements (`CASH_IN` / `CASH_OUT`), and physical cash count (arqueo) with automated expected vs. counted variance calculation.

### 2.3 Comprehensive Feature Breakdown
The feature matrix must cover:
1. **B2C Digital Storefront**: Product catalog browsing, category filtering, debounced search, detailed product pages, responsive shopping cart, multi-method checkout (`CREDIT_CARD`, `TRANSFER`, `DIGITAL`), order history, and personal profile.
2. **In-Store POS Terminal**: High-speed catalog search by SKU/name, real-time ticket construction, payment method selection, cash drawer lock overlay enforcing shift opening, mid-shift cash movement management, and end-of-day Corte Z closing with printable audit tickets.
3. **Back-Office Admin Dashboard**: Unified KPI metrics (gross revenue, order counts, customer counts, low stock alerts), order fulfillment status workflow (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED` -> `CANCELLED`) with printable packing slips, inventory stock movement adjustments, customer directory, user/role management, and audit trail viewer.

### 2.4 Quickstart & Developer Experience
- **Prerequisites**: Node.js v18+ or v20+, PostgreSQL 15+, Redis 7+, npm v9+.
- **Environment Variables**:
  - `backend/.env`: `PORT`, `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CORS_ORIGIN`.
  - `frontend/.env`: `VITE_API_URL`.
- **Database Lifecycle**: Step-by-step commands for `prisma migrate dev`, `prisma generate`, and optional seed scripts.
- **Verification Commands**: Commands for running backend tests (`npm test`), backend build (`npm run build`), frontend type check & bundle (`npm run build`).

## 3. Technology Stack Reference Table

| Layer | Technologies | Rationale / Key Roles |
|---|---|---|
| **Backend Runtime** | Node.js (v20+), Express 5 | High-performance asynchronous REST API backend |
| **Language** | TypeScript 5 (Strict Mode) | Full-stack end-to-end type safety |
| **Database & ORM** | PostgreSQL 15+, Prisma ORM 7 | Relational persistence, declarative migrations, ACID transactions |
| **Caching & Invalidation** | Redis 7, `redis` client | Multi-tier catalog caching and instant token invalidation |
| **Validation & Security** | Zod, JWT (`jsonwebtoken`), Bcrypt | Runtime contract boundary validation, RBAC, session rotation |
| **Frontend Framework** | React 19, Vite 8 | Fast SPA rendering, hot module replacement, optimized bundling |
| **State Management** | Zustand | Decoupled lightweight stores for Cart, POS, and Auth |
| **Styling & UI** | Tailwind CSS, Lucide React | Modern responsive design, responsive tables, modal overlays |
| **HTTP Client** | Axios (custom instance) | Token interceptors, automatic bearer injection, error handling |
| **Testing Suite** | Vitest 3, Supertest 7 | Lightning-fast unit tests and HTTP API integration tests |

## 4. Key Takeaways & Recommendations

1. Provide an executive ASCII or Mermaid flowchart showing how the React web client and POS terminal interact with the Express API gateway, Redis cache, and PostgreSQL database.
2. Detail realistic seed credentials or setup instructions so reviewers can immediately log in as an administrator (`admin@example.com`) or cashier.
3. Maintain zero broken links, validating that every referenced file path exists in the repository.

