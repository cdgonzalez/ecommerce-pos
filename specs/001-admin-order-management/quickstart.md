# Quickstart Validation Guide: Admin Order Management

**Feature**: `001-admin-order-management`  
**Date**: 2026-10-30  
**References**:
- Feature Specification: [spec.md](./spec.md)
- Domain Model & Lifecycle: [data-model.md](./data-model.md)
- API Contracts: [contracts/orders.contract.yaml](./contracts/orders.contract.yaml)

---

## Prerequisites

1. PostgreSQL database running and migrated with updated Prisma schema.
2. Redis service running for caching and cache invalidation.
3. Authenticated administrative user account with `MANAGE_ORDERS` or `PROCESS_SALES` permission.
4. Active products with inventory records in database to simulate purchases.

---

## Scenario 1: Order Dashboard Listing & Filtering

### Goal
Verify that administrators can query and filter customer orders with pagination.

### Steps
1. Place 2 test orders via e-commerce storefront or seed script.
2. Send authenticated HTTP request:
   ```bash
   GET /api/v1/orders?page=1&limit=10&status=PROCESSING
   Header: Authorization: Bearer <ADMIN_JWT>
   ```
3. **Expected Outcome**:
   - HTTP 200 OK.
   - Response contains `data` array with order summaries matching the `PROCESSING` status.
   - Response contains `pagination` object with `total`, `page: 1`, `limit: 10`, `totalPages`, and boolean flags.

---

## Scenario 2: Fulfillment Progression to Shipped State

### Goal
Verify that transitioning an order to `SHIPPED` enforces carrier and tracking details.

### Steps
1. Locate an order currently in `PROCESSING` state (`<ORDER_ID>`).
2. Attempt status update with missing carrier info:
   ```bash
   PATCH /api/v1/orders/<ORDER_ID>/status
   Body: { "status": "SHIPPED" }
   ```
   **Expected Outcome**: HTTP 400 Bad Request with validation error stating carrier and tracking number are mandatory.
3. Re-send request with valid tracking:
   ```bash
   PATCH /api/v1/orders/<ORDER_ID>/status
   Body: { "status": "SHIPPED", "carrier": "FedEx", "trackingNumber": "FDX-102938475" }
   ```
4. **Expected Outcome**:
   - HTTP 200 OK.
   - Order status reflects `SHIPPED`, carrier `FedEx`, and tracking number saved.
   - Audit log table contains a new entry documenting the transition.

---

## Scenario 3: Order Cancellation & Automated Inventory Restitution

### Goal
Verify that cancelling an unfulfilled order atomically restocks product quantities in inventory.

### Steps
1. Check current inventory for Product A (e.g., initial stock = `10`).
2. Create an order purchasing 3 units of Product A (stock drops to `7`).
3. Send cancellation request:
   ```bash
   POST /api/v1/orders/<ORDER_ID>/cancel
   Body: { "cancellationReason": "Customer requested cancellation prior to packing" }
   ```
4. **Expected Outcome**:
   - HTTP 200 OK.
   - Order status changes to `CANCELLED`.
   - Associated payment status changes to `REFUNDED`.
   - Product A inventory quantity immediately returns to `10`.
   - A `StockMovement` entry is created with `type: 'IN'` and reason mentioning the cancelled order.
   - Redis catalog cache is invalidated.

---

## Scenario 4: Terminal State Immutability

### Goal
Verify that terminal states cannot be overridden or transitioned retrogradely.

### Steps
1. Take the cancelled order from Scenario 3.
2. Attempt to transition back to `PROCESSING`:
   ```bash
   PATCH /api/v1/orders/<ORDER_ID>/status
   Body: { "status": "PROCESSING" }
   ```
3. **Expected Outcome**:
   - HTTP 400 Bad Request.
   - System refuses transition with message: `"Cannot transition order from terminal state CANCELLED"`.

