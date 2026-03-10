# Next.js Template Collection

A monorepo of production-ready **Next.js templates** for frontend and fullstack projects. Pick the template that fits your architecture, then use the built-in CLI to scaffold new modules and CRUD features without boilerplate.

---

## Available Templates

| Template | Path | Description |
|---|---|---|
| **next-csr** | `templates/next-csr/` | Client-Side Rendering — React + Zustand + TanStack Query. Best for SPAs that connect to a separate API server. |
| **next-ssr** | `templates/next-ssr/` | Fullstack SSR — Next.js API routes + Prisma (MySQL) + Redis + BullMQ + RBAC + Audit Logging. Best for fullstack apps with a single Next.js server. |

---

## Prerequisites

- **Node.js** 20+
- **npm** 9+ (or pnpm / yarn)
- For `next-ssr`: MySQL/MariaDB 8+ and Redis 7+

---

## Getting Started

### Using the Root CLI (Create a new project from a template)

The root `cli/` scaffolds a new project directory from one of the templates:

```bash
# From the repo root, install root CLI dependencies
cd cli
npm install
cd ..

# Run the create command
npx tsx cli/bin/index.ts create
```

The CLI will ask:
1. **Template** — choose `next-csr` or `next-ssr`
2. **Project name** — e.g. `my-app`
3. **Output directory** — where to copy the template

It then copies the selected template into a new folder and installs dependencies automatically.

---

## Template Details

### next-csr — Client-Side Rendering

Best for: teams with a separate backend (Node, Rails, Django, etc.), or migrating from Vite/CRA to Next.js.

```bash
cd templates/next-csr
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://your-backend/api
npm run dev
```

**Key features:**
- Zustand global state (auth, toast)
- TanStack Query for server state + caching
- Axios with automatic auth token injection
- AuthGuard + RoleGuard components
- Module-based folder structure
- Built-in CLI code generator

See [templates/next-csr/README.md](templates/next-csr/README.md) for the full guide.

---

### next-ssr — Fullstack SSR

Best for: teams that want the database, API, and frontend in a single Next.js codebase.

```bash
cd templates/next-ssr
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL, REDIS_URL, JWT_SECRET

npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Default credentials after seeding: `admin@example.com` / `password123`

**Key features:**
- Prisma 7 ORM with MySQL/MariaDB
- JWT auth via `httpOnly` cookies
- Role-Based Access Control (RBAC) with Permissions
- Audit logging for all write operations
- Redis rate limiting
- BullMQ background job queue
- Pino structured JSON logging
- Server Components for zero-JS data fetching
- Built-in fullstack CLI code generator

See [templates/next-ssr/README.md](templates/next-ssr/README.md) for the full guide.

---

## Per-Project CLI Generator

Each template ships with its own `cli/` that generates code inside that project. After creating a project from a template:

### next-csr generator

```bash
cd <your-project>

# Scaffold a feature module (service + hook + types + index)
npx tsx cli/bin/index.ts generate module

# Scaffold a UI component
npx tsx cli/bin/index.ts generate component

# Scaffold full CRUD (module + list + form + service + hook)
npx tsx cli/bin/index.ts generate crud
```

### next-ssr generator

```bash
cd <your-project>

# Frontend only
npx tsx cli/bin/index.ts generate frontend:module
npx tsx cli/bin/index.ts generate frontend:component
npx tsx cli/bin/index.ts generate frontend:crud

# Backend only
npx tsx cli/bin/index.ts generate backend:module
npx tsx cli/bin/index.ts generate backend:crud

# Full stack (API route + service + pages in one command)
npx tsx cli/bin/index.ts generate fullstack:crud
```

All generators are interactive — they prompt for resource names and scaffold files into the correct directories.

---

## Repository Structure

```
/
├── templates/
│   ├── next-csr/          # CSR template
│   └── next-ssr/          # SSR + fullstack template
├── cli/                   # Root CLI (create project from template)
├── docs/                  # Additional documentation
└── README.MD              # This file
```

---

## Contributing

1. Fork the repo
2. Make changes inside `templates/next-csr/` or `templates/next-ssr/`
3. Verify the build: `cd templates/<name> && npm run build`
4. Submit a PR

When adding new template features, update the corresponding `README.md` in the template directory.

---

## Quick Start

```bash
# Clone and enter template
cd templates/next-csr

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| State Management | Zustand 5 (persisted auth) |
| Server State | TanStack React Query 5 |
| HTTP Client | Axios |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Testing Library |
| Linting | ESLint + Prettier |
| Git Hooks | Husky + lint-staged |

---

## Architecture Overview

```
src/
├── app/                        # Next.js pages (routing only)
│   ├── (auth)/                 # Public routes: /login, /register
│   └── (dashboard)/            # Protected routes: /dashboard, ...
├── components/                 # Shared UI components
│   ├── ui/                     # Primitives: Button, Input, Spinner
│   ├── layout/                 # Shells: AppShell, Sidebar, Header
│   ├── feedback/               # ErrorBoundary, Toast, LoadingScreen
│   └── guards/                 # AuthGuard, RoleGuard
├── hooks/                      # Shared React hooks
├── lib/                        # Core infrastructure
│   ├── api/                    # Axios client + interceptors
│   ├── query/                  # React Query factory
│   ├── env.ts                  # Zod env validation
│   └── permissions.ts          # RBAC utilities
├── modules/                    # Feature modules (domain code)
│   └── auth/                   # Auth module (example)
│       ├── components/         # LoginForm, RegisterForm
│       ├── hooks/              # useLogin, useRegister, useLogout
│       ├── schemas/            # Zod validation schemas
│       ├── services/           # API service layer
│       ├── types/              # TypeScript interfaces
│       └── index.ts            # Public barrel export
├── providers/                  # React context providers
├── store/                      # Global Zustand stores
├── types/                      # Global TypeScript types
└── utils/                      # Pure utility functions
```

### Layer Rules

| Layer | Rule |
|-------|------|
| `app/` | Pages only. No business logic. Thin wrappers that compose module components. |
| `modules/` | Self-contained features. Cross-module imports through barrel `index.ts` only. |
| `lib/` | Infrastructure code. Feature-agnostic. Rarely changes. |
| `components/` | Shared UI. No business logic in `ui/`. |
| `store/` | Cross-cutting global state only. Feature state lives in modules. |
| `providers/` | Provider composition. Add new providers to `AppProviders.tsx`. |

---

## Authentication

### Flow

1. User visits a protected route
2. `AuthGuard` checks Zustand store for JWT token
3. No token → redirect to `/login`
4. User submits `LoginForm` → calls `POST /auth/login`
5. Token + user stored in Zustand (persisted to localStorage)
6. Redirect to `/dashboard`
7. Axios interceptor attaches token to all API requests
8. `401` response → auto-logout and redirect to `/login`

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Returns `{ user, token }` |
| POST | `/auth/register` | Creates new account |
| GET | `/auth/me` | Returns authenticated user |

### RBAC

```tsx
import { RoleGuard } from '@/components/guards/RoleGuard';

// Show only to admins
<RoleGuard roles={['admin']}>
  <AdminPanel />
</RoleGuard>

// Show only to users with specific permission
<RoleGuard permissions={['users:delete']} fallback={<p>Access denied</p>}>
  <DeleteButton />
</RoleGuard>
```

Programmatic checks:

```ts
import { hasRole, hasPermission } from '@/lib/permissions';

if (hasPermission(user, 'users:create')) {
  // show create button
}
```

---

## Error Handling

| Layer | Mechanism |
|-------|-----------|
| Global UI | `ErrorBoundary` wraps the entire app via `AppProviders` |
| API errors | Axios response interceptor shows toast + handles 401 |
| Mutations | React Query `onError` for per-mutation handling |
| Forms | Zod schemas validate before submission |
| Environment | Zod validation fails fast on missing env vars |

---

## Adding a New Feature

### Option A: Manual

1. Create `src/modules/<feature>/` with folders: `components/`, `hooks/`, `schemas/`, `services/`, `types/`
2. Create an `index.ts` barrel export
3. Add route pages in `src/app/(dashboard)/<feature>/`
4. Add nav item in `src/components/layout/Sidebar.tsx`

### Option B: CLI Generator

```bash
# Generate a full feature module
npx frontend-cli generate module product

# Generate a component
npx frontend-cli generate component DataTable

# Generate full CRUD (module + pages)
npx frontend-cli generate crud product
```

---

## CLI Generator

Located in `cli/`. Scaffolds code following the architecture conventions.

### Setup

```bash
cd cli
npm install
npm run link-cli
```

### Commands

| Command | Description |
|---------|-------------|
| `frontend-cli create <name>` | New project from template |
| `frontend-cli generate module <name>` | Feature module scaffold |
| `frontend-cli generate component <Name>` | Typed React component |
| `frontend-cli generate crud <name>` | Full CRUD: module + list/create/detail/edit pages |
| `frontend-cli g <type> <name>` | Shorthand alias |

### Module Generator Output

```
src/modules/<name>/
├── components/
├── hooks/
│   └── use<Name>.ts         # Query + mutation hooks
├── schemas/
│   └── <name>.schema.ts     # Zod schemas + inferred types 
├── services/
│   └── <name>.service.ts    # Typed API service
├── types/
│   └── <name>.types.ts      # TypeScript interfaces
└── index.ts                  # Barrel export
```

### CRUD Generator Output

All of the above, plus:

```
src/app/(dashboard)/<names>/
├── page.tsx                  # List page with table
├── create/page.tsx           # Create form page
├── [id]/page.tsx             # Detail view page
└── [id]/edit/page.tsx        # Edit form page
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |

---

## Environment Variables

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_APP_NAME` | No | App display name (default: "App") |

Environment variables are validated at startup using Zod. Missing required variables cause an immediate error with a clear message.

---

## Project Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `LoginForm.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAuth.ts`)
- Services: `kebab-case.service.ts` (e.g., `auth.service.ts`)
- Schemas: `kebab-case.schema.ts` (e.g., `auth.schema.ts`)
- Types: `kebab-case.types.ts` (e.g., `auth.types.ts`)
- Stores: `kebab-case.store.ts` (e.g., `auth.store.ts`)

### Import Order
1. React / Next.js
2. Third-party libraries
3. `@/lib/` infrastructure
4. `@/components/` shared components
5. `@/store/` global stores
6. `@/hooks/` shared hooks
7. Relative module imports

### TypeScript
- Strict mode enabled
- No `any` — use proper types or generics
- Export types from barrel `index.ts`
- Use `z.infer<typeof schema>` for form types

---

## Architecture Decisions

| Decision | Reasoning |
|----------|-----------|
| CSR over SSR | Backend is a separate JWT service. No SSR data fetching needed. |
| Zustand over Context | Accessible outside React (interceptors). No provider nesting. Built-in persist. |
| Feature modules | 10 devs can work on different features without conflicts. Clear ownership. |
| Barrel exports | Clean public APIs. Internal refactoring doesn't break consumers. |
| Zod for env + forms | Single validation library. Type inference. Fail-fast on misconfiguration. |
| Axios over fetch | Interceptors for auth. Request/response transformation. Better error typing. |
| React Query | Caching, dedup, background refetch. Separates server state from client state. |

---

## Full Documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation including:
- Complete folder structure explanation
- Layer responsibilities
- Authentication flow diagrams
- RBAC system design
- Error handling strategy
- Generator analysis (what to generate and why)
- CLI generator design and architecture
