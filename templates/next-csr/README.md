# next-csr — Next.js CSR Template

A production-ready **Client-Side Rendering** template built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, and TanStack Query. Includes pre-built auth module, RBAC guards, reusable UI components, and a CLI code generator.

---

## Tech Stack

| Package        | Version | Purpose                      |
| -------------- | ------- | ---------------------------- |
| Next.js        | 16.x    | Framework                    |
| React          | 19.x    | UI Library                   |
| TypeScript     | 5.x     | Type Safety                  |
| Tailwind CSS   | 4.x     | Styling                      |
| Zustand        | Latest  | Global State                 |
| TanStack Query | Latest  | Server State / Data Fetching |
| Zod            | 4.x     | Schema Validation            |
| Axios          | Latest  | HTTP Client                  |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Edit .env.local — set your API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=MyApp

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable               | Required | Default                     | Description                   |
| ---------------------- | -------- | --------------------------- | ----------------------------- |
| `NEXT_PUBLIC_API_URL`  | No       | `http://localhost:3001/api` | Base URL for your backend API |
| `NEXT_PUBLIC_APP_NAME` | No       | `App`                       | App display name              |

These are validated at startup using Zod. If invalid values are provided, the app will throw an error with a clear message.

---

## Folder Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth route group (login, register)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/            # Protected route group
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx
│   └── layout.tsx
│
├── components/                 # Shared, reusable components
│   ├── feedback/               # ErrorBoundary, LoadingScreen, Toast
│   ├── guards/                 # AuthGuard, RoleGuard
│   ├── layout/                 # AppShell, Header, Sidebar
│   └── ui/                     # Button, Input, Spinner
│
├── hooks/                      # Global custom hooks (useToast, etc.)
├── lib/
│   ├── api/                    # Axios client, interceptors, types
│   ├── query/                  # TanStack Query client setup
│   ├── env.ts                  # Zod env validation
│   └── permissions.ts          # Permission helpers
│
├── modules/                    # Feature modules (auth, etc.)
│   └── auth/
│       ├── components/         # LoginForm, RegisterForm
│       ├── hooks/              # useAuth
│       ├── schemas/            # Zod schemas
│       ├── services/           # API calls
│       └── types/              # TypeScript types
│
├── providers/                  # React context providers (Query, App)
├── store/                      # Zustand stores (auth, toast)
├── types/                      # Global TypeScript types
└── utils/                      # Utility functions (cn, etc.)
```

---

## Available Scripts

```bash
npm run dev       # Start dev server with Turbopack
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## Auth Flow

1. User submits login form → `auth.service.ts` calls `POST /auth/login`
2. Token stored in `auth.store.ts` (Zustand) and `localStorage`
3. Axios interceptor in `lib/api/interceptors.ts` attaches `Authorization: Bearer <token>` to every request
4. `AuthGuard` component reads store and redirects to `/login` if unauthenticated
5. `RoleGuard` checks roles/permissions before rendering protected UI

---

## CLI Code Generator

Each project has its own `cli/` directory with generators. From the project root:

```bash
# Generate a full feature module (service + hook + types + index)
npx tsx cli/bin/index.ts generate module

# Generate a UI component
npx tsx cli/bin/index.ts generate component

# Generate full CRUD (module + list page + form + service + hook)
npx tsx cli/bin/index.ts generate crud
```

If you are already inside the generated project root and want an explicit path, the equivalent command is:

```bash
npx tsx "$PWD/cli/bin/index.ts" generate module
```

If you stay outside the generated project folder, point directly to the project CLI entrypoint:

```bash
npx tsx "$PWD/<project-name>/cli/bin/index.ts" generate module
```

The generator will prompt for names interactively and scaffold files into `src/modules/<name>/`.

---

## Adding a New Module Manually

1. Create `src/modules/<name>/` with sub-folders: `components/`, `hooks/`, `schemas/`, `services/`, `types/`
2. Define Zod schemas in `schemas/<name>.schema.ts`
3. Add service functions in `services/<name>.service.ts` using the Axios client from `lib/api/client.ts`
4. Create TanStack Query hooks in `hooks/use<Name>.ts`
5. Export everything from `index.ts`
6. Add route pages in `app/(dashboard)/<name>/`

---

## Code Conventions

- **Component files**: PascalCase (`UserCard.tsx`)
- **Hook files**: camelCase, prefix `use` (`useUsers.ts`)
- **Service files**: camelCase, suffix `.service.ts`
- **Types**: interfaces preferred, suffix `.types.ts`
- **Schemas**: Zod objects, suffix `.schema.ts`
- **Stores**: Zustand with Immer patterns, suffix `.store.ts`

---

## Connecting to a Backend

This template is backend-agnostic. Point `NEXT_PUBLIC_API_URL` to any REST API. Expected API contracts:

```
POST   /auth/login       → { token, user }
POST   /auth/register    → { token, user }
GET    /auth/me          → { user }
```

For a matching fullstack setup, use the `next-ssr` template from the root CLI.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
