# Quickstart & Verification Scenarios: Project README Documentation

**Feature**: `004-project-readme`
**Date**: 2026-11-05
**Status**: Completed

## 1. Developer Onboarding Verification Workflow

To ensure the `README.md` delivers an effortless onboarding experience, follow these verification test journeys:

### Scenario 1: Clean Clone & Prerequisite Verification
- **Given** a developer with Node.js (v20+), npm, PostgreSQL (v15+), and Redis (v7+) running locally.
- **When** the developer executes:
  ```bash
  # Install backend dependencies
  npm --prefix backend install

  # Install frontend dependencies
  npm --prefix frontend install
  ```
- **Then** both installations complete with 0 unresolved peer dependency errors.

### Scenario 2: Environment Configuration
- **Given** default ports `3000` (API) and `5173` (Vite) available.
- **When** copying environment templates:
  ```bash
  cp backend/.env.example backend/.env
  cp frontend/.env.example frontend/.env
  ```
- **Then** all required variables (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `VITE_API_URL`) are populated.

### Scenario 3: Database Migration & Schema Generation
- **Given** PostgreSQL database created as defined in `DATABASE_URL`.
- **When** executing:
  ```bash
  npm --prefix backend run prisma:generate
  ```
- **Then** Prisma Client compiles with all models (`Shift`, `CashMovement`, `Order`, `Sale`, `Inventory`, etc.) ready for runtime import.

### Scenario 4: Automated Test Execution
- **Given** the environment configured.
- **When** executing:
  ```bash
  npm --prefix backend test
  ```
- **Then** Vitest runs all 9 test suites and executes 76 tests with a **100% pass rate**.

### Scenario 5: Production Build Verification
- **Given** backend and frontend sources.
- **When** executing:
  ```bash
  npm --prefix backend run build
  npm --prefix frontend run build
  ```
- **Then** both `tsc` (backend) and `vite build` (frontend) exit with code 0 without any TypeScript or bundling errors.

