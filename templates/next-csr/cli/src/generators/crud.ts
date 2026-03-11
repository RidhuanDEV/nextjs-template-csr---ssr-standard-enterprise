import path from 'node:path';
import { resolveAppDir, writeFileSafe, ensureDir } from '../utils/paths.ts';
import { createVariables, renderTemplate } from '../utils/template.ts';
import { generateModule } from './module.ts';

const LIST_PAGE_TEMPLATE = `'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  use{{NamePlural}},
} from '@/modules/{{nameKebab}}';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import type { {{Name}}ListItem } from '@/modules/{{nameKebab}}';

export default function {{NamePlural}}ListPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = use{{NamePlural}}(
    search.trim().length > 0 ? { search: search.trim() } : undefined,
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {{NamePlural}}
        </h1>
        <Link
          href="/{{namePluralKebab}}/create"
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create {{Name}}
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row md:items-end">
        <Input
          label="Search {{NamePlural}}"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or description"
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {data?.data.map((item: {{Name}}ListItem) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.description ?? '—'}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={'/{{namePluralKebab}}/' + item.id}
                      className="text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      View
                    </Link>
                    <Link
                      href={'/{{namePluralKebab}}/' + item.id + '/edit'}
                      className="text-zinc-600 hover:underline dark:text-zinc-400"
                    >
                      Edit
                    </Link>
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

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  create{{Name}}Schema,
  type Create{{Name}}FormValues,
} from '@/modules/{{nameKebab}}/schemas/{{nameKebab}}.schema';
import { useCreate{{Name}} } from '@/modules/{{nameKebab}}';

export default function Create{{Name}}Page() {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreate{{Name}}();

  function normalizeOptionalText(value: string): string | undefined {
    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Create{{Name}}FormValues>({
    resolver: zodResolver(create{{Name}}Schema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('{{Name}} created successfully.');
        router.push('/{{namePluralKebab}}');
      },
    });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Create {{Name}}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Fill in the fields below to create a new {{nameKebab}} record.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Name"
          error={errors.name?.message}
          placeholder="{{Name}} name"
          {...register('name')}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </label>
          <textarea
            className="min-h-32 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-300"
            placeholder="Describe this {{nameKebab}}"
            {...register('description', {
              setValueAs: normalizeOptionalText,
            })}
          />
          {errors.description?.message ? (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting || createMutation.isPending}>
            Create {{Name}}
          </Button>
          <Link
            href="/{{namePluralKebab}}"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
`;

const DETAIL_PAGE_TEMPLATE = `'use client';

import { use } from 'react';
import Link from 'next/link';
import { use{{Name}} } from '@/modules/{{nameKebab}}';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Delete{{Name}}Dialog } from '@/modules/{{nameKebab}}/components/Delete{{Name}}Dialog';

export default function {{Name}}DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {{Name}} Detail
        </h1>
        <div className="flex items-center gap-2">
          <Link href={'/{{namePluralKebab}}/' + id + '/edit'}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Delete{{Name}}Dialog id={id} />
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Name
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">{data.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Description
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {data.description ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Created
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">{data.createdAt}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
`;

const EDIT_PAGE_TEMPLATE = `'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import {
  update{{Name}}Schema,
  type Update{{Name}}FormValues,
} from '@/modules/{{nameKebab}}/schemas/{{nameKebab}}.schema';
import { use{{Name}}, useUpdate{{Name}} } from '@/modules/{{nameKebab}}';

export default function Edit{{Name}}Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading } = use{{Name}}(id);
  const updateMutation = useUpdate{{Name}}();

  function normalizeOptionalText(value: string): string | undefined {
    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Update{{Name}}FormValues>({
    resolver: zodResolver(update{{Name}}Schema),
    values: data
      ? {
          name: data.name,
          description: data.description ?? undefined,
        }
      : undefined,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    updateMutation.mutate(
      { id, data: values },
      {
        onSuccess: () => {
          toast.success('{{Name}} updated successfully.');
          router.push('/{{namePluralKebab}}/' + id);
        },
      },
    );
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Edit {{Name}}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Update the {{nameKebab}} details and save the changes.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Name"
          error={errors.name?.message}
          placeholder="{{Name}} name"
          {...register('name')}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </label>
          <textarea
            className="min-h-32 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-300"
            placeholder="Describe this {{nameKebab}}"
            {...register('description', {
              setValueAs: normalizeOptionalText,
            })}
          />
          {errors.description?.message ? (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting || updateMutation.isPending}>
            Save changes
          </Button>
          <Link
            href="/{{namePluralKebab}}"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
`;

const DELETE_DIALOG_TEMPLATE = `'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { useDelete{{Name}} } from '@/modules/{{nameKebab}}';

interface Delete{{Name}}DialogProps {
  id: string;
}

export function Delete{{Name}}Dialog({ id }: Delete{{Name}}DialogProps) {
  const router = useRouter();
  const toast = useToast();
  const deleteMutation = useDelete{{Name}}();
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  function handleDelete(): void {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('{{Name}} deleted successfully.');
        router.push('/{{namePluralKebab}}');
      },
      onError: () => {
        toast.error('Failed to delete {{nameKebab}}.');
      },
      onSettled: () => {
        setIsOpen(false);
      },
    });
  }

  return (
    <>
      <Button type="button" variant="danger" onClick={() => setIsOpen(true)}>
        Delete
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950"
          >
            <h2
              id={titleId}
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Delete {{Name}}
            </h2>
            <p
              id={descriptionId}
              className="mt-2 text-sm text-zinc-600 dark:text-zinc-400"
            >
              This action permanently removes the {{nameKebab}} record. Review
              it carefully before continuing.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={deleteMutation.isPending}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                Delete {{Name}}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
`;

export async function generateCrud(name: string): Promise<void> {
  const vars = createVariables(name);

  console.log(`\nGenerating CRUD for: ${vars.nameKebab}\n`);
  console.log('--- Module ---');
  await generateModule(name);

  console.log('\n--- Delete Dialog ---');
  const moduleDir = path.join(resolveAppDir(), '..', 'modules', vars.nameKebab, 'components');
  await ensureDir(moduleDir);
  await writeFileSafe(
    path.join(moduleDir, `Delete${vars.Name}Dialog.tsx`),
    renderTemplate(DELETE_DIALOG_TEMPLATE, vars)
  );

  console.log('\n--- Pages ---');
  const pagesDir = path.join(resolveAppDir(), '(dashboard)', vars.namePluralKebab);

  await ensureDir(pagesDir);
  await ensureDir(path.join(pagesDir, 'create'));
  await ensureDir(path.join(pagesDir, '[id]'));
  await ensureDir(path.join(pagesDir, '[id]', 'edit'));

  await writeFileSafe(path.join(pagesDir, 'page.tsx'), renderTemplate(LIST_PAGE_TEMPLATE, vars));
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

  console.log(`\nCRUD for "${vars.nameKebab}" generated successfully.`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review generated types in src/modules/${vars.nameKebab}/types/`);
  console.log(`  2. Review schemas in src/modules/${vars.nameKebab}/schemas/`);
  console.log(`  3. Add "${vars.NamePlural}" to the Sidebar navigation`);
}
