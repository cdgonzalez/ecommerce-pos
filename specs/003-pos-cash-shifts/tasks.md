# Tasks: POS Cash Drawer Shifts & End-of-Day Z-Cut Reconciliation

**Input**: Design documents from `specs/003-pos-cash-shifts/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/shifts-contracts.yaml`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3], [US4])
- Include exact file paths in descriptions

---

## Phase 1: Setup & Contracts

**Purpose**: Schema definitions, Zod validation schemas, and API contracts

- [X] T001 [P] Add `Shift` and `CashMovement` models and link `shiftId` relation in `Sale` model in `backend/prisma/schema.prisma`
- [X] T002 [P] Create Zod schemas `openShiftSchema` (`z.object({ initialCash: z.number().min(0, "Initial cash must be non-negative") })`), `cashMovementSchema`, and `closeShiftSchema` in `backend/src/modules/shifts/shifts.schema.ts`
- [X] T003 [P] Verify OpenAPI 3.0 contract specification in `specs/003-pos-cash-shifts/contracts/shifts-contracts.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database type generation, shared audit actions, and frontend POS store extension

**⚠️ CRITICAL**: Must complete before user story implementation begins

- [X] T004 Run `npx prisma generate` to generate Prisma Client types for `Shift` and `CashMovement` in `backend/`
- [X] T005 [P] Add audit event constants `SHIFT_OPENED`, `CASH_MOVEMENT_CREATED`, `SHIFT_CLOSED_CORTE_Z` in `backend/src/modules/audit/audit.service.ts`
- [X] T006 [P] Extend `POSState` with `activeShift: Shift | null`, `shiftLoading: boolean`, `setActiveShift`, and `clearShift` in `frontend/src/store/pos.store.ts`

**Checkpoint**: Foundation ready - User story implementation can begin

---

## Phase 3: User Story 1 - Shift Opening & Initial Cash Float (Priority: P1) 🎯 MVP

**Goal**: Cashiers can declare starting cash float and open a register session; POS terminal verifies active shift status on load and unlocks for sales.

**Independent Test**: Login as cashier with no open shift; POS terminal presents opening modal; declaring float transitions shift to `OPEN` and unlocks terminal.

### Tests for User Story 1
- [X] T007 [P] [US1] Unit tests for `ShiftsService.openShift` (preventing duplicate open shifts) and `getCurrentShift` in `backend/tests/unit/shifts.service.spec.ts`
- [X] T008 [P] [US1] Integration tests for `POST /api/v1/shifts/open` and `GET /api/v1/shifts/current` in `backend/tests/integration/shifts.api.spec.ts`

### Implementation for User Story 1
- [X] T009 [US1] Implement `ShiftsService.openShift` (validating no existing OPEN shift, saving `initialCash >= 0`) and `ShiftsService.getCurrentShift` in `backend/src/modules/shifts/shifts.service.ts`
- [X] T010 [US1] Implement `openShift` and `getCurrentShift` handlers in `backend/src/modules/shifts/shifts.controller.ts`
- [X] T011 [US1] Register `POST /open` and `GET /current` routes with `protect` and `requirePermission('PROCESS_SALES')` in `backend/src/modules/shifts/shifts.routes.ts`
- [X] T012 [US1] Register `/api/v1/shifts` router in `backend/src/app.ts`
- [X] T013 [US1] Create `ShiftOpeningModal` component in `frontend/src/features/pos/ShiftOpeningModal.tsx`
- [X] T014 [US1] Connect `POSLayout` and `POSPage` to fetch `GET /api/v1/shifts/current` on mount and display `ShiftOpeningModal` lock overlay if no shift is open in `frontend/src/layouts/POSLayout.tsx` and `frontend/src/features/pos/POSPage.tsx`

**Checkpoint**: User Story 1 functional and independently testable as an MVP increment.

---

## Phase 4: User Story 2 - POS Sales Binding & Mid-Shift Cash Movements (Priority: P2)

**Goal**: Bind every POS sale to the cashier's active shift ID; enable recording cash drops (sangrías a bóveda) and cash inflows with real-time balance tracking.

**Independent Test**: Execute a cash sale during an active shift and confirm `sale.shiftId` is recorded; record a cash drop and verify expected cash updates.

### Tests for User Story 2
- [X] T015 [P] [US2] Unit test for `SalesService.processSale` rejecting checkout if no shift is open and linking `shiftId` when open in `backend/tests/unit/sales.service.spec.ts`
- [X] T016 [P] [US2] Unit test for `ShiftsService.addCashMovement` recording `CASH_IN` and `CASH_OUT` in `backend/tests/unit/shifts.service.spec.ts`
- [X] T017 [P] [US2] Integration test for `POST /api/v1/shifts/:id/movements` and `POST /api/v1/pos/sales` shift binding in `backend/tests/integration/shifts.api.spec.ts`

### Implementation for User Story 2
- [X] T018 [US2] Update `SalesService.processSale` to verify active shift in database, throw 400 if missing, and store `shiftId` in `backend/src/modules/sales/sales.service.ts`
- [X] T019 [US2] Implement `ShiftsService.addCashMovement` validating active shift, positive amount, and saving `CashMovement` with audit log in `backend/src/modules/shifts/shifts.service.ts`
- [X] T020 [US2] Add `addCashMovement` controller handler and register `POST /:id/movements` route in `backend/src/modules/shifts/shifts.controller.ts` and `backend/src/modules/shifts/shifts.routes.ts`
- [X] T021 [US2] Create `CashMovementModal` component for cash drops and inflows in `frontend/src/features/pos/CashMovementModal.tsx`
- [X] T022 [US2] Add "Movimiento de Caja" action button to POS header in `frontend/src/layouts/POSLayout.tsx`

**Checkpoint**: User Stories 1 and 2 functional with atomic sales binding and cash drawer drops.

---

## Phase 5: User Story 3 - Shift Closing & Cash Reconciliation (Corte Z / Arqueo) (Priority: P3)

**Goal**: Complete end-of-shift cash count (arqueo), calculate expected cash and variance, transition status to `CLOSED`, and lock the terminal.

**Independent Test**: Close shift with counted cash; verify `expectedCash = initialCash + cashSales + cashIn - cashOut`, verify `variance = countedCash - expectedCash`, confirm shift is CLOSED and terminal locks.

### Tests for User Story 3
- [X] T023 [P] [US3] Unit test for `ShiftsService.closeShift` computing expected cash, variance, and emitting `SHIFT_CLOSED_CORTE_Z` in `backend/tests/unit/shifts.service.spec.ts`
- [X] T024 [P] [US3] Integration test for `POST /api/v1/shifts/:id/close` in `backend/tests/integration/shifts.api.spec.ts`

### Implementation for User Story 3
- [X] T025 [US3] Implement `ShiftsService.closeShift` aggregating cash payments, movements, computing `expectedCash`, `variance`, updating shift to `CLOSED` in `backend/src/modules/shifts/shifts.service.ts`
- [X] T026 [US3] Add `closeShift` controller handler and register `POST /:id/close` route in `backend/src/modules/shifts/shifts.controller.ts` and `backend/src/modules/shifts/shifts.routes.ts`
- [X] T027 [US3] Create `ShiftClosingModal` component prompting for physical cash count (arqueo) and notes in `frontend/src/features/pos/ShiftClosingModal.tsx`
- [X] T028 [US3] Add "Cierre de Turno (Corte Z)" button to POS header in `frontend/src/layouts/POSLayout.tsx` and clear active shift upon closure

**Checkpoint**: User Stories 1, 2, and 3 functional with complete end-of-day Corte Z reconciliation.

---

## Phase 6: User Story 4 - Shift History, Supervisor Inspection & Printable Corte Z Report (Priority: P4)

**Goal**: Store managers and supervisors can audit historical shifts, review cash discrepancies, and print or export detailed Corte Z tickets.

**Independent Test**: Navigate to Shift Management in admin panel; filter closed shifts; open Corte Z ticket modal; verify financial breakdown and print view.

### Tests for User Story 4
- [X] T029 [P] [US4] Unit test for `ShiftsService.getShifts` and `ShiftsService.getShiftSummary` in `backend/tests/unit/shifts.service.spec.ts`
- [X] T030 [P] [US4] Integration test for `GET /api/v1/shifts` and `GET /api/v1/shifts/:id/summary` in `backend/tests/integration/shifts.api.spec.ts`

### Implementation for User Story 4
- [X] T031 [US4] Implement `ShiftsService.getShifts` (paginated list with cashier/status filters) and `ShiftsService.getShiftSummary` (full financial breakdown) in `backend/src/modules/shifts/shifts.service.ts`
- [X] T032 [US4] Add `getShifts` and `getShiftSummary` controller handlers and register `GET /` and `GET /:id/summary` in `backend/src/modules/shifts/shifts.controller.ts` and `backend/src/modules/shifts/shifts.routes.ts`
- [X] T033 [US4] Create `CorteZTicketModal` component with clean printable receipt layout in `frontend/src/features/admin/CorteZTicketModal.tsx`
- [X] T034 [US4] Create `ShiftsManagement` administrative view with filters and status badges in `frontend/src/features/admin/ShiftsManagement.tsx`
- [X] T035 [US4] Add "Turnos de Caja" route and navigation item in `frontend/src/routes/AppRouter.tsx` and `frontend/src/layouts/AdminLayout.tsx`

**Checkpoint**: All 4 user stories fully implemented, audited, and integrated.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quickstart verification, regression testing, and build integrity

- [X] T036 [P] Execute quickstart validation scenarios defined in `specs/003-pos-cash-shifts/quickstart.md`
- [X] T037 [P] Run full backend test suite (`npm --prefix backend test`) and verify 100% test pass rate
- [X] T038 [P] Run frontend build and type check (`npm --prefix frontend run build`) to ensure zero TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: No dependencies — can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **Phase 3 (User Story 1 - P1)**: Depends on Phase 2 — Core MVP.
- **Phase 4 (User Story 2 - P2)**: Depends on Phase 3 (needs open shift to bind sales and movements).
- **Phase 5 (User Story 3 - P3)**: Depends on Phase 3 and Phase 4 (aggregates sales and movements).
- **Phase 6 (User Story 4 - P4)**: Depends on Phase 5 (renders completed Corte Z records).
- **Phase 7 (Polish)**: Depends on all user stories being complete.

---

## Parallel Execution Opportunities

- **Phase 1**: T001, T002, and T003 can execute in parallel.
- **Phase 2**: T005 and T006 can execute in parallel after T004.
- **Phase 3**: Tests T007 and T008 can execute in parallel before implementation. T013 can run in parallel with backend tasks.
- **Phase 4**: Tests T015, T016, and T017 can execute in parallel. T021 can run in parallel with backend tasks.
- **Phase 5**: Tests T023 and T024 can execute in parallel. T027 can run in parallel with backend tasks.
- **Phase 6**: Tests T029 and T030 can execute in parallel. T033 can run in parallel with backend tasks.
- **Phase 7**: T036, T037, and T038 can execute in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`schema.prisma`, `shifts.schema.ts`, `contracts/`).
2. Complete Phase 2: Foundational (`prisma generate`, `audit.service.ts`, `pos.store.ts`).
3. Complete Phase 3: User Story 1 (Tests T007-T008, Backend `openShift` T009-T012, Frontend `ShiftOpeningModal` T013-T014).
4. **Validate MVP**: Test shift opening and terminal unlock.

### Incremental Operational Delivery
1. Add User Story 2 (Sale-to-shift binding and cash drops/injections).
2. Add User Story 3 (Corte Z closing and variance calculation).
3. Add User Story 4 (Admin historical shift auditing and printable ticket).
4. Execute Phase 7 Polish (full test suite + frontend build).
