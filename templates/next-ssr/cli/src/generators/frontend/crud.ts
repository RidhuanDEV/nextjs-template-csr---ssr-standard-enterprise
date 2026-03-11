import path from "node:path";
import { resolveProjectRoot, writeFileSafe, ensureDir } from "../../utils/paths.ts";
import { createVariables, renderTemplate } from "../../utils/template.ts";
import { generateFrontendModule } from "./module.ts";
import type { GeneratorLayoutOptions } from "../shared.ts";

const LIST_PAGE_TEMPLATE = `import Link from 'next/link';
import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import {
  list{{NamePlural}},
  {{NAME}}_PERMISSIONS,
} from '@/modules/{{nameKebab}}/server';
import { {{NamePlural}}Table } from './{{NamePlural}}Table';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function {{NamePlural}}Page({ searchParams }: PageProps) {
  const session = await requireSession();
  requirePermission(session, {{NAME}}_PERMISSIONS.READ);

  const params = await searchParams;
  const parsedPage = Number(params.page ?? '1');
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const search = params.search?.trim() || '';
  const data = await list{{NamePlural}}({
    page,
    limit: 10,
    search: search.length > 0 ? search : undefined,
    sort: '-createdAt',
  });

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

      <{{NamePlural}}Table data={data} currentSearch={search} />
    </div>
  );
}
`;

const LIST_TABLE_TEMPLATE = `'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { PaginatedResponse } from '@/lib/query/pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { {{Name}}ListItem } from '@/modules/{{nameKebab}}/types/{{nameKebab}}.types';

interface {{NamePlural}}TableProps {
  data: PaginatedResponse<{{Name}}ListItem>;
  currentSearch: string;
}

export function {{NamePlural}}Table({
  data,
  currentSearch,
}: {{NamePlural}}TableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (search.trim().length > 0) {
      params.set('search', search.trim());
    }

    router.push('/{{namePluralKebab}}?' + params.toString());
  }

  return (
    <div className="space-y-4">
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
            {data.data.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.description ?? '—'}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <Link
                    href={'/{{namePluralKebab}}/' + item.id}
                    className="text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
        <span>Total: {data.meta.total}</span>
        <div className="flex items-center gap-3">
          {data.meta.page > 1 ? (
            <Link href={'/{{namePluralKebab}}?page=' + String(data.meta.page - 1)}>
              Previous
            </Link>
          ) : null}
          <span>
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          {data.meta.page < data.meta.totalPages ? (
            <Link href={'/{{namePluralKebab}}?page=' + String(data.meta.page + 1)}>
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
`;

const CREATE_PAGE_TEMPLATE = `import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import {
  {{NAME}}_PERMISSIONS,
} from '@/modules/{{nameKebab}}/server';
import { Create{{Name}}Form } from '@/modules/{{nameKebab}}/client/forms/Create{{Name}}Form';

export default async function Create{{Name}}Page() {
  const session = await requireSession();
  requirePermission(session, {{NAME}}_PERMISSIONS.CREATE);

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
      <Create{{Name}}Form />
    </div>
  );
}
`;

const CREATE_FORM_TEMPLATE = `'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  create{{Name}}HttpClient,
} from '../adapters/{{nameKebab}}.http';
import {
  create{{Name}}FormSchema,
  type Create{{Name}}ClientInput,
} from '../schemas/{{nameKebab}}.schema';

export function Create{{Name}}Form() {
  const router = useRouter();
  const toast = useToast();
  const httpClient = create{{Name}}HttpClient();

  function normalizeOptionalText(value: string): string | undefined {
    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Create{{Name}}ClientInput>({
    resolver: zodResolver(create{{Name}}FormSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await httpClient.create(values);
      toast.success('{{Name}} created successfully.');
      router.push('/{{namePluralKebab}}');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create {{nameKebab}}.',
      );
    }
  });

  return (
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
        <Button type="submit" loading={isSubmitting}>
          Create {{Name}}
        </Button>
        <Link href="/{{namePluralKebab}}" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
`;

const EDIT_PAGE_TEMPLATE = `import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import {
  get{{Name}}ById,
  {{NAME}}_PERMISSIONS,
} from '@/modules/{{nameKebab}}/server';
import { Delete{{Name}}Dialog } from '@/modules/{{nameKebab}}/client/components/Delete{{Name}}Dialog';
import { Edit{{Name}}Form } from '@/modules/{{nameKebab}}/client/forms/Edit{{Name}}Form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Edit{{Name}}Page({ params }: PageProps) {
  const session = await requireSession();
  requirePermission(session, {{NAME}}_PERMISSIONS.UPDATE);

  const { id } = await params;
  const {{nameCamel}} = await get{{Name}}ById(id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Edit {{Name}}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Update the {{nameKebab}} details and review the change before saving.
          </p>
        </div>
        <Delete{{Name}}Dialog id={{{nameCamel}}.id} />
      </div>

      <Edit{{Name}}Form {{nameCamel}}={{{nameCamel}}} />
    </div>
  );
}
`;

const EDIT_FORM_TEMPLATE = `'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { {{Name}}Response } from '../../types/{{nameKebab}}.types';
import { create{{Name}}HttpClient } from '../adapters/{{nameKebab}}.http';
import {
  update{{Name}}FormSchema,
  type Update{{Name}}ClientInput,
} from '../schemas/{{nameKebab}}.schema';

interface Edit{{Name}}FormProps {
  {{nameCamel}}: {{Name}}Response;
}

export function Edit{{Name}}Form({ {{nameCamel}} }: Edit{{Name}}FormProps) {
  const router = useRouter();
  const toast = useToast();
  const httpClient = create{{Name}}HttpClient();

  function normalizeOptionalText(value: string): string | undefined {
    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Update{{Name}}ClientInput>({
    resolver: zodResolver(update{{Name}}FormSchema),
    defaultValues: {
      name: {{nameCamel}}.name,
      description: {{nameCamel}}.description ?? undefined,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await httpClient.update({{nameCamel}}.id, values);
      toast.success('{{Name}} updated successfully.');
      router.push('/{{namePluralKebab}}');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update {{nameKebab}}.',
      );
    }
  });

  return (
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
        <Button type="submit" loading={isSubmitting}>
          Save changes
        </Button>
        <Link href="/{{namePluralKebab}}" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
`;

const DELETE_DIALOG_TEMPLATE = `'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/ui/Button';
import { create{{Name}}HttpClient } from '../adapters/{{nameKebab}}.http';

interface Delete{{Name}}DialogProps {
  id: string;
}

export function Delete{{Name}}Dialog({ id }: Delete{{Name}}DialogProps) {
  const router = useRouter();
  const toast = useToast();
  const httpClient = create{{Name}}HttpClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);

    try {
      await httpClient.remove(id);
      toast.success('{{Name}} deleted successfully.');
      router.push('/{{namePluralKebab}}');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete {{nameKebab}}.',
      );
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
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
            <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Delete {{Name}}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              This action permanently removes the {{nameKebab}} record. Review it carefully before continuing.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={isDeleting}
                onClick={() => void handleDelete()}
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

const CLIENT_INDEX_CRUD_FRAGMENT = `export { Delete{{Name}}Dialog } from './components/Delete{{Name}}Dialog';
export { Create{{Name}}Form } from './forms/Create{{Name}}Form';
export { Edit{{Name}}Form } from './forms/Edit{{Name}}Form';
`;

export async function generateFrontendCrud(
  name: string,
  options: GeneratorLayoutOptions = {},
): Promise<void> {
  const vars = createVariables(name);
  const root = resolveProjectRoot();
  const pagesDir = path.join(root, "src", "app", "(dashboard)", vars.namePluralKebab);
  const moduleDir = path.join(root, "src", "modules", vars.nameKebab, "client");

  console.log(`\nGenerating frontend CRUD for: ${vars.nameKebab}\n`);

  await generateFrontendModule(name, options);

  await Promise.all([
    ensureDir(pagesDir),
    ensureDir(path.join(moduleDir, "components")),
    ensureDir(path.join(moduleDir, "forms")),
  ]);

  await ensureDir(pagesDir);
  await writeFileSafe(path.join(pagesDir, "page.tsx"), renderTemplate(LIST_PAGE_TEMPLATE, vars));
  await writeFileSafe(
    path.join(pagesDir, `${vars.NamePlural}Table.tsx`),
    renderTemplate(LIST_TABLE_TEMPLATE, vars),
  );

  const createDir = path.join(pagesDir, "create");
  await ensureDir(createDir);
  await writeFileSafe(path.join(createDir, "page.tsx"), renderTemplate(CREATE_PAGE_TEMPLATE, vars));
  await writeFileSafe(
    path.join(moduleDir, "forms", `Create${vars.Name}Form.tsx`),
    renderTemplate(CREATE_FORM_TEMPLATE, vars),
  );

  const editDir = path.join(pagesDir, "[id]");
  await ensureDir(editDir);
  await writeFileSafe(path.join(editDir, "page.tsx"), renderTemplate(EDIT_PAGE_TEMPLATE, vars));
  await writeFileSafe(
    path.join(moduleDir, "forms", `Edit${vars.Name}Form.tsx`),
    renderTemplate(EDIT_FORM_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(moduleDir, "components", `Delete${vars.Name}Dialog.tsx`),
    renderTemplate(DELETE_DIALOG_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(moduleDir, "index.ts"),
    renderTemplate(
      `export {
  create{{Name}}FormSchema,
  paginated{{NamePlural}}Schema,
  search{{NamePlural}}FilterSchema,
  update{{Name}}FormSchema,
  {{nameCamel}}ResponseSchema,
} from './schemas/{{nameKebab}}.schema';
export type {
  Create{{Name}}ClientInput,
  Search{{NamePlural}}Filters,
  Update{{Name}}ClientInput,
} from './schemas/{{nameKebab}}.schema';
export {
  create{{Name}}HttpClient,
  type {{Name}}HttpClient,
} from './adapters/{{nameKebab}}.http';
export type { {{Name}}ListItem, {{Name}}Response } from '../types/{{nameKebab}}.types';

/* FRAGMENT:forms-components */
${CLIENT_INDEX_CRUD_FRAGMENT}
/* END FRAGMENT:forms-components */
`,
      vars,
    ),
  );

  console.log(`\nFrontend CRUD for "${vars.nameKebab}" generated successfully.`);
  console.log(`  Pages: src/app/(dashboard)/${vars.namePluralKebab}/`);
}
