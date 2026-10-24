# Graph Report - ecommerce-pos  (2026-10-24)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 486 nodes · 939 edges · 24 communities (22 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7236347d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23

## God Nodes (most connected - your core abstractions)
1. `AppError` - 36 edges
2. `express` - 32 edges
3. `react` - 24 edges
4. `lucide-react` - 20 edges
5. `compilerOptions` - 18 edges
6. `apiClient` - 16 edges
7. `compilerOptions` - 15 edges
8. `useAuthStore` - 14 edges
9. `react-router-dom` - 13 edges
10. `protect()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `protect()` --calls--> `AppError`  [EXTRACTED]
  backend/src/core/middlewares/auth.middleware.ts → backend/src/core/utils/AppError.ts
- `requirePermission()` --calls--> `AppError`  [EXTRACTED]
  backend/src/core/middlewares/rbac.middleware.ts → backend/src/core/utils/AppError.ts
- `DashboardService` --references--> `TransactionsService`  [EXTRACTED]
  backend/src/modules/dashboard/dashboard.service.ts → backend/src/modules/transactions/transactions.service.ts
- `ProductDetail` --calls--> `useCartStore`  [EXTRACTED]
  frontend/src/features/products/ProductDetail.tsx → frontend/src/store/cart.store.ts
- `CustomerAccount()` --calls--> `User`  [EXTRACTED]
  frontend/src/features/account/CustomerAccount.tsx → frontend/src/store/auth.store.ts

## Import Cycles
- None detected.

## Communities (24 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (57): CustomerAccount(), CustomerProfile, Order, OrderItem, AdminDashboard(), DashboardMetrics, AuditLog, AuditLogsView() (+49 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (29): Express, protect(), Request, requirePermission(), getAuditLogs(), dashboardService, getDashboardData(), router (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (26): authLimiter, globalLimiter, validateRequest(), AppError, authService, login(), register(), router (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (42): eslint, @types/node, typescript, dependencies, axios, lucide-react, react, react-dom (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (23): author, description, prettier, keywords, license, main, name, prisma (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (14): createCustomer(), customersService, getCustomerById(), getCustomers(), getMyProfile(), updateMyProfile(), adminRouter, router (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (12): catalogService, createCategory(), createProduct(), getCategories(), getProductBySlug(), getProducts(), router, CreateCategoryDTO (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (9): AuditService, createUser(), getRoles(), getUsers(), usersService, router, CreateUserDTO, createUserSchema (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (17): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, prettier, prisma, ts-node, tsx, @types/bcrypt, @types/cors (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (8): getDailySalesReport(), getInventoryValuationReport(), getTopProductsReport(), reportsService, router, DateRangeQuery, dateRangeSchema, ReportsService

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, noImplicitAny, outDir, rootDir, skipLibCheck (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (8): errorHandler(), colors, format, levels, logger, transports, CreateAuditLogDTO, winston

### Community 15 - "Community 15"
Cohesion: 0.26
Nodes (7): cartService, validateCart(), router, cartItemSchema, ValidateCartDTO, validateCartSchema, CartService

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (8): v1Router, correlationMiddleware(), requestContext, router, cors, helmet, morgan, uuid

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (6): adapter, pool, bcrypt, pg, @prisma/adapter-pg, @prisma/client

### Community 18 - "Community 18"
Cohesion: 0.32
Nodes (4): app, redisClient, redis, slugify

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (6): scripts, build, dev, format, lint, start

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 21 - "Community 21"
Cohesion: 0.47
Nodes (3): App(), AppRouter(), react-dom

## Knowledge Gaps
- **18 isolated node(s):** `prettier`, `autoprefixer`, `oxlint`, `postcss`, `@types/react` (+13 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `Community 1` to `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 12`, `Community 14`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.255) - this node is a cross-community bridge._
- **What connects `prettier`, `autoprefixer`, `oxlint` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06376726417866588 - nodes in this community are weakly interconnected._
- **Why does `eslint` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07918367346938776 - nodes in this community are weakly interconnected._
- **Why does `@types/node` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07568027210884354 - nodes in this community are weakly interconnected._