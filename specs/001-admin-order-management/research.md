# Technical Research: Admin Order Management & Fulfillment

**Feature**: `001-admin-order-management`  
**Date**: 2026-10-30  
**Status**: Completed  

---

## 1. State Machine & Order Lifecycle Transitions

### Decision
Implement a deterministic state transition map enforced in `orders.service.ts` with strict validation:
```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [], // Terminal state
  CANCELLED: []  // Terminal state
};
```

### Rationale
- Prevents invalid or retrograde transitions (e.g., jumping from `DELIVERED` back to `PENDING` or `PROCESSING`).
- Enforces business consistency across warehouse operators.
- Cleanly separates operational fulfillment from post-delivery returns/refunds.

### Alternatives Considered
- *Unrestricted status changes*: Rejected because it allows operators to skip steps (e.g. going straight from `PENDING` to `DELIVERED` without shipping/tracking) or accidentally reopen cancelled orders.
- *External state machine library (XState)*: Evaluated but rejected as unnecessary complexity for a linear 6-state flow. A native TypeScript lookup map provides zero runtime overhead, clear error reporting, and straightforward unit testability.

---

## 2. Order Cancellation & Atomic Inventory Restitution

### Decision
Execute cancellations inside an isolated interactive transaction (`prisma.$transaction`) that:
1. Validates that the order is not in a terminal or already-shipped state (`SHIPPED`, `DELIVERED`, `CANCELLED`).
2. Sorts order items by `productId` ascending to prevent deadlock conditions.
3. For each item:
   - Increments inventory quantity (`quantity: { increment: item.quantity }`).
   - Creates a `StockMovement` with `type: 'IN'`, `reason: cancellationReason`, and operator `userId`.
4. Updates order status to `CANCELLED` and records `cancellationReason`.
5. Updates associated `Payment` records to status `REFUNDED`.
6. Emits an audit log via `auditService.logAction`.
7. Invalidates Redis catalog caches (`catalog:products:*`) post-commit.

### Rationale
- Adheres directly to Principle II (*ACID Atomic Consistency & Zero-Overselling*) and Principle III (*Universal Auditability*) of the Project Constitution.
- Guarantees zero stock leakage upon order cancellation.

### Alternatives Considered
- *Asynchronous queue / event-driven restitution*: Unnecessary at current scale and risks delayed inventory availability. Synchronous interactive transaction ensures immediate stock replenishment.

---

## 3. Shipping Tracking & Carrier Data Schema

### Decision
Extend the `Order` model in Prisma with three nullable fields:
- `carrier`: String? (e.g., "FedEx", "DHL", "Estafeta", "Internal Courier")
- `trackingNumber`: String?
- `cancellationReason`: String?

### Rationale
- Minimal schema impact; perfectly backwards-compatible with existing order records.
- Allows operators to store logistics information directly on the order without introducing secondary tables for simple fulfillment tracking.

### Alternatives Considered
- *Separate `Shipment` entity with 1-to-N relations*: Considered for multi-parcel shipments. Rejected for v1 to keep domain simplicity (YAGNI), as 98% of orders in this store are fulfilled as a single parcel.

---

## 4. UI Architecture: Order List, Detail Drawer & Printable Packing Slip

### Decision
Build a modular frontend feature under `frontend/src/features/admin/orders/`:
- `OrdersList.tsx`: Main table with search, status filters (`All`, `Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`), pagination controls, and status badges.
- `OrderDetailModal.tsx`: Inspection modal displaying full customer address, item breakdown with line totals, payment method, state transition action buttons, and cancellation dialog.
- `PackingSlipView.tsx`: CSS print-optimized modal (`@media print`) rendering clean warehouse packing slip with barcode placeholder, item checklist, and delivery address.

### Rationale
- Matches the established UX conventions of `InventoryList.tsx`, `CategoriesList.tsx`, and `CustomersList.tsx`.
- CSS print media query ensures crisp physical printing without third-party PDF rendering dependencies.

