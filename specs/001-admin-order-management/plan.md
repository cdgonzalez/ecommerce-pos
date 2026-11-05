# Implementation Plan: Admin Order Management & Fulfillment

**Branch**: `001-admin-order-management` | **Date**: 2026-10-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-admin-order-management/spec.md`

## Summary

Implement an end-to-end administrative order management and fulfillment module. This includes backend endpoints for paginated order listing, status lifecycle progression (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`), tracking information capture, and atomic order cancellation with automated inventory restitution. In the frontend, implement the administrative orders dashboard (`OrdersList.tsx`), detail inspection drawer, and printable packing slip view, integrating them into the admin layout and router.

## Technical Context

**Language/Version**: TypeScript 7.0.2 / Node.js 22 LTS  
**Primary Dependencies**: Express 5.2.1, Prisma 7.10.0, Zod 4.6.2, React 19.2.8, React Router v7, Zustand 5, Tailwind CSS v4, Lucide React  
**Storage**: PostgreSQL (via `@prisma/adapter-pg` with `pg.Pool`), Redis 6.2 (catalog cache invalidation)  
**Testing**: Vitest 3.0, Supertest 7.0  
**Target Platform**: Linux / Windows Server (Node.js runtime) and modern web browsers (React SPA)  
**Project Type**: Monorepo Web Application (`backend/` + `frontend/`)  
**Performance Goals**: Order list query response < 150ms with 50k+ records; status transitions < 100ms; packing slip render instant  
**Constraints**: Zero-overselling guarantee; strict atomic consistency on cancellation; deterministic ordering against deadlocks; full RBAC and audit logging  
**Scale/Scope**: Admin-facing operational dashboard + logistics fulfillment tracking  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Analysis | Status |
| :--- | :--- | :--- |
| **I. Dual-Channel Unified Commerce** | Uses the shared `Order`, `OrderItem`, and `Inventory` entities, maintaining a single source of truth for stock and transactions across POS and web channels. | **PASS** |
| **II. ACID Atomic Consistency** | Order cancellation restores inventory and records `StockMovement` inside an isolated `prisma.$transaction` with deterministic product sorting. | **PASS** |
| **III. Immutable Snapshots & Auditability** | Order detail views render immutable unit price and product snapshots from purchase time; every status transition and cancellation writes to `AuditLog`. | **PASS** |
| **IV. Contract-Driven Validation & RBAC** | All new endpoints (`GET /orders`, `PATCH /orders/:id/status`, `POST /orders/:id/cancel`) validate inputs via Zod and require `protect` + `requirePermission('PROCESS_SALES')`. | **PASS** |
| **V. Multi-Tier Redis Caching** | Stock restitution in order cancellations triggers post-commit Redis cache invalidation for catalog product keys. | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-order-management/
├── plan.md              # This file (Implementation Plan)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Prisma schema extensions & state machine
├── quickstart.md        # End-to-end runnable validation scenarios
├── contracts/
│   └── orders.contract.yaml  # OpenAPI 3.0 endpoint specifications
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   └── schema.prisma                           # Add carrier, trackingNumber, cancellationReason to Order
├── src/
│   └── modules/
│       ├── orders/
│       │   ├── orders.controller.ts            # getOrders, getOrderById, updateOrderStatus, cancelOrder
│       │   ├── orders.routes.ts                # Mount admin endpoints with RBAC & Zod middleware
│       │   ├── orders.schema.ts                # Zod schemas: updateOrderStatus, cancelOrder, orderQuery
│       │   └── orders.service.ts               # State machine, pagination, atomic cancellation & restitution
│       └── audit/
│           └── audit.service.ts                # Log status transitions & cancellations
└── tests/
    ├── unit/
    │   └── orders.service.spec.ts              # Unit tests for state machine & restitution logic
    └── integration/
        └── orders.api.spec.ts                  # Supertest API tests for /api/v1/orders endpoints

frontend/
├── src/
│   ├── features/
│   │   └── admin/
│   │       ├── OrdersList.tsx                  # Main order management table with status filters & search
│   │       ├── OrderDetailModal.tsx            # Detail modal with items, transitions, & cancel action
│   │       └── PackingSlipModal.tsx            # Print-optimized warehouse packing slip
│   ├── layouts/
│   │   └── AdminLayout.tsx                     # Add 'Orders' item with ShoppingBag icon to sidebar
│   └── routes/
│       └── AppRouter.tsx                       # Register /admin/orders protected route
```

**Structure Decision**: Monorepo Web Application structure (`backend/` and `frontend/`). All backend changes reside in `backend/src/modules/orders/` adhering to the existing modular pattern; frontend changes extend `frontend/src/features/admin/`.

## Complexity Tracking

> **No Constitution violations detected.** All architectural decisions follow existing project conventions and non-negotiables.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | N/A | N/A |
