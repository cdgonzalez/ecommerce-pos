# Tasks: Professional Project README Documentation

**Input**: Design documents from `specs/004-project-readme/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/readme-structure.yaml`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3], [US4])
- Include exact file paths in descriptions

---

## Phase 1: Setup & Contracts

**Purpose**: Verification of design contracts, taxonomy, and documentation structures

- [X] T001 [P] Verify documentation contract specification in `specs/004-project-readme/contracts/readme-structure.yaml`
- [X] T002 [P] Verify section taxonomy and metadata schema in `specs/004-project-readme/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish document skeleton, header anchors, and table of contents

**⚠️ CRITICAL**: Must complete before section drafting begins

- [X] T003 Initialize root `README.md` with document skeleton, table of contents, and anchor links in `README.md`
- [X] T004 [P] Configure Shields.io badges (Node.js, TypeScript, React, Prisma, PostgreSQL, Redis, Vitest, License) in `README.md`

**Checkpoint**: Base document skeleton ready - Content sections can begin

---

## Phase 3: User Story 1 - Executive Architecture & Value Overview (Priority: P1) 🎯 MVP

**Goal**: Deliver an executive overview, system identity, core architectural pillars, and complete feature matrix.

**Independent Test**: An external technical evaluator can read the overview and explain the dual-channel unified commerce model and core invariants within 90 seconds.

### Implementation for User Story 1
- [X] T005 [US1] Author Hero Header, project tagline, and mission statement in `README.md`
- [X] T006 [US1] Author Executive Overview and Dual-Channel Unified Commerce model (Web Storefront + In-Store POS + Admin Back-Office) in `README.md`
- [X] T007 [US1] Author System Architecture diagram and Core Invariants (ACID, Zero-Overselling, Immutable Snapshots, Universal Auditability) in `README.md`
- [X] T008 [US1] Author Comprehensive Feature Matrix covering B2C E-Commerce, POS Register Terminal, Cash Drawer Shifts, Order Fulfillment, and Back-Office Admin in `README.md`

**Checkpoint**: User Story 1 complete and independently reviewable as an MVP showcase.

---

## Phase 4: User Story 2 - Local Setup, Environment Configuration & Quickstart (Priority: P2)

**Goal**: Provide step-by-step developer onboarding, prerequisites, `.env` guides, migration steps, and run commands.

**Independent Test**: A developer can clone the repository, configure `.env`, run migrations, and launch both services in under 10 minutes following the guide.

### Implementation for User Story 2
- [X] T009 [US2] Author System Prerequisites section (Node.js v20+, PostgreSQL 15+, Redis 7+, npm) in `README.md`
- [X] T010 [US2] Author Environment Configuration tables for `backend/.env` and `frontend/.env` with safe default templates in `README.md`
- [X] T011 [US2] Author Step-by-Step Installation, Prisma Migration, Client Generation, and Seed Data commands in `README.md`
- [X] T012 [US2] Author Local Service Execution commands for backend API and frontend Vite dev servers in `README.md`

**Checkpoint**: User Stories 1 and 2 functional; developer onboarding fully self-service.

---

## Phase 5: User Story 3 - API Endpoints, Core Invariants & Quality Assurance (Priority: P3)

**Goal**: Document the complete REST API surface, session security model, cash shift reconciliation workflow, and automated testing instructions.

**Independent Test**: A QA engineer or API consumer can execute the test suite with 100% pass verification and trace all 8 API modules from the route reference.

### Implementation for User Story 3
- [X] T013 [US3] Author REST API Route Reference table covering all 8 modules (`/auth`, `/shifts`, `/sales`, `/orders`, `/inventory`, `/catalog`, `/transactions`, `/audit`) in `README.md`
- [X] T014 [US3] Author Security & Session Architecture breakdown (JWT Access, Rotating Refresh Tokens, Reuse Detection, RBAC) in `README.md`
- [X] T015 [US3] Author POS Cash Drawer & Corte Z Reconciliation workflow breakdown (Float, Cash Movements, Variance Calculation) in `README.md`
- [X] T016 [US3] Author Testing & Quality Assurance section detailing Vitest/Supertest suites (76 tests, 100% pass rate) in `README.md`

**Checkpoint**: User Stories 1, 2, and 3 functional with full technical API and testing transparency.

---

## Phase 6: User Story 4 - Project Structure, Roadmap & Contribution Guidelines (Priority: P4)

**Goal**: Present monorepo directory layout, roadmap of delivered milestones vs. upcoming features, Spec Kit governance, and contribution rules.

**Independent Test**: A contributor can locate any module from the directory tree and identify next planned features from the roadmap.

### Implementation for User Story 4
- [X] T017 [US4] Author Annotated Monorepo Directory Tree (`backend/`, `frontend/`, `specs/`) in `README.md`
- [X] T018 [US4] Author Project Roadmap detailing completed milestones (001 Admin Orders, 002 Auth Refresh, 003 POS Shifts) and upcoming roadmap in `README.md`
- [X] T019 [US4] Author Spec Kit Governance, Contribution Workflow, and MIT License sections in `README.md`

**Checkpoint**: All 4 user stories fully documented, formatted, and validated.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Markdown link validation, quickstart verification, and build integrity

- [X] T020 [P] Execute quickstart validation scenarios defined in `specs/004-project-readme/quickstart.md`
- [X] T021 [P] Validate all markdown Table of Contents anchor links and external links in `README.md`
- [X] T022 [P] Verify backend test suite pass rate (`npm --prefix backend test`) and frontend/backend build integrity (`npm run build`)

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: No dependencies — can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories.
- **Phase 3 (User Story 1 - P1)**: Depends on Phase 2 — Core MVP.
- **Phase 4 (User Story 2 - P2)**: Depends on Phase 3.
- **Phase 5 (User Story 3 - P3)**: Depends on Phase 4.
- **Phase 6 (User Story 4 - P4)**: Depends on Phase 5.
- **Phase 7 (Polish)**: Depends on all user stories being complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`readme-structure.yaml`, `data-model.md`).
2. Complete Phase 2: Foundational (Document skeleton, Badges, Table of Contents).
3. Complete Phase 3: User Story 1 (Hero header, Architecture, Core Invariants, Feature Matrix).
4. **Validate MVP**: Review executive overview and architectural clarity.

### Incremental Delivery
1. Add User Story 2 (Quickstart, Prerequisites, `.env`, Run commands).
2. Add User Story 3 (API Route Matrix, Security & Session rotation, Cash Shift Corte Z, Testing guide).
3. Add User Story 4 (Monorepo tree, Roadmap, Spec Kit governance, License).
4. Execute Phase 7 Polish (Link verification, quickstart validation, test suite check).
