# Quickstart Validation Guide: POS Cash Shifts & Corte Z

**Feature**: `003-pos-cash-shifts`
**Date**: 2026-10-30

---

## Prerequisites

1. PostgreSQL database running.
2. Prisma schema migrated with `Shift` and `CashMovement` models.
3. Authenticated cashier credentials with `PROCESS_SALES` permission.
4. Active terminal.

---

## Scenario 1: Automated Unit & Integration Tests

Run the dedicated test suites:

```bash
# Execute unit and integration tests
npm --prefix backend test -- --run tests/unit/shifts.service.spec.ts tests/integration/shifts.api.spec.ts
```

### Expected Outcome:
- All shift opening, cash movement, and Corte Z calculation tests pass cleanly.
- Atomic association between `Sale` and active `Shift` verified.
- Prevention of sales without an active shift verified.

---

## Scenario 2: End-to-End Shift Lifecycle via cURL

### Step 1: Open Shift with $50.00 Float
```bash
curl -X POST http://localhost:3000/api/v1/shifts/open \
  -H "Authorization: Bearer <CASHIER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"initialCash": 50.00}'
```
*Expected: 201 Created. Returns shift ID and `status: "OPEN"`.*

### Step 2: Query Active Shift
```bash
curl -X GET http://localhost:3000/api/v1/shifts/current \
  -H "Authorization: Bearer <CASHIER_TOKEN>"
```
*Expected: 200 OK. Returns shift ID, start timestamp, and `initialCash: 50.00`.*

### Step 3: Execute a Cash Sale ($30.00)
```bash
curl -X POST http://localhost:3000/api/v1/pos/sales \
  -H "Authorization: Bearer <CASHIER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "<VALID_PRODUCT_ID>", "quantity": 1}],
    "paymentMethod": "CASH"
  }'
```
*Expected: 200 OK. Sale is created with `shiftId` linked to the active shift.*

### Step 4: Record a Cash Drop ($20.00 to Safe)
```bash
curl -X POST http://localhost:3000/api/v1/shifts/<SHIFT_ID>/movements \
  -H "Authorization: Bearer <CASHIER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CASH_OUT",
    "amount": 20.00,
    "reason": "Mid-shift cash drop to safe"
  }'
```
*Expected: 201 Created. Cash movement recorded.*

### Step 5: Close Shift & Execute Corte Z ($60.00 Counted)
```bash
curl -X POST http://localhost:3000/api/v1/shifts/<SHIFT_ID>/close \
  -H "Authorization: Bearer <CASHIER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "countedCash": 60.00,
    "notes": "End of shift count balanced"
  }'
```
*Expected: 200 OK. System computes `expectedCash: 60.00` (50 + 30 - 20), `variance: 0.00`, sets `status: "CLOSED"`.*

### Step 6: Retrieve Corte Z Audit Ticket
```bash
curl -X GET http://localhost:3000/api/v1/shifts/<SHIFT_ID>/summary \
  -H "Authorization: Bearer <ADMIN_OR_CASHIER_TOKEN>"
```
*Expected: 200 OK. Returns full financial breakdown ready for printing.*

