import path from 'node:path';
import { resolveAppDir, writeFileSafe, ensureDir } from '../utils/paths.js';
import { createVariables, renderTemplate } from '../utils/template.js';
import { generateModule } from './module.js';

const LIST_PAGE_TEMPLATE = `'use client';

import Link from 'next/link';
import { use{{NamePlural}}, useDelete{{Name}} } from '@/modules/{{name}}';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function {{NamePlural}}ListPage() {
  const { data, isLoading } = use{{NamePlural}}();
  const deleteMutation = useDelete{{Name}}();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{{NamePlural}}</h1>
        <Link href="/{{namePlural}}/create">
          <Button>Create {{Name}}</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">ID</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Created</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data?.data.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">{item.id}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={\`/{{namePlural}}/\${item.id}\`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                    <Link href={\`/{{namePlural}}/\${item.id}/edit\`}>
                      <Button variant="secondary" size="sm">Edit</Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;

const CREATE_PAGE_TEMPLATE = `'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { create{{Name}}Schema, type Create{{Name}}FormValues } from '@/modules/{{name}}/schemas/{{name}}.schema';
import { useCreate{{Name}} } from '@/modules/{{name}}';
import { Button } from '@/components/ui/Button';

export default function Create{{Name}}Page() {
  const router = useRouter();
  const createMutation = useCreate{{Name}}();
  const {
    handleSubmit,
    formState: { errors },
  } = useForm<Create{{Name}}FormValues>({
    resolver: zodResolver(create{{Name}}Schema),
  });

  const onSubmit = (data: Create{{Name}}FormValues) => {
    createMutation.mutate(data as Parameters<typeof createMutation.mutate>[0], {
      onSuccess: () => router.push('/{{namePlural}}'),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create {{Name}}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* TODO: Add form fields based on your schema */}
        <p className="text-sm text-zinc-500">Add form fields here matching your create{{Name}}Schema.</p>
        <div className="flex gap-3">
          <Button type="submit" loading={createMutation.isPending}>Create</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
`;

const DETAIL_PAGE_TEMPLATE = `'use client';

import { use } from 'react';
import Link from 'next/link';
import { use{{Name}} } from '@/modules/{{name}}';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function {{Name}}DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = use{{Name}}(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-zinc-600 dark:text-zinc-400">{{Name}} not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{{Name}} Detail</h1>
        <Link href={\`/{{namePlural}}/\${id}/edit\`}>
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <pre className="text-sm text-zinc-700 dark:text-zinc-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
`;

const EDIT_PAGE_TEMPLATE = `'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { update{{Name}}Schema, type Update{{Name}}FormValues } from '@/modules/{{name}}/schemas/{{name}}.schema';
import { use{{Name}}, useUpdate{{Name}} } from '@/modules/{{name}}';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function Edit{{Name}}Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = use{{Name}}(id);
  const updateMutation = useUpdate{{Name}}();
  const {
    handleSubmit,
    formState: { errors },
  } = useForm<Update{{Name}}FormValues>({
    resolver: zodResolver(update{{Name}}Schema),
    values: data as Update{{Name}}FormValues | undefined,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const onSubmit = (formData: Update{{Name}}FormValues) => {
    updateMutation.mutate(
      { id, data: formData as Parameters<typeof updateMutation.mutate>[0]['data'] },
      { onSuccess: () => router.push(\`/{{namePlural}}/\${id}\`) }
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Edit {{Name}}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* TODO: Add form fields based on your schema */}
        <p className="text-sm text-zinc-500">Add form fields here matching your update{{Name}}Schema.</p>
        <div className="flex gap-3">
          <Button type="submit" loading={updateMutation.isPending}>Save</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
`;

export async function generateCrud(name: string): Promise<void> {
  const vars = createVariables(name);

  console.log(`\nGenerating CRUD for: ${name}\n`);
  console.log('--- Module ---');
  await generateModule(name);

  console.log('\n--- Pages ---');
  const pagesDir = path.join(resolveAppDir(), '(dashboard)', vars.namePlural);

  await ensureDir(pagesDir);
  await ensureDir(path.join(pagesDir, 'create'));
  await ensureDir(path.join(pagesDir, '[id]'));
  await ensureDir(path.join(pagesDir, '[id]', 'edit'));

  await writeFileSafe(
    path.join(pagesDir, 'page.tsx'),
    renderTemplate(LIST_PAGE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(pagesDir, 'create', 'page.tsx'),
    renderTemplate(CREATE_PAGE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(pagesDir, '[id]', 'page.tsx'),
    renderTemplate(DETAIL_PAGE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(pagesDir, '[id]', 'edit', 'page.tsx'),
    renderTemplate(EDIT_PAGE_TEMPLATE, vars)
  );

  console.log(`\nCRUD for "${name}" generated successfully.`);
  console.log(`\nNext steps:`);
  console.log(`  1. Define fields in src/modules/${name}/types/${name}.types.ts`);
  console.log(`  2. Update schemas in src/modules/${name}/schemas/${name}.schema.ts`);
  console.log(`  3. Add form fields to create/edit pages`);
  console.log(`  4. Add "${vars.NamePlural}" to the Sidebar navigation`);
}
