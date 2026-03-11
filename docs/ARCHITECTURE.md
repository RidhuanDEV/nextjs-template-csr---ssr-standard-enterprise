# Architecture Documentation

## Overview

This is a production-ready CSR (Client-Side Rendered) frontend architecture built on Next.js App Router. It follows a modular feature architecture designed for teams of 5-15 developers working on large-scale applications.

---

## Folder Structure

```
src/
├── app/                           # Next.js App Router — pages only
│   ├── globals.css
│   ├── layout.tsx                 # Root layout (wraps AppProviders)
│   ├── page.tsx                   # Root redirect
│   ├── (auth)/                    # Public auth route group
│   │   ├── layout.tsx             # Centered card layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/               # Protected route group
│       ├── layout.tsx             # Sidebar layout + AuthGuard
│       └── dashboard/page.tsx
│
├── components/                    # Shared UI components
│   ├── ui/                        # Primitive components (Button, Input, Spinner)
│   ├── layout/                    # Layout shells (AppShell, Sidebar, Header)
│   ├── feedback/                  # User feedback (ErrorBoundary, Toast, Loading)
│   └── guards/                    # Route protection (AuthGuard, RoleGuard)
│
├── hooks/                         # Shared React hooks
│   └── useToast.ts
│
├── lib/                           # Core infrastructure (framework-level)
│   ├── api/                       # Axios client + interceptors
│   │   ├── client.ts
│   │   ├── interceptors.ts
│   │   └── types.ts
│   ├── query/                     # React Query client factory
│   │   └── client.ts
│   ├── env.ts                     # Zod-validated environment variables
│   └── permissions.ts             # RBAC permission utilities
│
├── modules/                       # Feature modules (domain code)
│   └── auth/                      # Auth module (example)
│       ├── components/            # Module-scoped components
│       ├── hooks/                 # Module-scoped hooks
│       ├── schemas/               # Zod validation schemas
│       ├── services/              # API service functions
│       ├── types/                 # TypeScript interfaces
│       └── index.ts               # Public API barrel export
│
├── providers/                     # React context providers
│   ├── AppProviders.tsx           # Composition root
│   └── QueryProvider.tsx
│
├── store/                         # Global Zustand stores
│   ├── auth.store.ts
│   └── toast.store.ts
│
├── types/                         # Global TypeScript types
│   └── index.ts
│
└── utils/                         # Pure utility functions
    └── cn.ts                      # Tailwind class merging
```

---

## Layer Responsibilities

### `app/` — Routing Layer

- Contains **only** Next.js page files and route layouts
- Pages are thin — they compose module components
- Route groups `(auth)` and `(dashboard)` define layout boundaries
- No business logic lives here

### `modules/` — Feature Domain Layer

- Each feature is a self-contained module with its own components, hooks, services, schemas, and types
- Modules communicate through well-defined interfaces (barrel exports via `index.ts`)
- Cross-module imports should go through the barrel export, never reach into internal files
- New features = new module folder

### `lib/` — Infrastructure Layer

- Framework-level code that is feature-agnostic
- API client, query configuration, env validation, RBAC utilities
- Owned by platform/infra team, rarely changes after initial setup

### `components/` — Shared UI Layer

- Reusable components shared across multiple modules
- `ui/` contains atomic primitives (no business logic)
- `layout/` contains structural components
- `feedback/` contains user feedback mechanisms
- `guards/` contains route protection components

### `store/` — Global State Layer

- Zustand stores for cross-cutting state (auth, toast)
- Feature-specific state should live inside the module, not here
- Persisted state uses Zustand persist middleware with localStorage

### `providers/` — Provider Composition Layer

- Wraps the app with necessary React contexts
- `AppProviders` is the composition root used in root layout
- Add new providers here as needed (theme, feature flags, etc.)

### `hooks/` — Shared Hooks Layer

- Hooks used across multiple modules
- Module-specific hooks belong inside the module

### `types/` — Global Type Layer

- Shared TypeScript types, role/permission enums
- Module-specific types belong inside the module

### `utils/` — Utility Layer

- Pure functions with no side effects
- Things like class name merging, date formatting, etc.

---

## Key Design Decisions

### Why CSR with Next.js App Router?

- The backend is a separate JWT-authenticated service — no SSR data fetching needed
- React Query manages server state with caching, deduplication, and optimistic updates
- App Router provides file-based routing, layouts, and route groups without requiring SSR
- Team gets the DX benefits of Next.js while keeping a CSR architecture

### Why Modular Feature Architecture?

- 10 developers can work on different modules simultaneously without merge conflicts
- Clear ownership boundaries — each module has a single team/owner
- Features can be added/removed without affecting other parts of the app
- Consistent internal structure makes onboarding fast

### Why Zustand over Context?

- Zustand stores are accessible outside React (e.g., in Axios interceptors)
- No provider nesting required — simpler component tree
- Built-in persist middleware for localStorage
- Minimal boilerplate compared to Redux

### Why Barrel Exports?

- Modules expose a clean public API via `index.ts`
- Internal refactoring doesn't break consumers
- IDE auto-imports resolve to the barrel, keeping imports clean
- Can be enforced with ESLint rules

---

## Authentication Flow

```
1. User visits /dashboard
2. AuthGuard checks hydrated Zustand store for token
3. No token → redirect to /login
4. User submits LoginForm
5. useLogin mutation calls authService.login()
6. On success: store user + token in Zustand (persisted to localStorage)
7. Redirect to /dashboard
8. AuthGuard finds token → renders content
9. All subsequent API requests include JWT via Axios interceptor
10. 401 response → interceptor clears auth, redirects to /login
```

---

## RBAC System

```tsx
// Check permissions in code
import { hasPermission, hasRole } from '@/lib/permissions';

if (hasPermission(user, 'users:delete')) { /* ... */ }

// Guard UI sections declaratively
<RoleGuard roles={['admin']} fallback={<p>Access denied</p>}>
  <AdminPanel />
</RoleGuard>

<RoleGuard permissions={['users:create']}>
  <CreateUserButton />
</RoleGuard>
```

---

## Error Handling Strategy

| Layer       | Mechanism                     | Purpose                         |
| ----------- | ----------------------------- | ------------------------------- |
| Global      | ErrorBoundary in AppProviders | Catches unhandled React errors  |
| API         | Axios response interceptor    | Global 401/error toast handling |
| Mutation    | React Query onError           | Per-mutation error handling     |
| Form        | Zod + react-hook-form         | Client-side validation          |
| Environment | Zod env validation            | Fail-fast on misconfiguration   |

---

## Adding a New Feature Module

1. Create `src/modules/<name>/` with the standard structure
2. Add types, schemas, services, hooks, and components
3. Export public API from `index.ts`
4. Add route in `src/app/`
5. Add nav item in `Sidebar.tsx` if needed

Or use the CLI generator:

```bash
npx frontend-cli generate module <name>
```

---

## Generator Analysis (Phase 5)

### What Should Be Generated?

| Artifact           | Why Generate?                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Feature Module** | Consistent structure across 10+ developers. Every module needs the same folders (components, hooks, schemas, services, types) and an index.ts barrel. Manual creation leads to drift. |
| **Service**        | Every API service follows the same pattern: import apiClient, define typed methods, return response.data. Boilerplate that should be scaffolded.                                      |
| **Hook**           | Query/mutation hooks follow a predictable pattern: import service + types, return useQuery/useMutation with standard options.                                                         |
| **Component**      | Every component needs 'use client', proper imports, typed props interface. Enforcing this structure via generator prevents inconsistency.                                             |
| **CRUD Pages**     | CRUD is the most common pattern in business apps. A list page, create form, edit form, and detail view follow near-identical patterns. Generating these saves hours per feature.      |
| **Zod Schema**     | Schemas follow a pattern: define fields, export type inference. Generating these ensures consistent validation approach.                                                              |

### What Should NOT Be Generated?

| Artifact                | Why Not?                                                |
| ----------------------- | ------------------------------------------------------- |
| **lib/ infrastructure** | Created once, rarely changes. Not worth generating.     |
| **store/**              | Global stores are few and unique. No repeating pattern. |
| **UI components**       | Primitives are handcrafted for design consistency.      |
| **providers/**          | Created once during project setup.                      |

### Consistency Rules Enforced by Generator

1. Every module has an `index.ts` barrel export
2. Every service uses `apiClient` from `@/lib/api/client`
3. Every schema exports its `z.infer` type
4. Every hook follows the `use<Action>` naming convention
5. Every component file starts with `'use client'` directive
6. TypeScript strict mode — no `any` or `unknown` escape hatches

---

## CLI Generator Design (Phase 6)

### Architecture

```
cli/
├── package.json                   # CLI package config
├── tsconfig.json                  # TypeScript config
├── bin/
│   └── index.ts                   # Entry point (commander setup)
├── src/
│   ├── commands/
│   │   ├── create.ts              # `create` command handler
│   │   └── generate.ts            # `generate` command handler
│   ├── generators/
│   │   ├── module.ts              # Module scaffolding logic
│   │   ├── component.ts           # Component scaffolding logic
│   │   └── crud.ts                # CRUD scaffolding logic
│   ├── templates/
│   │   ├── module/                # Module template files
│   │   │   ├── index.ts.tpl
│   │   │   ├── types.ts.tpl
│   │   │   ├── service.ts.tpl
│   │   │   ├── hook.ts.tpl
│   │   │   └── schema.ts.tpl
│   │   ├── component/
│   │   │   └── component.tsx.tpl
│   │   └── crud/
│   │       ├── list-page.tsx.tpl
│   │       ├── create-page.tsx.tpl
│   │       ├── edit-page.tsx.tpl
│   │       └── detail-page.tsx.tpl
│   └── utils/
│       ├── paths.ts               # Path resolution
│       └── template.ts            # Template rendering engine
└── README.md
```

### Command Reference

| Command                                  | Description                                       |
| ---------------------------------------- | ------------------------------------------------- |
| `frontend-cli create <name>`             | Scaffold a new project from the CSR template      |
| `frontend-cli generate module <name>`    | Generate a feature module with standard structure |
| `frontend-cli generate component <Name>` | Generate a typed React component                  |
| `frontend-cli generate crud <name>`      | Generate full CRUD pages + module for a resource  |

### Design Principles

1. **Zero config** — works out of the box with sensible defaults
2. **Typed templates** — generated code is type-safe from day one
3. **Non-destructive** — never overwrites existing files
4. **Consistent naming** — PascalCase for components, kebab-case for files, camelCase for functions
5. **Extensible** — new generators can be added by creating a template + generator file
