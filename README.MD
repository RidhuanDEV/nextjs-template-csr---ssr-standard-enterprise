# Next.js Enterprise Template Platform

A monorepo of **production-ready Next.js templates** with enterprise-grade code generators. Create a new project, scaffold modules, CRUD pages, and audit quality — all from the CLI.

---

## Available Templates

| Template     | Path                  | Description                                                                                                       |
| ------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **next-csr** | `templates/next-csr/` | Client-Side Rendering — React 19 + Zustand 5 + TanStack Query 5 + Axios. Best for SPAs that call an external API. |
| **next-ssr** | `templates/next-ssr/` | Fullstack SSR — Next.js API routes + Prisma 7 (MariaDB) + Redis + BullMQ + RBAC + Audit Logging.                  |

---

## Prerequisites

- **Node.js** 20+
- **npm** 9+ (or pnpm / yarn)
- For `next-ssr`: Docker (for MariaDB + Redis via docker-compose)

---

## Quick Start — Create a New Project

```bash
# From the frontend package root
cd frontend
cd cli && npm install && cd ..

# 2. Scaffold a new project (interactive)
npx tsx cli/bin/index.ts create my-app

# 3. Or pass the template flag directly
npx tsx cli/bin/index.ts create my-app --template csr
npx tsx cli/bin/index.ts create my-app --template ssr
```

If you stay in the monorepo root instead of changing into `frontend/`, call the root create CLI explicitly:

```bash
npx tsx "$PWD/frontend/cli/bin/index.ts" create my-app --template csr
npx tsx "$PWD/frontend/cli/bin/index.ts" create my-app --template ssr
```

> Note: if `tsx` is not already available in your shell, `npx` may prompt once to download it on first run.

The CLI copies the selected template, updates `package.json`, and prints next steps.

---

## Template Setup

### next-csr — Client-Side Rendering

```bash
cd my-app
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://your-backend/api
npm run dev
```

### next-ssr — Fullstack SSR (with Docker)

```bash
cd my-app
npm install
cp .env.example .env

# Start infrastructure (MariaDB + Redis)
docker compose -f docker-compose.dev.yml up -d

# Setup database
npm run db:generate
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

Default credentials after seeding: `admin@example.com` / `admin123`

#### Docker Compose Services

| Service | Port | Description           |
| ------- | ---- | --------------------- |
| MariaDB | 3306 | Primary database      |
| Redis   | 6379 | Cache + session store |

---

## Per-Project Code Generator

Each template ships with its own `cli/` for generating modules and CRUD pages.

### CSR Generator Commands

```bash
cd my-app

# Generate a feature module (types + services + hooks + schemas + constants)
npx tsx cli/bin/index.ts generate module product

# Generate CRUD pages (list + create + detail + edit)
npx tsx cli/bin/index.ts generate crud product

# Generate a component (module-scoped or global)
npx tsx cli/bin/index.ts generate component DataTable --dir product
npx tsx cli/bin/index.ts generate component GlobalSearch

# Audit module quality
npx tsx cli/bin/index.ts audit
npx tsx cli/bin/index.ts audit --module product
```

If you stay in the monorepo root after scaffolding, call the project CLI directly:

```bash
npx tsx "$PWD/my-app/cli/bin/index.ts" generate module product
npx tsx "$PWD/my-app/cli/bin/index.ts" audit --module product
```

### SSR Generator Commands

```bash
cd my-app

# Backend module (service + query + schema + dto + mapper + policy + tests)
npx tsx cli/bin/index.ts generate backend module product

# Backend CRUD (API routes with validation + pagination)
# If the backend module does not exist yet, the generator bootstraps it automatically first.
npx tsx cli/bin/index.ts generate backend crud product

# Frontend module (types + services + hooks + schemas)
npx tsx cli/bin/index.ts generate frontend module product

# Frontend CRUD pages
npx tsx cli/bin/index.ts generate frontend crud product

# Fullstack CRUD (backend + frontend in one command)
npx tsx cli/bin/index.ts generate crud product

# Audit all modules
npx tsx cli/bin/index.ts audit
```

If you stay in the monorepo root after scaffolding, call the project CLI directly:

```bash
npx tsx "$PWD/my-app/cli/bin/index.ts" generate backend module product
npx tsx "$PWD/my-app/cli/bin/index.ts" generate crud product
npx tsx "$PWD/my-app/cli/bin/index.ts" audit
```

### What Gets Generated

**CSR module** (`generate module product`):

```
src/modules/product/
├── components/
├── constants/
│   └── product.permissions.ts
├── forms/
├── hooks/
│   └── useProduct.ts          # React Query CRUD hooks
├── schemas/
│   └── product.schema.ts      # Zod validation schemas
├── services/
│   └── product.service.ts     # Typed Axios API client
├── types/
│   └── product.types.ts       # TypeScript interfaces
└── index.ts                   # Barrel export with FRAGMENT markers
```

**SSR backend module** (`generate backend module product`):

```
src/modules/product/server/
├── constants/
│   ├── product.permissions.ts
│   └── product.events.ts
├── dto/
│   └── product-response.dto.ts
├── mappers/
│   └── product.mapper.ts       # Model ↔ Response mapping
├── policies/
│   └── product.policy.ts       # RBAC access policies
├── queries/
│   └── product.query.ts        # Prisma query config + sort validation
├── schemas/
│   └── product.schema.ts       # Zod schemas (create + update + filter)
├── services/
│   └── product.service.ts      # Business logic with audit + cache
├── testing/
│   └── product.prisma.mock.ts  # Prisma delegate mock
├── tests/
│   ├── product.service.test.ts
│   └── product.query.test.ts
└── index.ts                    # Barrel export
```

**SSR backend CRUD flow** (`generate backend crud product`):

1. Check whether `src/modules/product/server/` already has the minimum backend scaffold.
2. If missing, automatically run the equivalent of `generate backend module product` first.
3. Generate `src/app/api/products/route.ts` and `src/app/api/products/[id]/route.ts`.

This keeps the UX simple for the most common case, while still preserving separation of concerns:

- `generate backend module <name>` for non-CRUD modules or custom backend-only features
- `generate backend crud <name>` for the common “create module + create REST endpoints” workflow

---

## Architecture Overview

### CSR Structure

```
src/
├── app/                        # Next.js pages (routing only)
│   ├── (auth)/                 # Public routes: /login, /register
│   └── (dashboard)/            # Protected routes
├── components/                 # Shared UI components
│   ├── ui/                     # Button, Input, Spinner
│   ├── layout/                 # AppShell, Sidebar, Header
│   ├── feedback/               # ErrorBoundary, Toast, LoadingScreen
│   └── guards/                 # AuthGuard, RoleGuard
├── lib/                        # Infrastructure
│   ├── api/                    # Axios client + interceptors
│   ├── query/                  # React Query factory
│   ├── constants/              # Auto-generated modules + permissions
│   └── env.ts                  # Zod env validation
├── modules/                    # Feature modules (domain code)
├── providers/                  # React context providers
├── store/                      # Zustand global stores
└── utils/                      # Pure utility functions
```

### SSR Structure

```
src/
├── app/                        # Next.js pages + API routes
│   ├── (auth)/                 # Public routes
│   ├── (dashboard)/            # Protected routes
│   └── api/                    # REST API endpoints
├── components/                 # Shared UI
├── lib/                        # Infrastructure
│   ├── api/                    # Client-side API helpers
│   ├── constants/              # Permissions, modules, audit actions
│   └── query/                  # React Query factory
├── modules/                    # Feature modules
│   └── <feature>/
│       ├── types/              # Shared type definitions
│       ├── schemas/            # Shared Zod schemas
│       └── server/             # Backend logic
│           ├── constants/      # Permissions + domain events
│           ├── dto/            # Data transfer objects
│           ├── mappers/        # Model ↔ Response mappers
│           ├── policies/       # RBAC access control
│           ├── queries/        # Prisma query configuration
│           ├── schemas/        # Server-side validation
│           ├── services/       # Business logic
│           └── tests/          # Unit tests
├── server/                     # Server infrastructure
│   ├── auth/                   # JWT + session management
│   ├── cache/                  # Redis client
│   ├── db/                     # Prisma client
│   ├── logger/                 # Pino structured logging
│   ├── middleware/             # API middleware chain
│   └── queue/                  # BullMQ job processing
└── middleware.ts               # Next.js edge middleware
```

---

## Generator Features

### Fragment-Aware Merge

Generators use `/* FRAGMENT:<name> */` markers in barrel files. When you run a generator on a module that already has files, new exports are **merged** into existing fragments instead of overwriting.

### Constants Auto-Update

Running `generate module` automatically updates:

- `src/lib/constants/modules.constants.ts` — registers the module
- `src/lib/constants/permissions.constants.ts` (CSR) or `src/lib/constants/permissions.ts` (SSR) — registers CRUD permissions

### 12-Variant Naming

All generators produce correct casing automatically using the `pluralize` library:

| Variable          | Example (input: `blog-post`) |
| ----------------- | ---------------------------- |
| `rawName`         | `blog-post`                  |
| `nameKebab`       | `blog-post`                  |
| `nameSnake`       | `blog_post`                  |
| `nameCamel`       | `blogPost`                   |
| `Name`            | `BlogPost`                   |
| `namePlural`      | `blogPosts`                  |
| `namePluralKebab` | `blog-posts`                 |
| `namePluralSnake` | `blog_posts`                 |
| `NamePlural`      | `BlogPosts`                  |
| `NAME`            | `BLOG_POST`                  |
| `NAME_PLURAL`     | `BLOG_POSTS`                 |

### Audit Mode

```bash
npx tsx cli/bin/index.ts audit
```

Analyzes all generated modules for:

- **Structure** — missing directories, barrel exports, CRUD pages
- **Quality** — `any` types, console.log statements, empty files
- **Security** — hardcoded credentials, missing policies
- **Performance** — (SSR) missing caching, query optimization

Outputs an Enterprise Readiness Score (0–100) per module and overall.

### Manual Follow-up After Generation

Some pieces are intentionally **not** auto-generated because they depend on business rules or infrastructure choices.

#### Always review manually

- **Prisma model** — add the model to `prisma/schema.prisma`, then run `npm run db:generate` and your migration flow.
- **Policy rules** — generated policies start permissive so you can wire ownership, tenant, and workflow restrictions safely.
- **Query filters** — extend query builders when you need date ranges, status filters, relation filters, or tenant scoping.
- **Mapper rules** — add relation flattening, computed fields, or response shaping specific to your API contract.

#### Use queue manually when the job is asynchronous

Use `src/server/queue/index.ts` when the action should continue **after** the HTTP response, for example:

- sending email
- firing webhooks
- exporting reports
- resizing images
- syncing with external providers

Keep synchronous validation, authorization, and database writes in the request/transaction path.

#### Infra guidance lives in code comments too

The SSR template now includes inline comments in key extension-point files so developers get “how to use” and “when to use” guidance directly inside:

- `src/server/queue/index.ts`
- `src/server/middleware/audit-log.ts`
- `src/server/middleware/error-handler.ts`
- `src/server/logger/index.ts`
- generated backend service/query/policy/mapper files

---

## Tech Stack

| Category     | CSR                      | SSR                             |
| ------------ | ------------------------ | ------------------------------- |
| Framework    | Next.js 16 (App Router)  | Next.js 16 (App Router)         |
| Language     | TypeScript (strict)      | TypeScript (strict)             |
| Styling      | Tailwind CSS 4           | Tailwind CSS 4                  |
| State        | Zustand 5                | Zustand 5                       |
| Server State | TanStack React Query 5   | TanStack React Query 5          |
| HTTP Client  | Axios                    | Axios (client) + fetch (server) |
| Forms        | React Hook Form + Zod    | React Hook Form + Zod           |
| ORM          | —                        | Prisma 7 (MariaDB)              |
| Auth         | JWT (external API)       | JWT (jose, httpOnly cookies)    |
| Cache        | —                        | Redis (ioredis)                 |
| Queue        | —                        | BullMQ                          |
| Logging      | —                        | Pino (structured JSON)          |
| Testing      | Vitest + Testing Library | Vitest + Testing Library        |
| Linting      | ESLint + Prettier        | ESLint + Prettier               |

---

## Scripts Reference

### CSR Scripts

| Script              | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start dev server         |
| `npm run build`     | Production build         |
| `npm run lint`      | Run ESLint (src + cli)   |
| `npm run format`    | Prettier format          |
| `npm run test`      | Vitest (watch mode)      |
| `npm run test:run`  | Vitest (single run)      |
| `npm run typecheck` | TypeScript type checking |

### SSR Scripts

| Script                | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start dev server         |
| `npm run build`       | Production build         |
| `npm run db:generate` | Generate Prisma client   |
| `npm run db:push`     | Push schema to database  |
| `npm run db:migrate`  | Run Prisma migrations    |
| `npm run db:seed`     | Seed database            |
| `npm run db:studio`   | Open Prisma Studio       |
| `npm run lint`        | Run ESLint               |
| `npm run test`        | Vitest (watch mode)      |
| `npm run typecheck`   | TypeScript type checking |

---

## Repository Structure

```
/
├── cli/                       # Root CLI — create projects from templates
│   ├── bin/index.ts           # Entry point (create-next-template)
│   └── src/commands/create.ts # Template scaffolding logic
├── templates/
│   ├── next-csr/              # CSR template + CLI generator
│   │   ├── cli/               # CSR code generator
│   │   └── src/               # Application source
│   └── next-ssr/              # SSR template + CLI generator
│       ├── cli/               # SSR code generator
│       ├── prisma/            # Prisma schema + seed
│       └── src/               # Application source
├── docs/                      # Analysis + architecture docs
└── README.MD                  # This file
```

---

## Contributing

1. Fork the repo
2. Make changes inside `templates/next-csr/` or `templates/next-ssr/`
3. Verify: `npm run typecheck && npm run lint && npm run test:run`
4. Submit a PR

When adding new generator templates, update tests and run the audit command to verify quality.
