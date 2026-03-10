import path from 'node:path';
import { resolveModulesDir, writeFileSafe, ensureDir } from '../utils/paths.js';
import { createVariables, renderTemplate } from '../utils/template.js';

const TYPES_TEMPLATE = `export interface {{Name}} {
  id: string;
  // TODO: add {{name}} fields
  createdAt: string;
  updatedAt: string;
}

export interface Create{{Name}}Payload {
  // TODO: add create payload fields
}

export interface Update{{Name}}Payload {
  // TODO: add update payload fields
}
`;

const SERVICE_TEMPLATE = `import { apiClient } from '@/lib/api/client';
import type { {{Name}}, Create{{Name}}Payload, Update{{Name}}Payload } from '../types/{{name}}.types';
import type { PaginatedResponse } from '@/lib/api/types';

export const {{name}}Service = {
  list: async (params?: Record<string, string>): Promise<PaginatedResponse<{{Name}}>> => {
    const response = await apiClient.get<PaginatedResponse<{{Name}}>>('/{{namePlural}}', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{{Name}}> => {
    const response = await apiClient.get<{{Name}}>(\`/{{namePlural}}/\${id}\`);
    return response.data;
  },

  create: async (data: Create{{Name}}Payload): Promise<{{Name}}> => {
    const response = await apiClient.post<{{Name}}>('/{{namePlural}}', data);
    return response.data;
  },

  update: async (id: string, data: Update{{Name}}Payload): Promise<{{Name}}> => {
    const response = await apiClient.patch<{{Name}}>(\`/{{namePlural}}/\${id}\`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(\`/{{namePlural}}/\${id}\`);
  },
};
`;

const HOOK_TEMPLATE = `import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { {{name}}Service } from '../services/{{name}}.service';
import type { Create{{Name}}Payload, Update{{Name}}Payload } from '../types/{{name}}.types';

const QUERY_KEY = ['{{namePlural}}'];

export function use{{NamePlural}}(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => {{name}}Service.list(params),
  });
}

export function use{{Name}}(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => {{name}}Service.getById(id),
    enabled: !!id,
  });
}

export function useCreate{{Name}}() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Create{{Name}}Payload) => {{name}}Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('{{Name}} created successfully');
    },
    onError: () => {
      toast.error('Failed to create {{name}}');
    },
  });
}

export function useUpdate{{Name}}() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update{{Name}}Payload }) =>
      {{name}}Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('{{Name}} updated successfully');
    },
    onError: () => {
      toast.error('Failed to update {{name}}');
    },
  });
}

export function useDelete{{Name}}() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => {{name}}Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('{{Name}} deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete {{name}}');
    },
  });
}
`;

const SCHEMA_TEMPLATE = `import { z } from 'zod';

export const create{{Name}}Schema = z.object({
  // TODO: add validation fields
});

export const update{{Name}}Schema = z.object({
  // TODO: add validation fields
});

export type Create{{Name}}FormValues = z.infer<typeof create{{Name}}Schema>;
export type Update{{Name}}FormValues = z.infer<typeof update{{Name}}Schema>;
`;

const INDEX_TEMPLATE = `export { {{name}}Service } from './services/{{name}}.service';
export { use{{NamePlural}}, use{{Name}}, useCreate{{Name}}, useUpdate{{Name}}, useDelete{{Name}} } from './hooks/use{{Name}}';
export { create{{Name}}Schema, update{{Name}}Schema } from './schemas/{{name}}.schema';
export type { {{Name}}, Create{{Name}}Payload, Update{{Name}}Payload } from './types/{{name}}.types';
`;

export async function generateModule(name: string): Promise<void> {
  const vars = createVariables(name);
  const moduleDir = path.join(resolveModulesDir(), name);

  console.log(`\nGenerating module: ${name}\n`);

  await ensureDir(path.join(moduleDir, 'components'));
  await ensureDir(path.join(moduleDir, 'hooks'));
  await ensureDir(path.join(moduleDir, 'schemas'));
  await ensureDir(path.join(moduleDir, 'services'));
  await ensureDir(path.join(moduleDir, 'types'));

  await writeFileSafe(
    path.join(moduleDir, 'types', `${name}.types.ts`),
    renderTemplate(TYPES_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'services', `${name}.service.ts`),
    renderTemplate(SERVICE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'hooks', `use${vars.Name}.ts`),
    renderTemplate(HOOK_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'schemas', `${name}.schema.ts`),
    renderTemplate(SCHEMA_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'index.ts'),
    renderTemplate(INDEX_TEMPLATE, vars)
  );

  console.log(`\nModule "${name}" generated successfully.`);
}
