# Quickstart Validation Guide: Automated Session Renewal & Invalidation

**Feature**: `002-auth-session-refresh`
**Date**: 2026-10-30

---

## Prerequisites

1. PostgreSQL database running with updated schema (`backend/prisma/schema.prisma`).
2. Environment variables configured in `backend/.env`:
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_ACCESS_EXPIRES_IN=15m`
   - `JWT_REFRESH_EXPIRES_IN=7d`
3. Backend dependencies installed (`npm install` inside `backend/`).
4. Frontend dependencies installed (`npm install` inside `frontend/`).

---

## Scenario 1: Automated Unit & Integration Tests Verification

Run the test suite verifying token renewal, rotation, reuse detection, and session logout:

```bash
# From repository root
npm --prefix backend test -- --run tests/unit/auth.service.spec.ts tests/integration/auth.api.spec.ts
```

### Expected Outcome:
- All unit tests in `auth.service.spec.ts` pass, including:
  - Generating new access and refresh tokens on valid refresh.
  - Detecting superseded tokens and triggering theft detection revocation.
  - Clearing stored refresh tokens on logout.
- All integration tests in `auth.api.spec.ts` pass, including:
  - `POST /api/v1/auth/refresh-token` returning 200 with new rotated tokens.
  - `POST /api/v1/auth/refresh-token` returning 401 when an old token is reused.
  - `POST /api/v1/auth/logout` returning 200 and nullifying the token in database.

---

## Scenario 2: End-to-End Manual API Flow via cURL

### Step 1: Login and acquire initial tokens
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Password123!"}'
```
*Save `accessToken` and `refreshToken` (Token A).*

### Step 2: Renew session using Token A
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<TOKEN_A>"}'
```
*Expected: 200 OK. Returns new `accessToken` and new `refreshToken` (Token B).*

### Step 3: Trigger Theft Detection using invalidated Token A
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<TOKEN_A>"}'
```
*Expected: 401 Unauthorized with message: `Token reuse detected. All active sessions have been revoked for security.`*

### Step 4: Verify Token B is now also revoked due to theft detection
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<TOKEN_B>"}'
```
*Expected: 401 Unauthorized. User's database session was completely wiped upon detecting Token A replay.*

---

## Scenario 3: Frontend Silent Renewal & Logout Validation

1. Start frontend development server:
   ```bash
   npm --prefix frontend run dev
   ```
2. Log in through the web interface at `http://localhost:5173/login`.
3. Open browser DevTools -> Application -> LocalStorage -> inspect `'auth-storage'`. Confirm both `accessToken` and `refreshToken` are present.
4. Simulate an expired access token by temporarily setting an invalid/expired token in memory or waiting for expiry.
5. Trigger any authenticated navigation (e.g., navigating to `/admin/orders` or viewing products).
6. Observe Network Tab:
   - Initial call returns `401 Unauthorized`.
   - Client automatically dispatches `POST /api/v1/auth/refresh-token`.
   - Original call is transparently re-attempted and returns `200 OK`.
   - UI suffers zero flicker and prompts no manual login modal.
7. Click "Sign Out".
8. Observe Network Tab:
   - Client dispatches `POST /api/v1/auth/logout`.
   - LocalStorage `'auth-storage'` is wiped.
   - User is redirected to `/login`.

