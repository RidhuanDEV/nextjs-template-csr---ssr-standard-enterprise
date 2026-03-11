import path from "node:path";
import { ensureDir, writeFileSafe } from "../../utils/paths.js";
import { createVariables, renderTemplate } from "../../utils/template.js";
import {
  getModuleGenerationPaths,
  type GeneratorLayoutOptions,
  renderRootModuleIndex,
  SHARED_SCHEMA_TEMPLATE,
  SHARED_TYPES_TEMPLATE,
} from "../shared.js";

const CLIENT_INDEX_TEMPLATE = `export {
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
/* END FRAGMENT:forms-components */
`;

const CLIENT_SCHEMA_PROXY_TEMPLATE = `export {
  create{{Name}}FormSchema,
  paginated{{NamePlural}}Schema,
  search{{NamePlural}}FilterSchema,
  update{{Name}}FormSchema,
  {{nameCamel}}ResponseSchema,
} from '../../schemas/{{nameKebab}}.schema';
export type {
  Create{{Name}}ClientInput,
  Search{{NamePlural}}Filters,
  Update{{Name}}ClientInput,
} from '../../schemas/{{nameKebab}}.schema';
`;

const HTTP_ADAPTER_TEMPLATE = `import type { PaginatedResponse } from '@/lib/query/pagination';
import type { {{Name}}Response } from '../../types/{{nameKebab}}.types';
import {
  create{{Name}}FormSchema,
  paginated{{NamePlural}}Schema,
  search{{NamePlural}}FilterSchema,
  update{{Name}}FormSchema,
  {{nameCamel}}ResponseSchema,
  type Create{{Name}}ClientInput,
  type Search{{NamePlural}}Filters,
  type Update{{Name}}ClientInput,
} from '../schemas/{{nameKebab}}.schema';

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

export interface {{Name}}HttpClient {
  list(filters: Search{{NamePlural}}Filters): Promise<PaginatedResponse<{{Name}}Response>>;
  getById(id: string): Promise<{{Name}}Response>;
  create(input: Create{{Name}}ClientInput): Promise<{{Name}}Response>;
  update(id: string, input: Update{{Name}}ClientInput): Promise<{{Name}}Response>;
  remove(id: string): Promise<void>;
}

function toSearchParams(filters: Search{{NamePlural}}Filters): URLSearchParams {
  const params = new URLSearchParams();

  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.sort) {
    params.set('sort', filters.sort);
  }

  return params;
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.error ?? payload.message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string,
  parser: { parse: (value: object) => T },
): Promise<T> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackMessage));
  }

  const payload = (await response.json()) as object;
  return parser.parse(payload);
}

export function create{{Name}}HttpClient(
  basePath = '/api/{{namePluralKebab}}',
): {{Name}}HttpClient {
  return {
    list: async (filters) => {
      const normalizedFilters = search{{NamePlural}}FilterSchema.parse(filters);
      const response = await fetch(basePath + '?' + toSearchParams(normalizedFilters).toString(), {
        cache: 'no-store',
      });

      return parseResponse(
        response,
        'Failed to load {{namePluralKebab}}.',
        paginated{{NamePlural}}Schema,
      );
    },
    getById: async (id) => {
      const response = await fetch(basePath + '/' + id, { cache: 'no-store' });

      return parseResponse(
        response,
        'Failed to load {{nameKebab}}.',
        {{nameCamel}}ResponseSchema,
      );
    },
    create: async (input) => {
      const payload = create{{Name}}FormSchema.parse(input);
      const response = await fetch(basePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return parseResponse(
        response,
        'Failed to create {{nameKebab}}.',
        {{nameCamel}}ResponseSchema,
      );
    },
    update: async (id, input) => {
      const payload = update{{Name}}FormSchema.parse(input);
      const response = await fetch(basePath + '/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return parseResponse(
        response,
        'Failed to update {{nameKebab}}.',
        {{nameCamel}}ResponseSchema,
      );
    },
    remove: async (id) => {
      const response = await fetch(basePath + '/' + id, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to delete {{nameKebab}}.'));
      }
    },
  };
}
`;

const SCHEMA_TEST_TEMPLATE = `import { describe, expect, it } from 'vitest';
import {
  create{{Name}}FormSchema,
  search{{NamePlural}}FilterSchema,
} from '../schemas/{{nameKebab}}.schema';

describe('{{Name}} client schema', () => {
  it('normalizes valid form values', () => {
    const result = create{{Name}}FormSchema.parse({
      name: '  {{Name}} Example  ',
      description: '  Generated scaffold  ',
    });

    expect(result).toEqual({
      name: '{{Name}} Example',
      description: 'Generated scaffold',
    });
  });

  it('rejects empty names', () => {
    const result = create{{Name}}FormSchema.safeParse({
      name: '',
      description: '',
    });

    expect(result.success).toBe(false);
  });

  it('applies search defaults', () => {
    const result = search{{NamePlural}}FilterSchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});
`;

function renderClientSchemaTemplate(options: GeneratorLayoutOptions): string {
  if (options.merge) {
    return CLIENT_SCHEMA_PROXY_TEMPLATE;
  }

  return SHARED_SCHEMA_TEMPLATE;
}

export async function generateFrontendModule(
  name: string,
  options: GeneratorLayoutOptions = {},
): Promise<void> {
  const vars = createVariables(name);
  const modulePaths = getModuleGenerationPaths(vars);

  console.log(`\nGenerating frontend module: ${vars.nameKebab}\n`);

  await Promise.all([
    ensureDir(path.dirname(modulePaths.sharedTypesFile)),
    ensureDir(path.join(modulePaths.clientRoot, "adapters")),
    ensureDir(path.join(modulePaths.clientRoot, "components")),
    ensureDir(path.join(modulePaths.clientRoot, "forms")),
    ensureDir(path.join(modulePaths.clientRoot, "schemas")),
    ensureDir(path.join(modulePaths.clientRoot, "tests")),
    ...(options.merge ? [ensureDir(path.dirname(modulePaths.sharedSchemaFile))] : []),
  ]);

  await writeFileSafe(modulePaths.sharedTypesFile, renderTemplate(SHARED_TYPES_TEMPLATE, vars));

  if (options.merge) {
    await writeFileSafe(modulePaths.sharedSchemaFile, renderTemplate(SHARED_SCHEMA_TEMPLATE, vars));
  }

  await writeFileSafe(
    path.join(modulePaths.moduleRoot, "index.ts"),
    renderRootModuleIndex(vars, {
      frontend: `export * from './client';`,
    }),
  );
  await writeFileSafe(
    modulePaths.clientSchemaFile,
    renderTemplate(renderClientSchemaTemplate(options), vars),
  );
  await writeFileSafe(
    path.join(modulePaths.clientRoot, "adapters", `${vars.nameKebab}.http.ts`),
    renderTemplate(HTTP_ADAPTER_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.clientRoot, "tests", `${vars.nameKebab}.schema.test.ts`),
    renderTemplate(SCHEMA_TEST_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.clientRoot, "index.ts"),
    renderTemplate(CLIENT_INDEX_TEMPLATE, vars),
  );

  console.log(`\nFrontend module "${vars.nameKebab}" generated successfully.`);
  console.log(`  Location: src/modules/${vars.nameKebab}/client`);
}
