# Data Model & State Transitions: Automated Session Renewal & Token Lifecycle Invalidation

**Feature**: `002-auth-session-refresh`
**Date**: 2026-10-30

---

## 1. Entity Definitions

### User (Existing in PostgreSQL via Prisma)
Represents the authenticated identity across POS, E-Commerce, and Admin backoffice.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String (UUID) | `@id @default(uuid())` | Unique user identifier |
| `email` | String | `@unique` | Account email address |
| `password` | String | | Hashed password (bcrypt) |
| `name` | String | | Display name |
| `refreshToken` | String? | Nullable | Currently active refresh token string for the user |
| `isActive` | Boolean | `@default(true)` | Operational flag. If `false`, session refresh is blocked immediately |
| `createdAt` | DateTime | `@default(now())` | Account creation timestamp |
| `updatedAt` | DateTime | `@updatedAt` | Last modification timestamp |

---

### AuditLog (Existing in PostgreSQL via Prisma)
Captures security events for traceability and fraud investigation.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String (UUID) | `@id @default(uuid())` | Unique log entry ID |
| `userId` | String? | Nullable | ID of the authenticated user triggering the event |
| `action` | String | Indexed | Security action (`TOKEN_REFRESH`, `TOKEN_REUSE_DETECTED`, `USER_LOGOUT`) |
| `entity` | String | | Affected entity domain (`Auth`, `UserSession`) |
| `entityId` | String? | Nullable | Identifier of the affected record |
| `metadata` | JSON | | Contextual details (reused token fragment, IP address, user-agent) |
| `ipAddress` | String? | Nullable | Client network IP address |
| `createdAt` | DateTime | `@default(now())` | Timestamp of event occurrence |

---

## 2. In-Memory Token Entities (JWT Structures)

### Access Token
- **Payload**:
  ```json
  {
    "id": "uuid-v4-user-id",
    "iat": 1730304000,
    "exp": 1730304900
  }
  ```
- **Signing Secret**: `process.env.JWT_ACCESS_SECRET`
- **Lifespan**: 15 minutes (`JWT_ACCESS_EXPIRES_IN || '15m'`)
- **Transport**: HTTP Request Header `Authorization: Bearer <accessToken>`

### Refresh Token
- **Payload**:
  ```json
  {
    "id": "uuid-v4-user-id",
    "iat": 1730304000,
    "exp": 1730908800
  }
  ```
- **Signing Secret**: `process.env.JWT_REFRESH_SECRET`
- **Lifespan**: 7 days (`JWT_REFRESH_EXPIRES_IN || '7d'`)
- **Transport**: JSON Body `{ "refreshToken": "<token>" }`

---

## 3. Session State Lifecycle & Transitions

```
[ Unauthenticated / Logged Out ]
         │
         │  POST /api/v1/auth/login OR /register
         ▼
[ Active Session ] (User.refreshToken = Token_A)
         │
         ├─── Normal API Calls (valid Access Token) ──► 200 OK
         │
         ├─── Access Token Expires (HTTP 401)
         │       │
         │       ▼
         │   POST /api/v1/auth/refresh-token (Token_A)
         │       │
         │       ├──► [VALID & MATCHES]: Issues Token_B, User.refreshToken = Token_B ──► [ Active Session ]
         │       │
         │       └──► [TOKEN REUSE / MISMATCH]: User.refreshToken = null
         │               │
         │               ▼
         │         [ Session Revoked (Theft Detected) ] ──► Emits AuditLog ──► [ Unauthenticated ]
         │
         ├─── User Clicks Logout
         │       │
         │       ▼
         │   POST /api/v1/auth/logout
         │       │
         │       ▼
         │   User.refreshToken = null ──► Emits AuditLog ──► [ Unauthenticated ]
         │
         └─── Admin Deactivates Account (User.isActive = false)
                 │
                 ▼
             Refresh Token Rejected (HTTP 401) ──► [ Session Revoked ]
```

---

## 4. Frontend State Model (`useAuthStore`)

```typescript
interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
}
```
- Persisted via `zustand/middleware/persist` under the key `'auth-storage'`.

