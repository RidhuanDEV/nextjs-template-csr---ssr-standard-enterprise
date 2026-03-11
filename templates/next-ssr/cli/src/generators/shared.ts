import path from "node:path";
import { resolveModulesDir } from "../utils/paths.ts";
import type { TemplateVariables } from "../utils/template.ts";

export interface GeneratorLayoutOptions {
  merge?: boolean;
}

export interface ModuleGenerationPaths {
  moduleRoot: string;
  sharedTypesFile: string;
  clientRoot: string;
  serverRoot: string;
  clientSchemaFile: string;
  serverSchemaFile: string;
  sharedSchemaFile: string;
}

export const SHARED_TYPES_TEMPLATE = `export interface {{Name}}Response {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type {{Name}}ListItem = {{Name}}Response;

export interface {{Name}}Record {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
`;

export const SHARED_SCHEMA_TEMPLATE = `import { z } from 'zod';

// Localization map — replace values with your i18n function (e.g. t('validation.name_min'))
const messages = {
  nameMin: '{{Name}} name must be at least 2 characters',
  nameMax: '{{Name}} name must be 120 characters or fewer',
  descriptionMax: 'Description must be 500 characters or fewer',
} as const;

export const create{{Name}}FormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, messages.nameMin)
    .max(120, messages.nameMax),
  description: z
    .string()
    .trim()
    .max(500, messages.descriptionMax)
    .optional(),
});

export const update{{Name}}FormSchema = create{{Name}}FormSchema.partial();

export const search{{NamePlural}}FilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  sort: z
    .enum(['createdAt', 'updatedAt', 'name', '-createdAt', '-updatedAt', '-name'])
    .optional(),
});

export const {{nameCamel}}ResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const paginated{{NamePlural}}Schema = z.object({
  data: z.array({{nameCamel}}ResponseSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const create{{Name}}Schema = create{{Name}}FormSchema;
export const update{{Name}}Schema = update{{Name}}FormSchema;
export const search{{NamePlural}}Schema = search{{NamePlural}}FilterSchema;

export type Create{{Name}}ClientInput = z.output<typeof create{{Name}}FormSchema>;
export type Update{{Name}}ClientInput = z.output<typeof update{{Name}}FormSchema>;
export type Search{{NamePlural}}Filters = z.output<typeof search{{NamePlural}}FilterSchema>;

export type Create{{Name}}Input = z.output<typeof create{{Name}}Schema>;
export type Update{{Name}}Input = z.output<typeof update{{Name}}Schema>;
export type Search{{NamePlural}}Input = z.output<typeof search{{NamePlural}}Schema>;
`;

export function getModuleGenerationPaths(vars: TemplateVariables): ModuleGenerationPaths {
  const moduleRoot = path.join(resolveModulesDir(), vars.nameKebab);

  return {
    moduleRoot,
    sharedTypesFile: path.join(moduleRoot, "types", `${vars.nameKebab}.types.ts`),
    clientRoot: path.join(moduleRoot, "client"),
    serverRoot: path.join(moduleRoot, "server"),
    clientSchemaFile: path.join(moduleRoot, "client", "schemas", `${vars.nameKebab}.schema.ts`),
    serverSchemaFile: path.join(moduleRoot, "server", "schemas", `${vars.nameKebab}.schema.ts`),
    sharedSchemaFile: path.join(moduleRoot, "schemas", `${vars.nameKebab}.schema.ts`),
  };
}

export function renderRootModuleIndex(
  vars: TemplateVariables,
  fragments: {
    backend?: string;
    frontend?: string;
  },
): string {
  return `export type { ${vars.Name}ListItem, ${vars.Name}Record, ${vars.Name}Response } from './types/${vars.nameKebab}.types';

/* FRAGMENT:backend */
${fragments.backend ?? ""}
/* END FRAGMENT:backend */

/* FRAGMENT:frontend */
${fragments.frontend ?? ""}
/* END FRAGMENT:frontend */
`;
}
