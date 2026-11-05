# Feature Specification: POS Cash Drawer Shifts & End-of-Day Z-Cut Reconciliation (Control de Turnos de Caja y Corte Z)

**Feature Branch**: `003-pos-cash-shifts`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Control de turnos de caja y corte Z para punto de venta"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shift Opening & Initial Cash Float (Priority: P1) 🎯 MVP

As a store cashier arriving for my work shift, I want to open a new register session by declaring the starting physical cash amount in the drawer (fondo de caja inicial), so that the terminal unlocks and my financial operations for the day are tracked under my name.

**Why this priority**: Fundamental operational prerequisite. Without open register sessions, physical POS sales cannot be safely attributed to individual operators, nor can cash balances be audited.

**Independent Test**: Can be verified by logging in as a cashier on a locked register, declaring a starting cash float (e.g., $50.00), and confirming the shift status transitions to OPEN and the POS sales screen unlocks.

**Acceptance Scenarios**:

1. **Given** a cashier logged into the POS system with no active shift, **When** they navigate to the POS sales interface, **Then** the system displays a modal requiring them to declare the initial cash float before allowing any sale.
2. **Given** a cashier entering a valid cash float amount (zero or positive number), **When** they confirm the shift opening, **Then** the system records an open shift linked to their user account with the current timestamp and initial float, and unlocks the register for sales.
3. **Given** a cashier who already has an open shift on the register, **When** they reload or access the POS interface, **Then** the system detects the active shift and immediately loads the sales interface without asking to re-open the shift.

---

### User Story 2 - POS Sales Binding & Mid-Shift Cash Movements (Priority: P2)

As a cashier or shift supervisor, I want all POS sales to link automatically to my active shift and be able to record non-sale cash movements (cash drops to the safe or change injections), so that the expected cash balance is continually updated in real-time.

**Why this priority**: Essential for mid-shift operations and cash security. Overcrowded cash drawers pose a robbery risk, requiring partial deposits (retiros de efectivo / cash drops) throughout the day while maintaining exact balance tracking.

**Independent Test**: Can be tested by opening a shift with $100.00, executing a $25.00 cash sale, executing a $40.00 card sale, and recording a $50.00 cash drop to the safe; the system reflects expected cash in drawer as exactly $100.00 + $25.00 - $50.00 = $75.00.

**Acceptance Scenarios**:

1. **Given** an active open shift, **When** a cashier completes a POS sale, **Then** the sale and its payments are automatically linked to the active shift ID and reflected in the shift's payment breakdown (Cash, Card, Transfer).
2. **Given** an attempt to complete a POS sale on a terminal without an active open shift, **When** the cashier confirms checkout, **Then** the system rejects the transaction with an informative message requiring an open shift.
3. **Given** an open shift, **When** a cashier records a Cash Drop (`CASH_OUT`) or Cash Injection (`CASH_IN`) with an amount and justification reason, **Then** the movement is registered, logged in audit, and updates the expected cash balance.

---

### User Story 3 - Shift Closing & Cash Reconciliation (Corte Z / Arqueo) (Priority: P3)

As a cashier finishing my work shift, I want to perform the cash count (arqueo de caja) and close my shift, so that the system computes any cash variance (surplus or shortage), locks the register, and certifies the final reconciliation (Corte Z).

**Why this priority**: Core loss prevention and accounting compliance. The Z-cut seals the daily financial activity of the physical register, identifies discrepancies between physical money and system sales, and holds staff accountable.

**Independent Test**: Can be tested by initiating shift closure, inputting the counted physical cash, verifying the system accurately calculates the variance against system expected totals, marks the shift as CLOSED, and locks the POS terminal.

**Acceptance Scenarios**:

1. **Given** an open shift, **When** the cashier triggers "Close Shift / Corte Z", **Then** the system prompts the cashier to enter the total physical cash counted in the drawer.
2. **Given** the cashier inputs the counted cash, **When** they confirm closing with optional notes, **Then** the system calculates `expectedCash = initialCash + cashSales + cashIn - cashOut - cashRefunds`, calculates `variance = countedCash - expectedCash`, transitions the shift to CLOSED, and locks the register terminal.
3. **Given** a closed shift, **When** any user attempts to process a new sale or cash movement under that shift ID, **Then** the system strictly refuses the action.

---

### User Story 4 - Shift History, Supervisor Inspection & Printable Corte Z Report (Priority: P4)

As a store manager or administrator, I want to review past shift records, inspect discrepancies, and print or export the official Corte Z summary ticket, so that store accounting can be audited and reconciled with bank deposits.

**Why this priority**: Required for store management oversight, shift changeover handoffs, and accounting audits.

**Independent Test**: Can be tested by navigating to the Shift Management tab in the Admin panel, filtering closed shifts by date or cashier, and viewing the detailed financial summary ticket.

**Acceptance Scenarios**:

1. **Given** an administrator or cashier supervisor, **When** they view the Shift Management view, **Then** they see a filterable list of all shifts showing cashier name, start/end timestamps, initial float, total sales by method, and cash variance.
2. **Given** a specific closed shift selected, **When** the user clicks "View Corte Z Ticket", **Then** a clean, printable modal summary is rendered showing line-by-line financial breakdown (Starting Float, Cash Sales, Card Sales, Inflows, Outflows, Counted Cash, Discrepancy).

---

### Edge Cases

- **Attempting POS Checkout Without an Open Shift**: The frontend and backend must reject any physical sale attempt if no active shift exists for the terminal/cashier, prompting the user with an "Open Shift Required" modal.
- **Accidental Page Reload During an Open Shift**: Browser refreshes must not lose shift state. The POS sales layout must query the active shift upon initialization and restore the active state smoothly.
- **Discrepancy (Faltante / Sobrante)**: Large cash variances must not block shift closure; instead, they must be prominently highlighted with mandatory justification notes and logged as potential audit anomalies.
- **Zero Cash Drawer Drop**: If a cashier attempts to withdraw more cash than the currently recorded expected cash in the drawer, the system should display a confirmation warning.
- **Cashier Session Expired While Shift Is Open**: If the user's JWT expires while a shift is open, the silent refresh mechanism maintains continuity; upon re-login, the cashier's open shift remains intact in the database.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide endpoints to open a shift (`POST /api/v1/shifts/open`) requiring an initial cash float (`initialCash >= 0`).
- **FR-002**: System MUST enforce that a user/register can only have ONE active (`status: OPEN`) shift at any given time.
- **FR-003**: System MUST provide an endpoint to retrieve the currently active shift for the calling cashier (`GET /api/v1/shifts/current`).
- **FR-004**: System MUST link all POS sales to the active shift ID and record the payment breakdown by payment method (`CASH`, `CARD`, `TRANSFER`).
- **FR-005**: System MUST reject physical POS sale completion (`POST /api/v1/pos/sales`) if there is no active open shift for the operator.
- **FR-006**: System MUST provide an endpoint (`POST /api/v1/shifts/:id/movements`) to record non-sale cash movements (`CASH_IN`, `CASH_OUT`) with amount, category/reason, and cashier identity.
- **FR-007**: System MUST provide an endpoint to perform shift closing / Corte Z (`POST /api/v1/shifts/:id/close`) accepting `countedCash` (physical cash counted) and optional closing notes.
- **FR-008**: System MUST deterministically calculate:
  - `expectedCash = initialCash + totalCashSales + totalCashIn - totalCashOut - totalCashRefunds`
  - `variance = countedCash - expectedCash`
- **FR-009**: System MUST transition shift status from `OPEN` to `CLOSED`, recording the closure timestamp and locking subsequent operations under that shift.
- **FR-010**: System MUST provide an endpoint for administrators to list historical shifts (`GET /api/v1/shifts`) with pagination, cashier filter, and date range filters.
- **FR-011**: System MUST provide an endpoint to retrieve the complete Corte Z financial report (`GET /api/v1/shifts/:id/summary`) detailing gross sales, tax, discounts, net sales by payment method, movements, and variance.
- **FR-012**: All shift lifecycle events (`SHIFT_OPENED`, `CASH_MOVEMENT`, `SHIFT_CLOSED_CORTE_Z`) MUST emit structured audit log entries through `AuditService`.
- **FR-013**: Frontend POS layout MUST inspect shift status on mount, displaying an opening modal if closed, and displaying an active shift badge with a "Corte Z" action button in the POS header.
- **FR-014**: Frontend Admin portal MUST include a dedicated Shift Management view to inspect historical Corte Z records and print audit tickets.

### Key Entities

- **Shift**: Core cash register work session.
  - Attributes: `id`, `cashierId`, `openedAt`, `closedAt`, `status` (`OPEN` | `CLOSED`), `initialCash`, `expectedCash`, `countedCash`, `variance`, `notes`.
  - Relationships: Belongs to `User` (cashier); Has many `Sale` records, Has many `CashMovement` records.
- **CashMovement**: Non-sale cash additions or withdrawals during a shift.
  - Attributes: `id`, `shiftId`, `userId`, `type` (`CASH_IN` | `CASH_OUT`), `amount`, `reason`, `createdAt`.
- **Sale**: Physical sale record (existing).
  - Extended Relationship: Linked to `shiftId`.
- **AuditLog**: Universal audit tracking (existing).
  - Actions: `SHIFT_OPENED`, `CASH_MOVEMENT_CREATED`, `SHIFT_CLOSED_CORTE_Z`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cashiers can complete the shift opening process in under 20 seconds from login.
- **SC-002**: 100% of POS sales conducted during an active shift are attributed to that shift with zero orphan sales.
- **SC-003**: 100% of attempts to execute physical POS sales without an open shift are rejected by the backend.
- **SC-004**: End-of-day Corte Z variance calculations are 100% mathematically accurate to the exact cent across cash sales, adjustments, and starting float.
- **SC-005**: 100% of shift openings, closing counts, and mid-shift cash drops generate immutable audit log records.

## Assumptions

- The physical POS terminal has a single cash drawer operated by the signed-in cashier during their shift.
- Card and bank transfer transactions are recorded by the system for payment reconciliation but do not affect physical cash in drawer totals.
- A cashier can close their shift with a cash discrepancy (shortage or surplus); the system does not block closing but requires the discrepancy to be calculated and permanently stored for manager review.
- Multi-currency cash registers are out of scope for v1 (single currency aligned with store catalog).

