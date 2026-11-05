# Tasks: Automated Session Renewal & Token Lifecycle Invalidation

**Input**: Design documents from `specs/002-auth-session-refresh/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/auth-session.yaml`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3], [US4])
- Include exact file paths in descriptions

---

## Phase 1: Setup & Contracts

**Purpose**: Shared contract and validation schema definition

- [X] T001 [P] Register Zod validation schemas `refreshTokenSchema` (`z.object({ refreshToken: z.string().min(1, "Refresh token is required") })`) and `logoutSchema` in `backend/src/modules/auth/auth.schema.ts`
- [X] T002 [P] Verify OpenAPI 3.0 contract specification in `specs/002-auth-session-refresh/contracts/auth-session.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core state models and audit infrastructure required across all user stories

**⚠️ CRITICAL**: Must complete before user story implementation begins

- [X] T003 [P] Add session audit action constants (`TOKEN_REFRESH`, `TOKEN_REUSE_DETECTED`, `USER_LOGOUT`) in `backend/src/modules/audit/audit.service.ts`
- [X] T004 [P] Extend `AuthState` interface with `refreshToken: string | null`, `setTokens: (accessToken: string, refreshToken: string) => void`, and update `login: (user: User, accessToken: string, refreshToken: string) => void` in `frontend/src/store/auth.store.ts`
- [X] T005 Update `handleSubmit` in `frontend/src/features/auth/Login.tsx` to store `refreshToken` from `/auth/login` response into `useAuthStore`

**Checkpoint**: Foundation ready - User stories can now be implemented

---

## Phase 3: User Story 1 - Silent Automatic Session Renewal (Priority: P1) 🎯 MVP

**Goal**: Authenticated clients automatically renew expired access tokens in the background via `POST /api/v1/auth/refresh-token` with request queueing so user actions never fail due to token expiration.

**Independent Test**: Dispatch an authenticated request with an expired access token; client automatically negotiates a new access token and fulfills the request with zero manual user interaction.

### Tests for User Story 1
- [X] T006 [P] [US1] Unit test for `AuthService.refreshToken` verifying token signature with `JWT_REFRESH_SECRET` and issuing new access token in `backend/tests/unit/auth.service.spec.ts`
- [X] T007 [P] [US1] Integration test for `POST /api/v1/auth/refresh-token` returning 200 with new tokens in `backend/tests/integration/auth.api.spec.ts`

### Implementation for User Story 1
- [X] T008 [US1] Implement `refreshToken` method in `backend/src/modules/auth/auth.service.ts` verifying refresh JWT with `process.env.JWT_REFRESH_SECRET` and generating a new access token
- [X] T009 [US1] Implement controller handler `refreshToken` in `backend/src/modules/auth/auth.controller.ts`
- [X] T010 [US1] Register `POST /refresh-token` endpoint with `validateRequest(refreshTokenSchema)` and `authLimiter` in `backend/src/modules/auth/auth.routes.ts`
- [X] T011 [US1] Implement Axios 401 response interceptor with `isRefreshing` lock, in-flight `failedQueue`, and automatic request retry in `frontend/src/services/api/axios.client.ts`

**Checkpoint**: User Story 1 functional and independently testable as an MVP increment.

---

## Phase 4: User Story 2 - Refresh Token Rotation & Theft Detection (Priority: P2)

**Goal**: Implement single-use Refresh Token Rotation (RTR); every refresh issues a new refresh token and replaces the old one. If reuse of an invalidated token is detected, immediately revoke the session and emit an audit security alarm.

**Independent Test**: Submit a valid refresh token to obtain a rotated token; then resubmit the original (now invalidated) token. The system must return 401, wipe `User.refreshToken` in DB, and create a `TOKEN_REUSE_DETECTED` audit record.

### Tests for User Story 2
- [X] T012 [P] [US2] Unit test for Refresh Token Rotation and reuse theft detection in `backend/tests/unit/auth.service.spec.ts`
- [X] T013 [P] [US2] Integration test for token reuse returning 401 and revoking active user session in `backend/tests/integration/auth.api.spec.ts`

### Implementation for User Story 2
- [X] T014 [US2] Update `AuthService.refreshToken` in `backend/src/modules/auth/auth.service.ts` to compare presented token against `user.refreshToken`; if matching, issue new rotated refresh token and update `User.refreshToken` in DB; if mismatch detected, set `user.refreshToken = null`, emit `TOKEN_REUSE_DETECTED` audit log via `auditService.logAction`, and throw 401 AppError
- [X] T015 [US2] Update frontend refresh response handler in `frontend/src/services/api/axios.client.ts` to persist newly rotated `refreshToken` via `useAuthStore.getState().setTokens()`

**Checkpoint**: User Stories 1 and 2 functional with end-to-end token rotation and fraud detection.

---

## Phase 5: User Story 3 - Explicit Session Invalidation on Logout (Priority: P3)

**Goal**: Immediate server-side invalidation of session credentials upon logout so refresh tokens cannot be replayed from shared terminals.

**Independent Test**: Calling logout sets `User.refreshToken = null` in the database, emits a `USER_LOGOUT` audit log, and makes subsequent refresh attempts fail with 401.

### Tests for User Story 3
- [X] T016 [P] [US3] Unit test for `AuthService.logout` nullifying `refreshToken` in `backend/tests/unit/auth.service.spec.ts`
- [X] T017 [P] [US3] Integration test for `POST /api/v1/auth/logout` clearing DB session in `backend/tests/integration/auth.api.spec.ts`

### Implementation for User Story 3
- [X] T018 [US3] Implement `AuthService.logout` in `backend/src/modules/auth/auth.service.ts` to set `user.refreshToken = null` for the user and log `USER_LOGOUT` in `AuditService`
- [X] T019 [US3] Implement `logout` controller handler in `backend/src/modules/auth/auth.controller.ts`
- [X] T020 [US3] Register `POST /logout` endpoint with `protect` middleware in `backend/src/modules/auth/auth.routes.ts`
- [X] T021 [US3] Update `logout` action in `frontend/src/store/auth.store.ts` to asynchronously call `POST /api/v1/auth/logout` before clearing local state

**Checkpoint**: User Stories 1, 2, and 3 functional with clean server-side session termination.

---

## Phase 6: User Story 4 - Immediate Session Revocation on Account Deactivation (Priority: P4)

**Goal**: Block token renewal immediately if an administrator sets a user account to inactive (`isActive: false`).

**Independent Test**: Deactivate a user account (`isActive: false`); verify any refresh attempt with their tokens returns 401 Unauthorized.

### Tests for User Story 4
- [X] T022 [P] [US4] Unit test verifying `AuthService.refreshToken` throws 401 for inactive user (`isActive: false`) in `backend/tests/unit/auth.service.spec.ts`
- [X] T023 [P] [US4] Integration test verifying `POST /api/v1/auth/refresh-token` rejects deactivated accounts with 401 in `backend/tests/integration/auth.api.spec.ts`

### Implementation for User Story 4
- [X] T024 [US4] Ensure `AuthService.refreshToken` in `backend/src/modules/auth/auth.service.ts` validates `if (!user || !user.isActive)` before performing rotation or issuing tokens

**Checkpoint**: All 4 user stories fully implemented and independently verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, regression testing, and build integrity

- [X] T025 [P] Execute quickstart validation scenarios defined in `specs/002-auth-session-refresh/quickstart.md`
- [X] T026 [P] Run full backend automated test suite (`npm --prefix backend test`) and verify 100% test pass rate
- [X] T027 [P] Run frontend build and type check (`npm --prefix frontend run build`) to ensure zero TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: No dependencies — can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **Phase 3 (User Story 1 - P1)**: Depends on Phase 2 — Core MVP.
- **Phase 4 (User Story 2 - P2)**: Depends on Phase 3 completion (extends `AuthService.refreshToken` with rotation and reuse detection).
- **Phase 5 (User Story 3 - P3)**: Depends on Phase 2 (independent endpoint, can run in parallel with US1/US2).
- **Phase 6 (User Story 4 - P4)**: Depends on Phase 3/4 (`isActive` check on refresh).
- **Phase 7 (Polish)**: Depends on all user stories being complete.

---

## Parallel Execution Opportunities

- **Phase 1**: T001 and T002 can execute in parallel.
- **Phase 2**: T003 and T004 can execute in parallel.
- **Phase 3**: Tests T006 and T007 can execute in parallel before implementation.
- **Phase 4**: Tests T012 and T013 can execute in parallel before implementation.
- **Phase 5**: Tests T016 and T017 can execute in parallel before implementation.
- **Phase 6**: Tests T022 and T023 can execute in parallel before implementation.
- **Phase 7**: T025, T026, and T027 can execute in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`auth.schema.ts`, `contracts/auth-session.yaml`).
2. Complete Phase 2: Foundational (`audit.service.ts`, `auth.store.ts`, `Login.tsx`).
3. Complete Phase 3: User Story 1 (Tests T006-T007, Backend `refreshToken` T008-T010, Frontend interceptor T011).
4. **Validate MVP**: Test silent refresh flow.

### Incremental Security Hardening
1. Add User Story 2 (Token Rotation & Theft Detection).
2. Add User Story 3 (Server-side Logout Invalidation).
3. Add User Story 4 (Account Deactivation Revocation).
4. Execute Phase 7 Polish (full test suite + frontend build).
