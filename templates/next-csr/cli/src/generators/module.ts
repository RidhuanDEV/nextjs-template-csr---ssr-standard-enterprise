import path from 'node:path';
import {
  resolveModulesDir,
  resolveConstantsDir,
  writeFileSafe,
  ensureDir,
} from '../utils/paths.js';
import { createVariables, renderTemplate } from '../utils/template.js';
import { updateModulesConstants, updatePermissionsConstants } from './constants.js';

const TYPES_TEMPLATE = `export interface {{Name}}Response {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type {{Name}}ListItem = {{Name}}Response;

export interface Create{{Name}}Payload {
  name: string;
  description?: string;
}

export interface Update{{Name}}Payload {
  name?: string;
  description?: string;
}
`;

const SERVICE_TEMPLATE = `import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse } from '@/lib/api/types';
import type {
  {{Name}}Response,
  Create{{Name}}Payload,
  Update{{Name}}Payload,
} from '../types/{{nameKebab}}.types';

const BASE_PATH = '/{{namePluralKebab}}';

export const {{nameCamel}}Service = {
  list: async (params?: Record<string, string>): Promise<PaginatedResponse<{{Name}}Response>> => {
    const response = await apiClient.get<PaginatedResponse<{{Name}}Response>>(BASE_PATH, { params });
    return response.data;
  },

  getById: async (id: string): Promise<{{Name}}Response> => {
    const response = await apiClient.get<{{Name}}Response>(BASE_PATH + '/' + id);
    return response.data;
  },

  create: async (data: Create{{Name}}Payload): Promise<{{Name}}Response> => {
    const response = await apiClient.post<{{Name}}Response>(BASE_PATH, data);
    return response.data;
  },

  update: async (id: string, data: Update{{Name}}Payload): Promise<{{Name}}Response> => {
    const response = await apiClient.patch<{{Name}}Response>(BASE_PATH + '/' + id, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(BASE_PATH + '/' + id);
  },
};
`;

const HOOK_TEMPLATE = `import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { {{nameCamel}}Service } from '../services/{{nameKebab}}.service';
import type { Create{{Name}}Payload, Update{{Name}}Payload } from '../types/{{nameKebab}}.types';

const QUERY_KEY = ['{{namePluralKebab}}'];

export function use{{NamePlural}}(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => {{nameCamel}}Service.list(params),
  });
}

export function use{{Name}}(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => {{nameCamel}}Service.getById(id),
    enabled: !!id,
  });
}

export function useCreate{{Name}}() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Create{{Name}}Payload) => {{nameCamel}}Service.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('{{Name}} created successfully');
    },
    onError: () => {
      toast.error('Failed to create {{Name}}');
    },
  });
}

export function useUpdate{{Name}}() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update{{Name}}Payload }) =>
      {{nameCamel}}Service.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('{{Name}} updated successfully');
    },
    onError: () => {
      toast.error('Failed to update {{Name}}');
    },
  });
}

export function useDelete{{Name}}() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => {{nameCamel}}Service.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('{{Name}} deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete {{Name}}');
    },
  });
}
`;

const SCHEMA_TEMPLATE = `import { z } from 'zod';

export const create{{Name}}Schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, '{{Name}} name must be at least 2 characters')
    .max(120, '{{Name}} name must be 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .optional(),
});

export const update{{Name}}Schema = create{{Name}}Schema.partial();

export const search{{NamePlural}}Schema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  sort: z
    .enum(['createdAt', 'updatedAt', 'name', '-createdAt', '-updatedAt', '-name'])
    .optional(),
});

export type Create{{Name}}FormValues = z.infer<typeof create{{Name}}Schema>;
export type Update{{Name}}FormValues = z.infer<typeof update{{Name}}Schema>;
export type Search{{NamePlural}}Params = z.infer<typeof search{{NamePlural}}Schema>;
`;

const PERMISSIONS_TEMPLATE = `export const {{NAME}}_PERMISSIONS = {
  READ: '{{namePluralKebab}}:read',
  CREATE: '{{namePluralKebab}}:create',
  UPDATE: '{{namePluralKebab}}:update',
  DELETE: '{{namePluralKebab}}:delete',
} as const;

export type {{Name}}Permission =
  (typeof {{NAME}}_PERMISSIONS)[keyof typeof {{NAME}}_PERMISSIONS];
`;

const INDEX_TEMPLATE = `export { {{nameCamel}}Service } from './services/{{nameKebab}}.service';
export {
  use{{NamePlural}},
  use{{Name}},
  useCreate{{Name}},
  useUpdate{{Name}},
  useDelete{{Name}},
} from './hooks/use{{Name}}';
export {
  create{{Name}}Schema,
  update{{Name}}Schema,
  search{{NamePlural}}Schema,
} from './schemas/{{nameKebab}}.schema';
export type {
  Create{{Name}}FormValues,
  Update{{Name}}FormValues,
  Search{{NamePlural}}Params,
} from './schemas/{{nameKebab}}.schema';
export { {{NAME}}_PERMISSIONS } from './constants/{{nameKebab}}.permissions';
export type {
  {{Name}}Response,
  {{Name}}ListItem,
  Create{{Name}}Payload,
  Update{{Name}}Payload,
} from './types/{{nameKebab}}.types';

/* FRAGMENT:forms-components */
/* END FRAGMENT:forms-components */
`;

export async function generateModule(name: string): Promise<void> {
  const vars = createVariables(name);
  const moduleDir = path.join(resolveModulesDir(), vars.nameKebab);
  const constantsDir = resolveConstantsDir();

  console.log(`\nGenerating module: ${vars.nameKebab}\n`);

  await Promise.all([
    ensureDir(path.join(moduleDir, 'components')),
    ensureDir(path.join(moduleDir, 'constants')),
    ensureDir(path.join(moduleDir, 'forms')),
    ensureDir(path.join(moduleDir, 'hooks')),
    ensureDir(path.join(moduleDir, 'schemas')),
    ensureDir(path.join(moduleDir, 'services')),
    ensureDir(path.join(moduleDir, 'types')),
    ensureDir(constantsDir),
  ]);

  await writeFileSafe(
    path.join(moduleDir, 'types', `${vars.nameKebab}.types.ts`),
    renderTemplate(TYPES_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'services', `${vars.nameKebab}.service.ts`),
    renderTemplate(SERVICE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'hooks', `use${vars.Name}.ts`),
    renderTemplate(HOOK_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'schemas', `${vars.nameKebab}.schema.ts`),
    renderTemplate(SCHEMA_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'constants', `${vars.nameKebab}.permissions.ts`),
    renderTemplate(PERMISSIONS_TEMPLATE, vars)
  );
  await writeFileSafe(path.join(moduleDir, 'index.ts'), renderTemplate(INDEX_TEMPLATE, vars));

  await updateModulesConstants(vars);
  await updatePermissionsConstants(vars);

  console.log(`\nModule "${vars.nameKebab}" generated successfully.`);
  console.log(`  Location: src/modules/${vars.nameKebab}`);
}
