# Analisis Generator — Next-SSR Template

> Tanggal analisis: 10 Maret 2026  
> Scope: `templates/next-ssr/cli/src/generators/`

---

## Daftar Isi

1. [Gambaran Umum Generator](#1-gambaran-umum-generator)
2. [Struktur File Generator](#2-struktur-file-generator)
3. [Analisis Backend Generator](#3-analisis-backend-generator)
   - [backend/module.ts](#31-backendmodulets)
   - [backend/crud.ts](#32-backendcrudts)
4. [Analisis Fullstack Generator](#4-analisis-fullstack-generator)
   - [fullstack/crud.ts](#41-fullstackcrudts)
5. [Analisis Frontend Generator](#5-analisis-frontend-generator)
   - [frontend/module.ts](#51-frontendmodulets)
   - [frontend/crud.ts](#52-frontendcrudts)
   - [frontend/component.ts](#53-frontendcomponentts)
6. [Analisis Utilitas](#6-analisis-utilitas)
   - [utils/paths.ts](#61-utilspathsts)
   - [utils/template.ts](#62-utilstemplatets)
7. [Struktur Output Generator](#7-struktur-output-generator)
8. [Temuan Bug dan Isu](#8-temuan-bug-dan-isu)
9. [Rekomendasi Perbaikan](#9-rekomendasi-perbaikan)

---

## 1. Gambaran Umum Generator

Generator CLI di `next-ssr` dibagi menjadi tiga kelompok:

| Generator            | Command                              | Fungsi                                               |
| -------------------- | ------------------------------------ | ---------------------------------------------------- |
| `backend/module`     | `generate backend module <name>`     | Scaffold modul backend (service, schema, query, DTO) |
| `backend/crud`       | `generate backend crud <name>`       | Scaffold backend module + API routes                 |
| `frontend/module`    | `generate frontend module <name>`    | Scaffold modul frontend (types, schemas)             |
| `frontend/crud`      | `generate frontend crud <name>`      | Scaffold frontend module + halaman CRUD              |
| `frontend/component` | `generate frontend component <name>` | Scaffold komponen React                              |
| `fullstack/crud`     | `generate crud <name>`               | Jalankan backend crud + frontend crud sekaligus      |

### Rantai panggilan antar generator

```
generate crud <name>
  └── generateFullstackCrud(name)
        ├── generateBackendCrud(name)
        │     └── generateBackendModule(name)   ← modul backend
        │           (dto, schema, query, service, index)
        │     + API routes (route.ts, [id]/route.ts)
        │
        └── generateFrontendCrud(name)
              └── generateFrontendModule(name)  ← modul frontend
                    (types, schema, index)
              + Pages (list, create, edit, delete)
```

---

## 2. Struktur File Generator

```
cli/src/generators/
├── backend/
│   ├── module.ts       # Scaffold src/modules/{name}/ (backend)
│   └── crud.ts         # Scaffold src/app/api/{namePlural}/ + panggil module
├── frontend/
│   ├── module.ts       # Scaffold src/modules/{name}/ (frontend)
│   ├── crud.ts         # Scaffold src/app/(dashboard)/{namePlural}/ + panggil module
│   └── component.ts    # Scaffold komponen tunggal di modules/{module}/components/
└── fullstack/
    └── crud.ts         # Orkestrasi: backend crud → frontend crud
```

---

## 3. Analisis Backend Generator

### 3.1 `backend/module.ts`

**File yang dihasilkan** (untuk input `name = "product"`):

```
src/modules/product/
├── dto/
│   └── product-response.dto.ts
├── schemas/
│   └── product.schema.ts
├── queries/
│   └── product.query.ts
├── services/
│   └── product.service.ts
└── index.ts
```

**Kualitas template:**

| File                         | Konten                                       | Kualitas                                                  |
| ---------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `dto/{name}-response.dto.ts` | Interface response + mapper function         | ✅ Solid — import dari `@prisma/client`, mapper typed     |
| `schemas/{name}.schema.ts`   | Zod: create, update (partial), search        | ✅ Solid — includes pagination, sort, order params        |
| `queries/{name}.query.ts`    | `QueryBuilder` dengan search/sort/pagination | ✅ Sesuai arsitektur runtime                              |
| `services/{name}.service.ts` | CRUD operations + cache + audit log + logger | ✅ Sangat lengkap — integrated dengan semua infrastruktur |
| `index.ts`                   | Re-export services, schemas, types           | ✅ Barrel export yang bersih                              |

**Integrasi infrastruktur di service template:**

```typescript
import { prisma } from "@/server/db/prisma";
import {
  cacheDel,
  cacheDelPattern,
  cacheGet,
  cacheSet,
} from "@/server/cache/redis";
import { createAuditLog } from "@/server/middleware/audit-log";
import { createLogger } from "@/server/logger";
import { paginate } from "@/lib/query/pagination";
```

Semua import valid dan sesuai dengan runtime arsitektur ✅

**Catatan path di backend/module.ts:**

```typescript
const moduleDir = path.join(resolveServerDir(), "..", "modules", name);
```

Ini menggunakan `resolveServerDir()` lalu naik 1 level — fragile. Seharusnya menggunakan `resolveModulesDir()` langsung (lihat issue #3).

---

### 3.2 `backend/crud.ts`

**File yang dihasilkan** (untuk input `name = "product"`):

```
src/app/api/products/
├── route.ts         # GET (list) + POST (create)
└── [id]/
    └── route.ts     # GET (detail) + PATCH (update) + DELETE
```

**Kualitas template:**

| Aspek            | Nilai                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| Auth guard       | ✅ `requireSession()` di semua handler                                             |
| Permission check | ✅ `requirePermission(session, 'products:read')` — sesuai konvensi RBAC            |
| Error handling   | ✅ `handleApiError(error)` — konsisten                                             |
| Request parsing  | ✅ `search{{Name}}Schema.parse(searchParams)` + `create{{Name}}Schema.parse(body)` |
| Response format  | ✅ `NextResponse.json()` dengan status code tepat                                  |
| Session actor    | ✅ `session.sub` dipakai sebagai `actorId` di service                              |

**Contoh output `route.ts` (list):**

```typescript
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, "products:read");

    const { searchParams } = new URL(request.url);
    const params = searchProductSchema.parse(Object.fromEntries(searchParams));
    const result = await listProducts(params);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

Pola ini **identik** dengan implementasi runtime di `src/app/api/users/route.ts` dan `src/app/api/roles/route.ts` ✅ — tidak ada drift.

---

## 4. Analisis Fullstack Generator

### 4.1 `fullstack/crud.ts`

**Kode generator:**

```typescript
export async function generateFullstackCrud(name: string): Promise<void> {
  await generateBackendCrud(name);
  await generateFrontendCrud(name);
}
```

Generator ini adalah **thin orchestrator** — sangat sederhana, hanya memanggil backend + frontend secara berurutan.

**Reminder yang diprint ke console:**

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Add permissions
4. Add sidebar navigation
5. Fill in TODO placeholders

**⚠️ Bug Kritis — Konflik Direktori** (lihat detail di Bagian 8, Issue #2):

Saat `generateFullstackCrud` berjalan:

1. `generateBackendModule` menulis `src/modules/{name}/schemas/{name}.schema.ts` (backend schema — ada `searchSchema`)
2. `generateFrontendModule` mencoba menulis `src/modules/{name}/schemas/{name}.schema.ts` (frontend schema — ada form validators)
3. `writeFileSafe` **melewati** file frontend schema karena file backend sudah ada

**Akibat:** Developer tidak mendapat frontend schema. File `index.ts` juga dari backend, bukan frontend — tidak meng-export `Create{Name}Payload` dan `Update{Name}Payload` yang dibutuhkan frontend forms.

---

## 5. Analisis Frontend Generator

### 5.1 `frontend/module.ts`

**File yang dihasilkan** (untuk `name = "product"`):

```
src/modules/product/
├── components/          # Direktori kosong (untuk component generator)
├── types/
│   └── product.types.ts
├── schemas/
│   └── product.schema.ts
└── index.ts
```

**Konten template:**

| File                       | Konten                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| `types/{name}.types.ts`    | Interface: `{Name}`, `Create{Name}Payload`, `Update{Name}Payload`  |
| `schemas/{name}.schema.ts` | Zod schema untuk form (`create{Name}Schema`, `update{Name}Schema`) |
| `index.ts`                 | Re-export types + schemas                                          |

**Perbedaan schema frontend vs backend:**

|                      | Frontend Schema               | Backend Schema                    |
| -------------------- | ----------------------------- | --------------------------------- |
| `create{Name}Schema` | ✅ Ada                        | ✅ Ada                            |
| `update{Name}Schema` | ✅ Ada (independen)           | ✅ Ada (`.partial()` dari create) |
| `search{Name}Schema` | ❌ Tidak ada                  | ✅ Ada (pagination, sort, dll)    |
| Tipe nilai `create`  | Form values (string dominant) | API input (dapat mixed types)     |

---

### 5.2 `frontend/crud.ts`

**File yang dihasilkan** (untuk `name = "product"`):

```
src/app/(dashboard)/products/
├── page.tsx                    # List page (server component)
├── ProductsTable.tsx           # Table + search (client component)
├── create/
│   ├── page.tsx
│   └── CreateProductForm.tsx   # Create form (client component)
└── [id]/
    ├── page.tsx                # Edit page (server component)
    ├── EditProductForm.tsx     # Edit form (client component)
    └── DeleteProductButton.tsx # Delete button (client component)
```

**Kualitas template:**

| File                     | Implementasi                                    | Kualitas                         |
| ------------------------ | ----------------------------------------------- | -------------------------------- |
| `page.tsx` (list)        | Server component, fetch via HTTP ke API sendiri | ⚠️ Anti-pattern (lihat Issue #5) |
| `{Name}sTable.tsx`       | Client component, search + pagination           | ✅ Fungsional                    |
| `CreateProductForm.tsx`  | `Object.fromEntries(formData)` → fetch POST     | ⚠️ Tanpa client-side validation  |
| `[id]/page.tsx`          | Server component, fetch + `notFound()`          | ✅ Solid                         |
| `Edit{Name}Form.tsx`     | `Object.fromEntries(formData)` → fetch PATCH    | ⚠️ Tanpa client-side validation  |
| `Delete{Name}Button.tsx` | `window.confirm()` → fetch DELETE               | ⚠️ Aksesibilitas rendah          |

**Dependency yang dibutuhkan (harus ada di proyek):**

- `@/components/feedback/Toast` — `useToast` hook
- `@/components/feedback/Toast` — perlu di-import di setiap form

---

### 5.3 `frontend/component.ts`

**File yang dihasilkan** untuk `generate frontend component MyWidget --dir product`:

```
src/modules/product/components/
└── MyWidget.tsx
```

**Perhatian pada signature fungsi:**

```typescript
export async function generateFrontendComponent(
  moduleName: string, // <- param 1: module directory
  componentName: string, // <- param 2: nama komponen
): Promise<void>;
```

Di `generate.ts` shorthand command:

```typescript
await generateFrontendComponent(name, options.dir ?? "");
// name     = nama yang diinput user (ini jadi moduleName!)
// dir      = --dir option (ini jadi componentName!)
```

**Artinya:** `generate component MyWidget --dir product` → module=`MyWidget`, component=`product`. **Urutan argumen terbalik dari ekspektasi intuitif developer!**

---

## 6. Analisis Utilitas

### 6.1 `utils/paths.ts`

**Fungsi resolusi path:**

```typescript
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveProjectRoot(): string {
  return path.resolve(__dirname, "..", ".."); // ← BUG KRITIS
}
```

**Penjelasan bug:**

| Level                           | Path                               |
| ------------------------------- | ---------------------------------- |
| `import.meta.url` → `__dirname` | `.../next-ssr/cli/src/utils/`      |
| `..` (naik 1 level)             | `.../next-ssr/cli/src/`            |
| `..` (naik 1 level lagi)        | `.../next-ssr/cli/` ← ini hasilnya |
| Seharusnya                      | `.../next-ssr/`                    |

Diperlukan naik **3 level** bukan 2:

```typescript
return path.resolve(__dirname, "..", "..", "..");
```

**Akibat:** Semua file ditulis di dalam folder `cli/` bukan di root proyek Next.js:

| Yang diharapkan                 | Yang terjadi                        |
| ------------------------------- | ----------------------------------- |
| `src/modules/product/`          | `cli/src/modules/product/`          |
| `src/app/api/products/`         | `cli/src/app/api/products/`         |
| `src/app/(dashboard)/products/` | `cli/src/app/(dashboard)/products/` |

**Konsistensi antar fungsi path:**

| Fungsi                 | Derivasi             | Hasil Saat Ini     | Hasil Seharusnya        |
| ---------------------- | -------------------- | ------------------ | ----------------------- |
| `resolveProjectRoot()` | `__dirname + ../..`  | `cli/`             | `next-ssr/`             |
| `resolveModulesDir()`  | `root + src/modules` | `cli/src/modules/` | `next-ssr/src/modules/` |
| `resolveServerDir()`   | `root + src/server`  | `cli/src/server/`  | `next-ssr/src/server/`  |
| `resolveAppDir()`      | `root + src/app`     | `cli/src/app/`     | `next-ssr/src/app/`     |

---

### 6.2 `utils/template.ts`

**Sistem variabel template:**

```typescript
interface TemplateVariables {
  name: string; // "product-category"
  Name: string; // "ProductCategory"  (PascalCase)
  NAME: string; // "PRODUCT-CATEGORY" ← bug (harusnya snake_case caps)
  namePlural: string; // "product-categorys" ← bug (pluralisasi naif)
  NamePlural: string; // "ProductCategorys"  ← bug (turunan dari namePlural yang salah)
}
```

**Bug pluralisasi naif:**

```typescript
const plural = name.endsWith("s") ? name : name + "s";
```

| Input       | Output Saat Ini | Output Benar     |
| ----------- | --------------- | ---------------- |
| `product`   | `products`      | `products` ✅    |
| `category`  | `categorys`     | `categories` ❌  |
| `inventory` | `inventorys`    | `inventories` ❌ |
| `match`     | `matchs`        | `matches` ❌     |
| `bus`       | `bus`           | `buses` ❌       |
| `status`    | `status`        | `statuses` ❌    |
| `leaf`      | `leafs`         | `leaves` ❌      |

**Bug `NAME` variable:**

```typescript
NAME: name.toUpperCase(),
// "product-category" → "PRODUCT-CATEGORY"
```

Digunakan sebagai audit action: `'PRODUCT-CATEGORY_CREATED'` — seharusnya `'PRODUCT_CATEGORY_CREATED'`.

Fix:

```typescript
NAME: name.replace(/-/g, '_').toUpperCase(),
```

---

## 7. Struktur Output Generator

### 7.1 Output `generate backend module product`

```
src/modules/product/
├── dto/
│   └── product-response.dto.ts     # Interface ProductResponse + mapper functions
├── schemas/
│   └── product.schema.ts           # Zod: createProductSchema, updateProductSchema, searchProductSchema
├── queries/
│   └── product.query.ts            # buildProductQuery() menggunakan QueryBuilder
├── services/
│   └── product.service.ts          # listProducts, getProductById, createProduct, updateProduct, deleteProduct
└── index.ts                        # Barrel export semua fungsi & types
```

### 7.2 Output `generate backend crud product`

Semua yang ada di 7.1, **plus:**

```
src/app/api/products/
├── route.ts         # GET (list dengan search/pagination) + POST (create)
└── [id]/
    └── route.ts     # GET (by id) + PATCH (update) + DELETE
```

### 7.3 Output `generate frontend module product`

```
src/modules/product/
├── components/                     # Direktori kosong
├── types/
│   └── product.types.ts            # Interface Product, CreateProductPayload, UpdateProductPayload
├── schemas/
│   └── product.schema.ts           # Zod form validators
└── index.ts                        # Barrel export types + schemas
```

### 7.4 Output `generate frontend crud product`

Semua yang ada di 7.3, **plus:**

```
src/app/(dashboard)/products/
├── page.tsx                    # ProductsPage (server component, fetch list)
├── ProductsTable.tsx           # Tabel + search input (client component)
├── create/
│   ├── page.tsx                # CreateProductPage
│   └── CreateProductForm.tsx   # Form buat data baru
└── [id]/
    ├── page.tsx                # EditProductPage (fetch by id)
    ├── EditProductForm.tsx     # Form edit data
    └── DeleteProductButton.tsx # Tombol hapus dengan confirm
```

### 7.5 Output `generate crud product` (fullstack)

**Gabungan 7.2 + 7.4, tapi dengan konflik** (lihat Issue #2):

```
src/modules/product/           ← KONFLIK! Backend & frontend sama-sama menulis di sini
├── dto/                         (dari backend)
├── queries/                     (dari backend)
├── services/                    (dari backend)
├── components/                  (dari frontend, direktori kosong)
├── types/                       (dari frontend)
├── schemas/
│   └── product.schema.ts        ← Hanya versi backend! Frontend schema di-SKIP
└── index.ts                     ← Hanya versi backend! Frontend exports hilang

src/app/api/products/          (dari backend)
src/app/(dashboard)/products/  (dari frontend)
```

---

## 8. Temuan Bug dan Isu

### 🔴 KRITIS

#### Issue #1 — Path Resolution Salah di `paths.ts`

**File:** `cli/src/utils/paths.ts`, baris 6  
**Masalah:** `resolveProjectRoot()` kembali ke `cli/` bukan `next-ssr/`

```typescript
// Saat ini (SALAH):
return path.resolve(__dirname, "..", ".."); // → cli/

// Seharusnya:
return path.resolve(__dirname, "..", "..", ".."); // → next-ssr/
```

**Dampak:** Semua file ditulis ke `cli/src/...` bukan `src/...`. Generator tidak akan pernah menghasilkan file di lokasi yang benar.

---

#### Issue #2 — Konflik Direktori Modul di Fullstack CRUD

**File:** `fullstack/crud.ts` (secara tidak langsung)  
**Masalah:** `generateBackendModule` dan `generateFrontendModule` keduanya menulis ke `src/modules/{name}/`. `writeFileSafe` melewati file yang sudah ada, sehingga frontend schema dan frontend index.ts tidak pernah dibuat.

**File yang hilang setelah `generate crud product`:**

- `src/modules/product/schemas/product.schema.ts` → versi backend (tanpa form validators)
- `src/modules/product/index.ts` → versi backend (tanpa `Create/UpdateProductPayload` export)
- `src/modules/product/types/product.types.ts` → dibuat, tapi tidak di-export dari index.ts

**Dampak:** Frontend forms tidak bisa import schema validasi client-side dari modul. Akan terjadi error runtime saat developer mengikuti pola yang diimply oleh template.

---

### 🟠 MAJOR

#### Issue #3 — Inkonsistensi Path di `backend/module.ts`

```typescript
// backend/module.ts — cara tidak langsung:
const moduleDir = path.join(resolveServerDir(), "..", "modules", name);

// frontend/module.ts — cara langsung:
const moduleDir = path.join(resolveModulesDir(), name);
```

Keduanya menghasilkan path yang sama, tapi backend menggunakan derivasi fragile via `server/../modules`. Jika struktur folder berubah, backend path bisa rusak.

---

#### Issue #4 — Pluralisasi Naif di `template.ts`

```typescript
const plural = name.endsWith("s") ? name : name + "s";
```

Menghasilkan nama jamak yang salah untuk puluhan kasus umum (category, inventory, match, status, dll). Semua nama folder, route, dan komponen akan salah untuk input-input ini.

---

#### Issue #5 — Anti-Pattern: Server Component Fetch ke API Sendiri

Frontend CRUD pages melakukan HTTP fetch ke API routes proyek sendiri:

```typescript
const res = await fetch(
  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/products?...`,
  { headers: { Cookie: cookieStore.toString() }, cache: "no-store" },
);
```

**Masalah:**

- Localhost hardcode — rusak di production
- Perlu mengirim Cookie header secara manual
- HTTP overhead yang tidak perlu
- Arsitektur runtime nyata (`src/app/(dashboard)/users/page.tsx`) memanggil service **langsung**, tidak via HTTP

**Pola yang benar (sesuai runtime):**

```typescript
const data = await listProducts(params); // panggil service langsung
```

---

#### Issue #6 — `NAME` Variable untuk Audit Action Mengandung Karakter `-`

```typescript
NAME: name.toUpperCase(), // "product-category" → "PRODUCT-CATEGORY"
```

Audit action yang dihasilkan: `'PRODUCT-CATEGORY_CREATED'` — tanda `-` tidak valid sebagai separator konvensi event name. Seharusnya `'PRODUCT_CATEGORY_CREATED'`.

---

#### Issue #7 — Urutan Argumen `generateFrontendComponent` Tidak Intuitif

Signature: `generateFrontendComponent(moduleName, componentName)`  
Command shorthand: `generate component <name> --dir <module>`

Artinya `name` menjadi `moduleName` dan `--dir` menjadi `componentName` — kebalik dari apa yang developer harapkan saat mengetik perintah.

---

### 🟡 MINOR

#### Issue #8 — Audit Log di Dalam `$transaction` Tidak Atomik

```typescript
export async function createProduct(data, actorId) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data });

    await createAuditLog({  // ← menggunakan prisma global, bukan tx!
      userId: actorId,
      action: 'PRODUCT_CREATED',
      ...
    });
    ...
  });
}
```

Jika transaksi di-rollback, audit log **tetap tersimpan** karena ditulis via `prisma` global, bukan `tx`. Sebaiknya `createAuditLog` menerima parameter `tx` opsional.

---

#### Issue #9 — Frontend Forms Tanpa Client-Side Validation

`CreateProductForm` dan `EditProductForm` tidak menggunakan Zod schema untuk validasi di sisi klien:

```typescript
const formData = new FormData(e.currentTarget);
const body = Object.fromEntries(formData); // ← tidak divalidasi
```

Backend memvalidasi via Zod, tapi user hanya mendapat error setelah HTTP round-trip. Sebaliknya, frontend module generator sudah membuat schema — tapi tidak digunakan di forms yang dihasilkan oleh frontend CRUD generator.

---

#### Issue #10 — `window.confirm()` di Delete Button

```typescript
if (!confirm("Are you sure...")) return;
```

Kurang aksesibel, tidak bisa di-custom styling, dan tidak konsisten dengan design system. Sebaiknya menggunakan modal komponen yang sudah ada.

---

#### Issue #11 — `{/* TODO: add columns */}` Tabel Kosong

```tsx
<th>ID</th>;
{
  /* TODO: add columns */
}
```

Tabel hanya menghasilkan kolom ID. Developer harus selalu menambah kolom secara manual — value proposition generator berkurang.

---

## 9. Rekomendasi Perbaikan

### P0 — Kritikal (harus diperbaiki sebelum digunakan)

| #   | Aksi                                                                                                                | File                |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | Fix `resolveProjectRoot()`: ganti `"..", ".."` → `"..", "..", ".."`                                                 | `utils/paths.ts`    |
| 2   | Pisahkan output modul frontend dan backend ke direktori berbeda, atau gunakan `writeFileSafe` yang merge bukan skip | `fullstack/crud.ts` |

**Opsi penyelesaian Issue #2:**

**Opsi A** — Pisahkan lokasi modul:

- Backend module → `src/modules/{name}/` (seperti saat ini)
- Frontend module → tidak perlu direktori terpisah, karena pages sudah di `src/app/(dashboard)/`

**Opsi B** — Gabung schema dalam satu file dengan comment section:

- Satu `src/modules/{name}/schemas/{name}.schema.ts` yang berisi semua schema (create, update, search, form validators)

---

### P1 — Major (perbaiki sesegera mungkin)

| #   | Aksi                                                                                       | File                                                                     |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 3   | Gunakan `resolveModulesDir()` di `backend/module.ts` konsisten dengan `frontend/module.ts` | `backend/module.ts`                                                      |
| 4   | Ganti pluralisasi naif dengan library `pluralize` atau `inflection`                        | `utils/template.ts`                                                      |
| 5   | Ganti pola fetch-to-self di frontend pages dengan panggilan service langsung               | `frontend/crud.ts` — template `LIST_PAGE_TEMPLATE`, `EDIT_PAGE_TEMPLATE` |
| 6   | Fix `NAME` variable: `name.replace(/-/g, '_').toUpperCase()`                               | `utils/template.ts`                                                      |
| 7   | Perjelas docs/help teks untuk urutan argumen `generate component`                          | `commands/generate.ts`                                                   |

---

### P2 — Improvement (nice to have)

| #   | Aksi                                                                                       |
| --- | ------------------------------------------------------------------------------------------ |
| 8   | Tambah parameter `tx` opsional pada `createAuditLog` di service template                   |
| 9   | Gunakan Zod schema di frontend forms (tambah import `create{Name}Schema` di form template) |
| 10  | Ganti `window.confirm()` dengan modal dialog di `Delete{Name}Button` template              |
| 11  | Tambahkan minimal 2-3 placeholder kolom di `{Name}sTable` template                         |
| 12  | Tambah variabel template: `nameKebab`, `nameSnake`, `nameCamel` untuk fleksibilitas lebih  |

---

### Contoh perbaikan `resolveProjectRoot()`:

```typescript
// cli/src/utils/paths.ts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dari: cli/src/utils/ → naik 3 level → next-ssr/
export function resolveProjectRoot(): string {
  return path.resolve(__dirname, "..", "..", "..");
}
```

### Contoh perbaikan pluralisasi:

```bash
npm install pluralize
npm install --save-dev @types/pluralize
```

```typescript
// cli/src/utils/template.ts
import pluralize from "pluralize";

export function createVariables(name: string): TemplateVariables {
  const pascal = toPascalCase(name);
  const plural = pluralize(name);
  const pascalPlural = toPascalCase(plural);
  const nameNormalized = name.replace(/-/g, "_");

  return {
    name,
    Name: pascal,
    NAME: nameNormalized.toUpperCase(),
    namePlural: plural,
    NamePlural: pascalPlural,
  };
}
```

---

_Analisis ini didasarkan pada pembacaan langsung source code generator dan perbandingan dengan implementasi runtime di `src/` proyek next-ssr._
