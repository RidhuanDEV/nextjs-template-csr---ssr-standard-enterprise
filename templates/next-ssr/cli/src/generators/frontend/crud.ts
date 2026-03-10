import path from 'node:path';
import { resolveProjectRoot, writeFileSafe, ensureDir } from '../../utils/paths.js';
import { createVariables, renderTemplate } from '../../utils/template.js';
import { generateFrontendModule } from './module.js';

const LIST_PAGE_TEMPLATE = `import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { {{Name}}sTable } from './{{Name}}sTable';

async function get{{Name}}s(page: number, search: string) {
  const cookieStore = await cookies();
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) params.set('search', search);

  const res = await fetch(
    \`\${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/{{namePlural}}?\${params}\`,
    { headers: { Cookie: cookieStore.toString() }, cache: 'no-store' }
  );

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to fetch {{namePlural}}');
  return res.json();
}

export default async function {{Name}}sPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const search = typeof sp.search === 'string' ? sp.search : '';
  const data = await get{{Name}}s(page, search);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{{NamePlural}}</h1>
        <a
          href="/{{namePlural}}/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create {{Name}}
        </a>
      </div>
      <{{Name}}sTable data={data} currentPage={page} currentSearch={search} />
    </div>
  );
}
`;

const LIST_TABLE_TEMPLATE = `'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface {{Name}}sTableProps {
  data: {
    data: Array<{ id: string; [key: string]: unknown }>;
    meta: { page: number; totalPages: number; total: number };
  };
  currentPage: number;
  currentSearch: string;
}

export function {{Name}}sTable({ data, currentPage, currentSearch }: {{Name}}sTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    router.push(\`/{{namePlural}}?\${params}\`);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
              {/* TODO: add columns */}
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {data.data.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm">{item.id}</td>
                {/* TODO: add cells */}
                <td className="px-4 py-3 text-right text-sm">
                  <a href={\`/{{namePlural}}/\${item.id}\`} className="text-blue-600 hover:underline">
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Total: {data.meta.total}</span>
        <div className="flex gap-2">
          {currentPage > 1 && (
            <a href={\`/{{namePlural}}?page=\${currentPage - 1}\`} className="text-blue-600 hover:underline">
              Previous
            </a>
          )}
          <span>Page {data.meta.page} of {data.meta.totalPages}</span>
          {currentPage < data.meta.totalPages && (
            <a href={\`/{{namePlural}}?page=\${currentPage + 1}\`} className="text-blue-600 hover:underline">
              Next
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const CREATE_PAGE_TEMPLATE = `import { Create{{Name}}Form } from './Create{{Name}}Form';

export default function Create{{Name}}Page() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Create {{Name}}</h1>
      <Create{{Name}}Form />
    </div>
  );
}
`;

const CREATE_FORM_TEMPLATE = `'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';

export function Create{{Name}}Form() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const body = Object.fromEntries(formData);

      const res = await fetch('/api/{{namePlural}}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create');
      }

      addToast('{{Name}} created successfully', 'success');
      router.push('/{{namePlural}}');
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TODO: add form fields */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
        <a href="/{{namePlural}}" className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
          Cancel
        </a>
      </div>
    </form>
  );
}
`;

const EDIT_PAGE_TEMPLATE = `import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Edit{{Name}}Form } from './Edit{{Name}}Form';
import { Delete{{Name}}Button } from './Delete{{Name}}Button';

type RouteParams = { params: Promise<{ id: string }> };

async function get{{Name}}(id: string) {
  const cookieStore = await cookies();
  const res = await fetch(
    \`\${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/{{namePlural}}/\${id}\`,
    { headers: { Cookie: cookieStore.toString() }, cache: 'no-store' }
  );

  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error('Failed to fetch {{name}}');
  return res.json();
}

export default async function Edit{{Name}}Page({ params }: RouteParams) {
  const { id } = await params;
  const {{name}} = await get{{Name}}(id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit {{Name}}</h1>
        <Delete{{Name}}Button id={id} />
      </div>
      <Edit{{Name}}Form {{name}}={ {{name}} } />
    </div>
  );
}
`;

const EDIT_FORM_TEMPLATE = `'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';

interface Edit{{Name}}FormProps {
  {{name}}: { id: string; [key: string]: unknown };
}

export function Edit{{Name}}Form({ {{name}} }: Edit{{Name}}FormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const body = Object.fromEntries(formData);

      const res = await fetch(\`/api/{{namePlural}}/\${{{name}}.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to update');
      }

      addToast('{{Name}} updated successfully', 'success');
      router.push('/{{namePlural}}');
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TODO: add form fields with defaultValue from {{name}} */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <a href="/{{namePlural}}" className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
          Cancel
        </a>
      </div>
    </form>
  );
}
`;

const DELETE_BUTTON_TEMPLATE = `'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/components/feedback/Toast';

export function Delete{{Name}}Button({ id }: { id: string }) {
  const router = useRouter();
  const { addToast } = useToast();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this {{name}}?')) return;

    try {
      const res = await fetch(\`/api/{{namePlural}}/\${id}\`, { method: 'DELETE' });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to delete');
      }

      addToast('{{Name}} deleted successfully', 'success');
      router.push('/{{namePlural}}');
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'An error occurred', 'error');
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      Delete
    </button>
  );
}
`;

export async function generateFrontendCrud(name: string): Promise<void> {
  const vars = createVariables(name);
  const root = resolveProjectRoot();
  const pagesDir = path.join(root, 'src', 'app', '(dashboard)', vars.namePlural);

  console.log(`\nGenerating frontend CRUD for: ${name}\n`);

  // Generate the module (types, schemas, index)
  await generateFrontendModule(name);

  // List page
  await ensureDir(pagesDir);
  await writeFileSafe(
    path.join(pagesDir, 'page.tsx'),
    renderTemplate(LIST_PAGE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(pagesDir, `${vars.Name}sTable.tsx`),
    renderTemplate(LIST_TABLE_TEMPLATE, vars)
  );

  // Create page
  const createDir = path.join(pagesDir, 'create');
  await ensureDir(createDir);
  await writeFileSafe(
    path.join(createDir, 'page.tsx'),
    renderTemplate(CREATE_PAGE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(createDir, `Create${vars.Name}Form.tsx`),
    renderTemplate(CREATE_FORM_TEMPLATE, vars)
  );

  // Edit page
  const editDir = path.join(pagesDir, '[id]');
  await ensureDir(editDir);
  await writeFileSafe(
    path.join(editDir, 'page.tsx'),
    renderTemplate(EDIT_PAGE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(editDir, `Edit${vars.Name}Form.tsx`),
    renderTemplate(EDIT_FORM_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(editDir, `Delete${vars.Name}Button.tsx`),
    renderTemplate(DELETE_BUTTON_TEMPLATE, vars)
  );

  console.log(`\nFrontend CRUD for "${name}" generated successfully.`);
  console.log(`  Pages: src/app/(dashboard)/${vars.namePlural}/`);
}
