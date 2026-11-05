# Implementation Plan: POS Cash Drawer Shifts & End-of-Day Z-Cut Reconciliation

**Branch**: `003-pos-cash-shifts` | **Date**: 2026-10-30 | **Spec**: [specs/003-pos-cash-shifts/spec.md](spec.md)

**Input**: Feature specification from `specs/003-pos-cash-shifts/spec.md`

## Summary

Implement operational cash drawer session management (`Shift` and `CashMovement`) and end-of-day reconciliation (Corte Z) for physical POS terminals. The backend will enforce that every physical sale is linked to an active shift, calculate expected cash in drawer based on cash float, cash sales, inflows, and cash drops, compute variances on closing, and generate complete Corte Z tickets with audit logging. The frontend POS interface will lock sales when no shift is open, prompt for initial float, display active shift controls in the header (cash drops and close shift dialog), and provide a dedicated Shift Management view in the Admin portal for historical audit review and ticket printing.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22 LTS  
**Primary Dependencies**: 
- Backend: Express 5.x, `@prisma/client` 7.x, `zod`, `winston`
- Frontend: React 18, Vite, Zustand, Lucide React, Axios  
**Storage**: PostgreSQL (Prisma models `Shift`, `CashMovement`, extended `Sale`)  
**Testing**: Vitest 3.x, Supertest 7.x  
**Target Platform**: Node.js backend server, web browsers (POS touch terminals & Admin portal)  
**Project Type**: Monorepo Web Application (`backend/` API + `frontend/` SPA)  
**Performance Goals**: Shift balance calculation in under 100ms; zero noticeable lag in POS checkout.  
**Constraints**: Atomic transaction consistency on sales and closing; zero orphan sales; regression-free test suite.  
**Scale/Scope**: Operates across physical in-store POS registers and cashier shifts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Evaluation | Status |
|---|---|---|
| **I. Dual-Channel Unified Commerce** | While shifts apply strictly to physical POS cash registers, the sales entity remains unified, maintaining catalog and inventory parity. | PASS |
| **II. ACID Atomic Consistency** | Shift opening, sale association, cash movements, and Corte Z calculations execute inside atomic Prisma transactions. | PASS |
| **III. Immutable Snapshots & Universal Auditability** | Corte Z captures immutable closing totals and variances; all shift lifecycle actions emit structured events to `AuditService`. | PASS |
| **IV. Contract-Driven Validation & Granular RBAC** | Request payloads strictly validated via Zod schemas (`openShiftSchema`, `cashMovementSchema`, `closeShiftSchema`); routes protected by `protect` and `requirePermission`. | PASS |
| **V. Multi-Tier Redis Caching** | Shift operations interact with canonical DB state without caching stale transactional balances. | PASS |
| **Section: POS Shift & Cash Register Management** | Directly fulfills the explicit governance mandate in Constitution Section "System Boundaries & Identified Architectural Gaps", Item 3. | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/003-pos-cash-shifts/
├── spec.md              # Feature requirements and user stories
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architectural findings and decisions
├── data-model.md        # Phase 1 data entities and formulas
├── quickstart.md        # Phase 1 runnable validation guide
├── contracts/           # Phase 1 API specifications
│   └── shifts-contracts.yaml
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Layout

```text
backend/
├── prisma/
│   └── schema.prisma         # Add Shift and CashMovement models, update Sale and User
├── src/
│   ├── modules/
│   │   ├── shifts/
│   │   │   ├── shifts.schema.ts      # Zod validation schemas
│   │   │   ├── shifts.service.ts     # Core shift business logic & Corte Z
│   │   │   ├── shifts.controller.ts  # Express controllers
│   │   │   └── shifts.routes.ts      # REST routes
│   │   └── sales/
│   │       └── sales.service.ts      # Bind sale to active shift & reject if no shift
│   └── app.ts                        # Register /api/v1/shifts routes
└── tests/
    ├── unit/
    │   └── shifts.service.spec.ts    # Unit tests for shift calculations and validations
    └── integration/
        └── shifts.api.spec.ts        # Supertest tests for shift lifecycle endpoints

frontend/
├── src/
│   ├── features/
│   │   ├── pos/
│   │   │   ├── ShiftOpeningModal.tsx # Modal to declare initial float and open shift
│   │   │   ├── CashMovementModal.tsx # Modal to record cash drop or injection
│   │   │   ├── ShiftClosingModal.tsx # Modal to perform cash count (Arqueo) and close
│   │   │   └── POSPage.tsx           # Check active shift, display lock overlay if closed
│   │   └── admin/
│   │       ├── ShiftsManagement.tsx  # Historical shifts table and filters
│   │       └── CorteZTicketModal.tsx # Printable ticket view for Corte Z
│   ├── layouts/
│   │   ├── POSLayout.tsx             # Header badge and shift action buttons
│   │   └── AdminLayout.tsx           # Add "Turnos de Caja" to navigation
│   └── store/
│       └── pos.store.ts              # Track activeShift in state
```

**Structure Decision**: Web application layout matching Option 2 (`backend/` + `frontend/`).

## Complexity Tracking

*No violations detected.*
