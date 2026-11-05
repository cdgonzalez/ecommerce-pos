# Implementation Plan: Automated Session Renewal & Token Lifecycle Invalidation

**Branch**: `002-auth-session-refresh` | **Date**: 2026-10-30 | **Spec**: [specs/002-auth-session-refresh/spec.md](spec.md)

**Input**: Feature specification from `specs/002-auth-session-refresh/spec.md`

## Summary

Implement automated, silent session renewal and server-side token lifecycle management for both the Express backend and Vite/React frontend. The backend will expose `POST /api/v1/auth/refresh-token` (with Refresh Token Rotation and theft reuse detection) and `POST /api/v1/auth/logout` (server-side session invalidation), recording all security events in `AuditLog`. The frontend will enhance `useAuthStore` to store the refresh token and integrate an in-flight request queue in `axios.client.ts` to seamlessly intercept 401s, renew credentials without multiple parallel renewal calls, and retry queued requests transparently.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22 LTS  
**Primary Dependencies**: 
- Backend: Express 5.x, `@prisma/client` 7.x, `jsonwebtoken`, `bcrypt`, `zod`, `winston`
- Frontend: React 18, Vite, Zustand (with persist middleware), Axios  
**Storage**: PostgreSQL (via existing Prisma `User` schema: `refreshToken` column), Redis (caching)  
**Testing**: Vitest 3.x, Supertest 7.x  
**Target Platform**: Linux/Windows Node.js backend server, modern web browsers (E-Commerce & POS terminals)  
**Project Type**: Monorepo-style Web Application (`backend/` API + `frontend/` SPA)  
**Performance Goals**: Silent session renewal roundtrip under 300ms; zero noticeable latency or UI disruption during silent refresh.  
**Constraints**: Zero regression on existing 36 automated tests; strict prevention of infinite refresh loops; race-condition protection during concurrent 401s.  
**Scale/Scope**: Unified across POS cashiers, backoffice admins, and web shoppers.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Evaluation | Status |
|---|---|---|
| **I. Dual-Channel Unified Commerce** | Session renewal and invalidation logic applies identically to both POS registers and online storefront users. | PASS |
| **II. ACID Atomic Consistency** | User token update and revocation execute atomically via Prisma single-record operations and transactional updates. | PASS |
| **III. Immutable Snapshots & Universal Auditability** | Token renewal (`TOKEN_REFRESH`), reuse detection (`TOKEN_REUSE_DETECTED`), and logout (`USER_LOGOUT`) emit structured audit entries to `AuditService`. | PASS |
| **IV. Contract-Driven Validation & Granular RBAC** | Request payloads are strictly validated using Zod schemas (`refreshTokenSchema`). Rate limiting is applied to renewal endpoints. | PASS |
| **V. Multi-Tier Redis Caching** | Auth operations directly interact with canonical DB state; no stale token data cached in Redis. | PASS |
| **Section: Auth & Session Lifecycle Governance** | Directly fulfills the explicit governance mandate in Constitution Section "System Boundaries & Identified Architectural Gaps", Item 1. | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-session-refresh/
├── spec.md              # Feature requirements and user stories
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architectural findings and decisions
├── data-model.md        # Phase 1 data entities and session lifecycle
├── quickstart.md        # Phase 1 runnable validation guide
├── contracts/           # Phase 1 API specifications
│   └── auth-session.yaml
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Layout

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.schema.ts        # Add refreshTokenSchema & logoutSchema
│   │   │   ├── auth.service.ts       # Add refreshToken() with RTR & theft detection, logout()
│   │   │   ├── auth.controller.ts    # Add refreshToken and logout handlers
│   │   │   └── auth.routes.ts        # Register POST /refresh-token and POST /logout
│   │   └── audit/
│   │       └── audit.service.ts      # Verify audit events for session actions
│   └── core/
│       ├── middlewares/
│       │   └── auth.middleware.ts    # Ensure token decoding and active status validation
│       └── utils/
└── tests/
    ├── unit/
    │   └── auth.service.spec.ts      # Unit tests for RTR, theft detection, and logout
    └── integration/
        └── auth.api.spec.ts          # Supertest tests for refresh-token and logout endpoints

frontend/
├── src/
│   ├── store/
│   │   └── auth.store.ts             # Extend state with refreshToken, setTokens, async logout
│   ├── services/
│   │   └── api/
│   │       └── axios.client.ts       # Implement 401 response interceptor with in-flight queue
│   └── features/
│       └── auth/
│           └── Login.tsx             # Pass refreshToken to auth.store on successful login
```

**Structure Decision**: Web application layout matching Option 2 (`backend/` + `frontend/`). Real paths strictly integrate into existing `backend/src/modules/auth/` and `frontend/src/`.

## Complexity Tracking

*No violations detected. Zero unnecessary dependencies or schema breaking changes introduced.*
