# Technical Research & Architectural Decisions: Automated Session Renewal & Token Lifecycle Invalidation

**Feature**: `002-auth-session-refresh`
**Date**: 2026-10-30
**Status**: Completed

---

## 1. Refresh Token Rotation (RTR) & Theft Detection

### Decision
Implement single-use Refresh Token Rotation with automatic theft detection directly within `AuthService.refreshToken()`.
- The database schema `User` model currently possesses `refreshToken: String?`.
- Upon successful authentication (`/login` or `/register`), a cryptographically signed refresh token (TTL: 7 days) is stored in `User.refreshToken`.
- When `/api/v1/auth/refresh-token` is requested:
  1. The token signature and expiration are verified using `JWT_REFRESH_SECRET`.
  2. The user record is retrieved from PostgreSQL (`prisma.user.findUnique`).
  3. If `!user || !user.isActive`: reject immediately with 401 `Account is inactive or not found`.
  4. **Theft Detection Condition**: If `user.refreshToken !== incomingRefreshToken`:
     - This condition indicates token reuse (a token that was already replaced or stolen).
     - **Action**: Immediately revoke the user's active session by setting `user.refreshToken = null` in the database.
     - Record a high-priority security audit entry via `AuditService` (`TOKEN_REUSE_DETECTED`).
     - Throw `AppError('Token reuse detected. All active sessions have been revoked for security.', 401)`.
  5. If valid and matching:
     - Generate a new pair `{ accessToken, refreshToken: newRefreshToken }`.
     - Persist `newRefreshToken` in `user.refreshToken`.
     - Record audit entry (`TOKEN_REFRESH`).
     - Return the token pair to the client.

### Rationale
- Complies with RFC 6749 and modern OAuth2 / OIDC security recommendations for Single Page Applications (SPAs).
- Closes the attack window: even if an attacker intercepts an old refresh token, attempting to use it will immediately trip the reuse alarm, terminate the victim's session, and notify administrators through audit logs.

### Alternatives Considered
- *Multi-session token family tracking (dedicated RefreshToken table with parent-child links)*: Evaluated, but discarded for v1 to avoid adding table migration overhead when the application constitution and current schema explicitly define a single primary active device session per user account (`User.refreshToken`). Single-column RTR provides full theft detection with zero schema migration risk.

---

## 2. Frontend Silent Renewal Queue & Concurrency Management

### Decision
Implement a synchronized Axios response interceptor in `frontend/src/services/api/axios.client.ts` with an in-flight promise queue.
- Maintain `isRefreshing: boolean` and `failedQueue: Array<{ resolve: (token: string) => void, reject: (err: any) => void }>`.
- When an API request returns HTTP 401:
  - Check if the failing request is itself the `/auth/refresh-token` or `/auth/login` endpoint; if so, fail immediately without looping.
  - If `!isRefreshing`:
    - Set `isRefreshing = true`.
    - Retrieve `refreshToken` from `useAuthStore.getState().refreshToken`.
    - If no `refreshToken` exists, execute `useAuthStore.getState().logout()` and reject.
    - Dispatch `axios.post(`${baseURL}/auth/refresh-token`, { refreshToken })` using a raw Axios instance (to bypass interceptors).
    - Upon success:
      - Update `useAuthStore` with new `accessToken` and `refreshToken`.
      - Resolve all callbacks in `failedQueue` with the new token.
      - Set `isRefreshing = false`, reset `failedQueue = []`.
      - Retry the original failing request with updated Authorization header.
    - Upon failure:
      - Reject all callbacks in `failedQueue`.
      - Set `isRefreshing = false`, reset `failedQueue = []`.
      - Call `useAuthStore.getState().logout()`.
      - Redirect to `/login`.
  - If `isRefreshing === true`:
    - Return a new `Promise((resolve, reject) => failedQueue.push({ resolve, reject }))` which will retry once the master refresh call completes.

### Rationale
- In real-world dashboard usage (such as POS terminal loading catalog, categories, and customer info concurrently on launch), 5-10 requests may fire simultaneously right as an access token expires. Without queueing, 10 parallel refresh calls would trigger, causing race conditions where the 2nd request presents an already-rotated token and trips the theft detector. The queue guarantees strictly 1 refresh call per token expiration cycle.

### Alternatives Considered
- *Proactive timer-based token refresh (`setInterval`)*: Ineffective when browser tabs are throttled or asleep, and does not handle clock skew or backend token invalidation.
- *Retry without queueing*: Causes race conditions with Refresh Token Rotation.

---

## 3. Server-Side Session Invalidation on Logout

### Decision
Expose `POST /api/v1/auth/logout`.
- Protected by `protect` middleware (or accepting `{ refreshToken?: string }` in body if access token is already expired).
- Clears `user.refreshToken = null` in the database for the requesting user.
- Emits `AuditLog` with action `USER_LOGOUT`.
- Returns `{ status: 'success', message: 'Logged out successfully' }`.
- Frontend updates `useAuthStore.logout()` to be an async action that triggers this endpoint before clearing local storage.

### Rationale
- Fulfills Constitution Principle III (Immutable Snapshots & Universal Auditability) and Section "Authentication & Session Lifecycle (Omission to Resolve)".
- Prevents abandoned refresh tokens from remaining valid in PostgreSQL indefinitely.

### Alternatives Considered
- *Client-side only storage purge*: Rejected because the refresh token would remain completely valid on the backend, violating security compliance for POS shared terminals.

---

## 4. Audit Logging & Security Observability

### Decision
Utilize the existing `AuditService` in `backend/src/modules/audit/audit.service.ts` to log all session lifecycle events:
- `TOKEN_REFRESH`: User successfully renewed credentials.
- `TOKEN_REUSE_DETECTED`: Security alert for token reuse; records user ID and client IP address.
- `USER_LOGOUT`: Explicit session termination.

### Rationale
- Integrates seamlessly with the project's existing `AuditService` without introducing external dependencies.

