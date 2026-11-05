# Data Model & Schema Specification: POS Cash Drawer Shifts & End-of-Day Z-Cut Reconciliation

**Feature**: `003-pos-cash-shifts`
**Date**: 2026-10-30

---

## 1. Schema Extensions (Prisma / PostgreSQL)

### Shift
Represents a physical cash register session operated by a cashier.

```prisma
model Shift {
  id           String         @id @default(uuid())
  cashierId    String
  cashier      User           @relation(fields: [cashierId], references: [id])
  status       String         @default("OPEN") // "OPEN" | "CLOSED"
  initialCash  Decimal        @db.Decimal(10, 2)
  expectedCash Decimal?       @db.Decimal(10, 2)
  countedCash  Decimal?       @db.Decimal(10, 2)
  variance     Decimal?       @db.Decimal(10, 2)
  notes        String?
  openedAt     DateTime       @default(now())
  closedAt     DateTime?
  sales        Sale[]
  movements    CashMovement[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@index([cashierId, status])
  @@map("shifts")
}
```

### CashMovement
Captures cash inflows and outflows during a shift.

```prisma
model CashMovement {
  id        String   @id @default(uuid())
  shiftId   String
  shift     Shift    @relation(fields: [shiftId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // "CASH_IN" | "CASH_OUT"
  amount    Decimal  @db.Decimal(10, 2)
  reason    String
  createdAt DateTime @default(now())

  @@index([shiftId])
  @@map("cash_movements")
}
```

### Sale (Modification)
Extended with foreign key referencing the active shift:

```prisma
model Sale {
  // Existing fields ...
  shiftId    String?
  shift      Shift?     @relation(fields: [shiftId], references: [id])
  // ...
}
```

### User (Modification)
Extended with reverse relations:

```prisma
model User {
  // Existing fields ...
  shifts       Shift[]
  cashMovements CashMovement[]
}
```

---

## 2. Shift Lifecycle State Machine

```
      [ No Active Shift ]
               │
               │ POST /api/v1/shifts/open (initialCash >= 0)
               ▼
         [ OPEN Shift ] ◄──────────────────────────────────┐
               │                                           │
               ├─── POS Sale (tx.sale.create) ─────────────┤ (Links saleId & shiftId)
               │                                           │
               ├─── Cash Drop (CASH_OUT) ──────────────────┤ (Deducts from expectedCash)
               │                                           │
               └─── Cash Inflow (CASH_IN) ─────────────────┘ (Adds to expectedCash)
               │
               │ POST /api/v1/shifts/:id/close (countedCash, notes)
               ▼
       [ Computing Corte Z ]
               │
               │ Computes expectedCash & variance
               ▼
        [ CLOSED Shift ]
               │
               └─── Generates Corte Z Ticket & Audit Log
```

---

## 3. Financial Calculation Formulas

1. **Cash Sales Total**:
   $$\text{cashSales} = \sum \text{Payment.amount} \quad \text{where} \quad \text{Payment.method} = \text{'CASH'} \land \text{Sale.shiftId} = \text{shift.id}$$

2. **Electronic Sales Totals**:
   $$\text{cardSales} = \sum \text{Payment.amount} \quad \text{where} \quad \text{Payment.method} \in [\text{'CREDIT\_CARD'}, \text{'DEBIT\_CARD'}]$$
   $$\text{transferSales} = \sum \text{Payment.amount} \quad \text{where} \quad \text{Payment.method} \in [\text{'TRANSFER'}, \text{'DIGITAL'}]$$

3. **Cash Movements**:
   $$\text{cashInTotal} = \sum \text{CashMovement.amount} \quad \text{where} \quad \text{type} = \text{'CASH\_IN'}$$
   $$\text{cashOutTotal} = \sum \text{CashMovement.amount} \quad \text{where} \quad \text{type} = \text{'CASH\_OUT'}$$

4. **Expected Drawer Cash at Closing**:
   $$\text{expectedCash} = \text{initialCash} + \text{cashSales} + \text{cashInTotal} - \text{cashOutTotal}$$

5. **Variance (Descuadre / Arqueo)**:
   $$\text{variance} = \text{countedCash} - \text{expectedCash}$$
   - If $\text{variance} = 0$: Balanced.
   - If $\text{variance} < 0$: Cash shortage (Faltante).
   - If $\text{variance} > 0$: Cash surplus (Sobrante).

