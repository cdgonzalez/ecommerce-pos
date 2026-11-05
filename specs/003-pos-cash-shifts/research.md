# Technical Research & Architectural Decisions: POS Cash Drawer Shifts & End-of-Day Z-Cut Reconciliation

**Feature**: `003-pos-cash-shifts`
**Date**: 2026-10-30
**Status**: Completed

---

## 1. Shift Data Model & Concurrency Protection

### Decision
Model cash register sessions using a dedicated `Shift` entity in Prisma linked to `User` (the cashier) and a `CashMovement` entity for non-sale cash drawer transactions.
- A cashier can only have ONE `Shift` with `status: "OPEN"` at any time.
- In `POST /api/v1/shifts/open`:
  1. Check `prisma.shift.findFirst({ where: { cashierId, status: 'OPEN' } })`.
  2. If found, return 409 Conflict (`Cashier already has an active open shift`).
  3. Create shift record with `status: 'OPEN'`, `initialCash`, and `openedAt: new Date()`.
- Audit event emitted: `SHIFT_OPENED`.

### Rationale
- Enforces strict one-operator-to-one-drawer accountability.
- Fully prevents overlapping or concurrent shift corruptions on the same physical register terminal.

### Alternatives Considered
- *Implicit session per calendar day without manual opening*: Discarded because physical retail stores change shifts mid-day (morning and evening cashiers), requiring distinct cash drawer counts for each cashier changeover.

---

## 2. Sale-to-Shift Atomic Binding & Zero-Orphan Sales Invariant

### Decision
Extend the existing `Sale` model in Prisma with an optional foreign key `shiftId: String?` referencing `Shift`.
- In `SalesService.processSale(cashierId, data)`:
  1. Retrieve active shift: `const activeShift = await tx.shift.findFirst({ where: { cashierId, status: 'OPEN' } })`.
  2. If `!activeShift`, reject with `AppError('No active open shift found for cashier. Open a shift before processing sales.', 400)`.
  3. Associate the sale: `tx.sale.create({ data: { ..., shiftId: activeShift.id } })`.
- This runs inside the existing interactive `prisma.$transaction`.

### Rationale
- Comports directly with Constitution Principle I (Dual-Channel Unified Commerce) and Principle II (ACID Atomic Consistency).
- Guarantees 100% of physical in-store transactions are tied to the exact cashier session in which money was received.

### Alternatives Considered
- *Calculating sales by cashier ID and date range without explicit shiftId*: Discarded because if a cashier opens two shifts in one day (morning shift, closes, returns for evening shift), date-based matching causes cross-shift contamination and ruins variance reconciliation.

---

## 3. Mid-Shift Cash Movements (Cash Drops & Inflows)

### Decision
Support `CASH_IN` (e.g. initial coin/bill change addition) and `CASH_OUT` (cash drops/sangrías to store vault for security):
- Endpoint: `POST /api/v1/shifts/:id/movements`.
- Requires authenticated cashier, active shift validation, positive amount (`amount > 0`), and descriptive reason text (`reason`).
- For `CASH_OUT`, verify that the withdrawal amount does not exceed currently calculated cash in drawer to alert or block overdrafts.
- Emits audit event: `CASH_MOVEMENT_CREATED`.

### Rationale
- Cash accumulation in drawers is an acute theft and loss vulnerability in physical stores. Partial cash drops (retiros de caja) to a drop safe during high-volume hours are standard retail industry practice.

---

## 4. End-of-Day Z-Cut (Corte Z) & Variance Computation

### Decision
Implement `POST /api/v1/shifts/:id/close`:
- Input: `{ countedCash: number, notes?: string }`.
- System aggregates all shift transactions within interactive transaction:
  - `initialCash`: from `Shift.initialCash`.
  - `cashSales`: sum of `Payment.amount` where `sale.shiftId === shift.id` and `method === 'CASH'`.
  - `cardSales`: sum of `Payment.amount` where `method IN ('CREDIT_CARD', 'DEBIT_CARD')`.
  - `transferSales`: sum of `Payment.amount` where `method IN ('TRANSFER', 'DIGITAL')`.
  - `cashIn`: sum of `CashMovement.amount` where `type === 'CASH_IN'`.
  - `cashOut`: sum of `CashMovement.amount` where `type === 'CASH_OUT'`.
- Formula:
  $$\text{expectedCash} = \text{initialCash} + \text{cashSales} + \text{cashIn} - \text{cashOut}$$
  $$\text{variance} = \text{countedCash} - \text{expectedCash}$$
- The shift is updated with `status: 'CLOSED'`, `closedAt: new Date()`, `expectedCash`, `countedCash`, `variance`, and `notes`.
- Emits audit event: `SHIFT_CLOSED_CORTE_Z`.

### Discrepancy Classification:
- Balanced: $\text{variance} = 0.00$
- Cash Shortage (Faltante): $\text{variance} < 0.00$
- Cash Surplus (Sobrante): $\text{variance} > 0.00$

### Rationale
- Provides transparent accounting reconciliation.
- Does not block shift closure on discrepancies, ensuring closing can always be completed even if a mistake or theft occurred, but flags and stores the discrepancy permanently for audit inspection.

---

## 5. UI Integration Strategy

### Decision
- **POS Layout & Terminal (`frontend/src/layouts/POSLayout.tsx`)**:
  - Check active shift on mount (`GET /api/v1/shifts/current`).
  - If no active shift, lock terminal and open `ShiftOpeningModal`.
  - If active shift exists, render top header indicator with active shift start time and two action buttons:
    - "Movimiento de Caja" (opens Cash Movement dialog).
    - "Cierre de Turno (Corte Z)" (opens Arqueo & closing dialog).
- **Admin Portal (`frontend/src/features/admin/ShiftsManagement.tsx`)**:
  - Add "Turnos de Caja" to sidebar navigation.
  - Table of historical shifts with cashier filter and date range.
  - Detail drawer/modal rendering the printable Corte Z ticket.

