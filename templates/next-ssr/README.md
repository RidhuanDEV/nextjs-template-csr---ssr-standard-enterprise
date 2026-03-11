# next-ssr — Next.js Fullstack SSR Template

A production-ready **Server-Side Rendering + fullstack** template built with Next.js 16 App Router, Prisma 7 (MySQL/MariaDB), Redis, BullMQ, and JWT authentication. Includes a complete RBAC system, audit logging, rate limiting, background jobs, and a fullstack CLI code generator.

---

## Tech Stack

| Package         | Version | Purpose                 |
| --------------- | ------- | ----------------------- |
| Next.js         | 16.x    | Framework + API Routes  |
| React           | 19.x    | UI Library              |
| TypeScript      | 5.x     | Type Safety             |
| Tailwind CSS    | 4.x     | Styling                 |
| Prisma          | 7.x     | ORM                     |
| MariaDB / MySQL | 8+      | Database                |
| Redis           | 7+      | Cache + Rate Limiting   |
| BullMQ          | 5.x     | Background Jobs         |
| Pino            | 10.x    | Structured Logging      |
| Zod             | 4.x     | Schema + Env Validation |
| jose            | 6.x     | JWT (Edge-compatible)   |
| bcryptjs        | 3.x     | Password Hashing        |

---

## Prerequisites

- **Node.js** 20+
- **MySQL or MariaDB** 8+ running locally
- **Redis** 7+ running locally (or Docker)

### Quick setup with Docker

```bash
docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=nextssr -p 3306:3306 mysql:8
docker run -d --name redis -p 6379:6379 redis:7
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your database + Redis credentials (see section below)

# 4. Generate Prisma client
npm run db:generate

# 5. Run migrations
npm run db:migrate

# 6. Seed default data (admin user + roles + permissions)
npm run db:seed

# 7. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Default credentials after seeding:**

- Email: `admin@example.com`
- Password: `password123`

---

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
# MySQL / MariaDB connection
DATABASE_URL="mysql://root:password@localhost:3306/nextssr"

# Redis URL
REDIS_URL="redis://localhost:6379"

# JWT Secret — MUST be at least 32 characters
JWT_SECRET="your-super-secret-key-at-least-32-chars"

# App
NEXT_PUBLIC_APP_NAME="MyApp"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

All variables are validated at startup using Zod. Missing or invalid values will throw a descriptive error.

---

## Available Scripts

```bash
npm run cli:build     # Compile cli/ to cli/dist for node execution
npm run dev           # Start dev server with Turbopack
npm run build         # Production build
npm run start         # Start production server
npm run typecheck     # Run TypeScript strict compilation
npm run lint          # Run ESLint for src/ and cli/
npm run lint:fix      # Auto-fix lint issues where possible
npm run test          # Run Vitest once

npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run database migrations (dev)
npm run db:push       # Push schema without migration (quick dev)
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database with default roles + admin user
npm run db:reset      # Reset database (WARNING: drops all data)
```

---

## Folder Structure

```
prisma/
├── schema.prisma               # Database schema (User, Role, Permission, AuditLog)
├── seed.ts                     # Database seeder
└── migrations/                 # Auto-generated migration files

src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, Register pages
│   ├── (dashboard)/            # Protected dashboard
│   │   ├── dashboard/          # Home page
│   │   ├── users/              # User management CRUD
│   │   └── roles/              # Role management CRUD
│   └── api/                    # REST API route handlers
│       ├── auth/               # login, logout, register, me
│       ├── users/              # GET, POST, PATCH, DELETE
│       └── roles/              # GET, POST, PATCH, DELETE
│
├── components/                 # Shared UI components
│   ├── feedback/               # ErrorBoundary, Toast
│   ├── layout/                 # Header, Sidebar, LogoutButton
│   └── ui/                     # Button, Input, Select, Spinner
│
├── lib/
│   ├── api/                    # Fetch helpers and types
│   ├── constants/              # Permission keys, audit events, etc.
│   ├── query/                  # Query builder, pagination, parser
│   └── env.ts                  # Zod env validation
│
├── modules/                    # Feature modules
│   ├── auth/                   # Auth schemas, services, types
│   ├── user/                   # User DTO, queries, schemas, services
│   ├── role/                   # Role DTO, queries, schemas, services
│   └── <resource>/             # Generated CRUD modules
│       ├── client/             # Forms, adapters, client schemas, components
│       ├── server/             # Services, dto, queries, permissions, events
│       └── types/              # Shared response/entity types
│
├── server/                     # Server-only utilities
│   ├── auth/                   # JWT helpers, session management, permissions
│   ├── cache/                  # Redis client
│   ├── db/                     # Prisma client singleton (MariaDB adapter)
│   ├── logger/                 # Pino logger
│   ├── middleware/             # Audit log, error handler, rate limiter, request context
│   └── queue/                  # BullMQ queue setup
│
├── generated/prisma/           # Auto-generated — DO NOT EDIT
├── middleware.ts               # Next.js middleware — JWT auth + route protection
├── store/                      # Zustand stores (client-side state)
├── types/                      # Global TypeScript types
└── utils/                      # Utility functions
```

---

## Auth & RBAC Flow

1. `POST /api/auth/login` → validates credentials → issues JWT (stored in `httpOnly` cookie)
2. `middleware.ts` (Next.js middleware) intercepts every request, verifies JWT, rejects unauthenticated requests
3. User has a **Role**, and each Role has many **Permissions**
4. Permissions are checked via `server/auth/permissions.ts` using permission keys defined in `lib/constants/permissions.ts`
5. Dashboard pages are **Server Components** — they call server-side services directly (no client fetch needed)
6. Form actions are **Client Components** — they call API routes via `fetch()`

### Default Roles & Permissions

| Role    | Permissions                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------- |
| `admin` | All permissions (users:read, users:write, users:delete, roles:read, roles:write, roles:delete) |
| `user`  | users:read                                                                                     |

---

## API Routes

| Method | Path                 | Auth              | Description            |
| ------ | -------------------- | ----------------- | ---------------------- |
| POST   | `/api/auth/login`    | Public            | Login, get JWT cookie  |
| POST   | `/api/auth/register` | Public            | Register new user      |
| GET    | `/api/auth/me`       | Auth              | Current user info      |
| POST   | `/api/auth/logout`   | Auth              | Clear JWT cookie       |
| GET    | `/api/users`         | Auth + Permission | List users (paginated) |
| POST   | `/api/users`         | Auth + Permission | Create user            |
| GET    | `/api/users/:id`     | Auth + Permission | Get user by ID         |
| PATCH  | `/api/users/:id`     | Auth + Permission | Update user            |
| DELETE | `/api/users/:id`     | Auth + Permission | Delete user            |
| GET    | `/api/roles`         | Auth + Permission | List roles             |
| POST   | `/api/roles`         | Auth + Permission | Create role            |
| GET    | `/api/roles/:id`     | Auth + Permission | Get role by ID         |
| PATCH  | `/api/roles/:id`     | Auth + Permission | Update role            |
| DELETE | `/api/roles/:id`     | Auth + Permission | Delete role            |

---

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // bcrypt hashed
  roleId    String
  role      Role     @relation(...)
  auditLogs AuditLog[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  permissions Permission[]
  users       User[]
}

model Permission {
  id    String @id @default(cuid())
  key   String @unique  // e.g. "users:read"
  roles Role[]
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String
  resource   String
  resourceId String?
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
}
```

---

## Background Jobs (BullMQ)

The queue is configured in `src/server/queue/index.ts`. Add new jobs:

```typescript
import { appQueue } from "@/server/queue";

// Enqueue a job
await appQueue.add("send-email", {
  to: "user@example.com",
  subject: "Welcome",
});
```

Add a worker in the same file to process jobs.

---

## Audit Logging

Every write API call automatically logs to the `AuditLog` table via `server/middleware/audit-log.ts`. Fields recorded: `userId`, `action`, `resource`, `resourceId`, `ipAddress`, `userAgent`, `metadata`.

---

## Rate Limiting

Rate limiting is applied in API routes using Redis via `server/middleware/rate-limit.ts`. Default: 100 requests per minute per IP.

---

## CLI Code Generator

Each project has its own `cli/` directory. From the project root:

```bash
# Development mode (no build step required)
npx tsx cli/bin/index.ts generate module product

# Compile once, then use the dist entrypoint
npm run cli:build
node cli/dist/index.js generate crud product

# Generate a client component inside an existing module
npx tsx cli/bin/index.ts generate component ProductSummaryCard --dir product

# Generate only the server or client side
npx tsx cli/bin/index.ts generate backend module product
npx tsx cli/bin/index.ts generate frontend module product

# Opt into a shared merged schema file under src/modules/<name>/schemas
npx tsx cli/bin/index.ts generate crud product --merge
```

By default the generator emits a split enterprise layout:

```text
src/modules/product/
├── client/
│   ├── adapters/
│   ├── components/
│   ├── forms/
│   ├── schemas/
│   └── tests/
├── server/
│   ├── constants/
│   ├── dto/
│   ├── queries/
│   ├── schemas/
│   ├── services/
│   ├── testing/
│   └── tests/
└── types/
```

Server pages call services directly. Browser forms use a typed HTTP adapter and Zod validation.

---

## Generated CRUD Migration Workflow

Use this checklist after running `generate crud <name>`:

```bash
# 1. Build the CLI when you want to execute the compiled entrypoint
npm run cli:build

# 2. Generate the module
node cli/dist/index.js generate crud product

# 3. Add the Prisma model and then run the migration
npm run db:migrate -- --name add-products

# 4. Refresh Prisma client types
npm run db:generate

# 5. Validate the whole workspace
npm run typecheck
npm run lint
npm run test
```

Then complete the remaining integration work:

1. Add the new Prisma model to `prisma/schema.prisma`
2. Seed or assign the generated permission constants from `src/modules/<name>/server/constants/<name>.permissions.ts`
3. Add a sidebar entry to `src/components/layout/Sidebar.tsx`
4. Review any generated `.gen-conflict` files before deleting them
5. Replace the starter fields (`name`, `description`) if your domain needs different attributes

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a random 64-character string
- [ ] Set strong database password
- [ ] Configure Redis with authentication (`requirepass`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your domain
- [ ] Review rate limiting thresholds
- [ ] Set up log aggregation (Pino outputs JSON — works with Datadog, Loki, etc.)
- [ ] Run `npm run db:migrate` with production `DATABASE_URL`
