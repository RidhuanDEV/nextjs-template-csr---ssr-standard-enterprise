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
import { updateModulesConstants, updatePermissionsConstants } from "./constants.js";

const PERMISSIONS_TEMPLATE = `export const {{NAME}}_PERMISSIONS = {
  READ: '{{namePluralKebab}}:read',
  CREATE: '{{namePluralKebab}}:create',
  UPDATE: '{{namePluralKebab}}:update',
  DELETE: '{{namePluralKebab}}:delete',
} as const;

export type {{Name}}Permission =
  (typeof {{NAME}}_PERMISSIONS)[keyof typeof {{NAME}}_PERMISSIONS];
`;

const EVENTS_TEMPLATE = `export const {{NAME}}_DOMAIN_EVENTS = {
  CREATED: '{{nameKebab}}.created',
  UPDATED: '{{nameKebab}}.updated',
  DELETED: '{{nameKebab}}.deleted',
} as const;

export type {{Name}}DomainEvent =
  (typeof {{NAME}}_DOMAIN_EVENTS)[keyof typeof {{NAME}}_DOMAIN_EVENTS];
`;

const DTO_TEMPLATE = `import type {
  {{Name}}Record,
  {{Name}}Response,
} from '../../types/{{nameKebab}}.types';

export function to{{Name}}Response(record: {{Name}}Record): {{Name}}Response {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
`;

const MAPPER_TEMPLATE = `import type { Create{{Name}}Input, Update{{Name}}Input } from '../schemas/{{nameKebab}}.schema';
import type { {{Name}}Record, {{Name}}Response } from '../../types/{{nameKebab}}.types';

// How to use:
// - Keep request/data/output shape translation here so services stay focused on orchestration.
// When to extend manually:
// - Add relation flattening, enum labels, derived fields, upload URLs, or API-specific response shaping.

export function toCreateData(input: Create{{Name}}Input): {
  name: string;
  description?: string | null;
} {
  return {
    name: input.name,
    ...(input.description !== undefined
      ? { description: input.description ?? null }
      : {}),
  };
}

export function toUpdateData(input: Update{{Name}}Input): {
  name?: string;
  description?: string | null;
} {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined
      ? { description: input.description ?? null }
      : {}),
  };
}

export function toResponse(record: {{Name}}Record): {{Name}}Response {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toListItem(record: {{Name}}Record): {{Name}}Response {
  return toResponse(record);
}
`;

const POLICY_TEMPLATE = `import type { {{Name}}Record } from '../../types/{{nameKebab}}.types';

// TODO: Replace permissive defaults before production.
// How to use:
// - Centralize record-level authorization here when access depends on ownership, role, tenant, or workflow state.
// When to extend manually:
// - Add ownership checks, tenant isolation, soft-delete visibility, approval flow rules, or field-level restrictions.

interface PolicyContext {
  userId: string;
  roles: string[];
}

export const {{nameCamel}}Policy = {
  canRead(_ctx: PolicyContext, _record: {{Name}}Record): boolean {
    return true;
  },

  canCreate(_ctx: PolicyContext): boolean {
    return true;
  },

  canUpdate(ctx: PolicyContext, record: {{Name}}Record): boolean {
    return ctx.roles.includes('admin') || ctx.roles.includes('editor');
  },

  canDelete(ctx: PolicyContext, _record: {{Name}}Record): boolean {
    return ctx.roles.includes('admin');
  },
} as const;
`;

const QUERY_TEMPLATE = `import type { Search{{NamePlural}}Input } from '../schemas/{{nameKebab}}.schema';

// How to use:
// - Keep pagination, filtering, and sorting rules here so routes/services stay thin.
// When to extend manually:
// - Add tenant scoping, status/date filters, relation filters, cursor pagination, or compound sorting rules.

type SortDirection = 'asc' | 'desc';
type QueryPrimitive = string | number | boolean | null;

interface QueryStringFilter {
  contains: string;
  mode: 'insensitive';
}

export type {{Name}}QueryValue =
  | QueryPrimitive
  | Date
  | QueryStringFilter
  | {{Name}}QueryObject
  | {{Name}}QueryObject[];

export interface {{Name}}QueryObject {
  [key: string]: {{Name}}QueryValue;
}

export interface {{Name}}QueryResult {
  skip: number;
  take: number;
  where: {{Name}}QueryObject;
  orderBy: Record<string, SortDirection>;
}

const SORT_FIELDS = ['name', 'createdAt', 'updatedAt'] as const;
type SortField = (typeof SORT_FIELDS)[number];

function isSortField(value: string): value is SortField {
  return SORT_FIELDS.includes(value as SortField);
}

export function build{{Name}}Query(
  params: Search{{NamePlural}}Input,
): {{Name}}QueryResult {
  const where: {{Name}}QueryObject = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const rawSort = params.sort ?? '-createdAt';
  const isDescending = rawSort.startsWith('-');
  const requestedField = isDescending ? rawSort.slice(1) : rawSort;
  const sortField = isSortField(requestedField) ? requestedField : 'createdAt';

  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
    where,
    orderBy: {
      [sortField]: isDescending ? 'desc' : 'asc',
    },
  };
}
`;

const SERVICE_TEMPLATE = `import { prisma } from '@/server/db/prisma';
import {
  cacheDel,
  cacheDelPattern,
  cacheGet,
  cacheSet,
} from '@/server/cache/redis';
import { createLogger } from '@/server/logger';
import { createAuditLog } from '@/server/middleware/audit-log';
import { paginate, type PaginatedResponse } from '@/lib/query/pagination';
import type { {{Name}}Record, {{Name}}Response } from '../../types/{{nameKebab}}.types';
import { toResponse, toCreateData, toUpdateData } from '../mappers/{{nameKebab}}.mapper';
import { {{NAME}}_DOMAIN_EVENTS } from '../constants/{{nameKebab}}.events';
import {
  build{{Name}}Query,
  type {{Name}}QueryResult,
} from '../queries/{{nameKebab}}.query';
import type {
  Create{{Name}}Input,
  Search{{NamePlural}}Input,
  Update{{Name}}Input,
} from '../schemas/{{nameKebab}}.schema';

// How to use:
// - Keep service methods focused on orchestration: persistence, caching, audit logs, and transaction boundaries.
// When to extend manually:
// - Add policy checks for ownership/tenant rules.
// - Move slow or non-critical side effects (emails, webhooks, exports, image processing) into BullMQ jobs via '@/server/queue'.
// - Expand cache invalidation when you introduce dashboard aggregates or denormalized read models.

interface {{Name}}Delegate {
  findMany(args: {{Name}}QueryResult): Promise<{{Name}}Record[]>;
  count(args: Pick<{{Name}}QueryResult, 'where'>): Promise<number>;
  findUnique(args: { where: { id: string } }): Promise<{{Name}}Record | null>;
  create(args: {
    data: {
      name: string;
      description?: string | null;
    };
  }): Promise<{{Name}}Record>;
  update(args: {
    where: { id: string };
    data: {
      name?: string;
      description?: string | null;
    };
  }): Promise<{{Name}}Record>;
  delete(args: { where: { id: string } }): Promise<{{Name}}Record>;
}

const logger = createLogger('{{nameKebab}}-service');
const CACHE_PREFIX = '{{namePluralKebab}}';
const MODEL_KEY = '{{nameCamel}}';

function get{{Name}}Delegate(client: object): {{Name}}Delegate {
  const delegate = Reflect.get(client, MODEL_KEY) as {{Name}}Delegate | undefined;

  if (!delegate) {
    throw new Error(
      'Prisma model "{{nameCamel}}" is unavailable. Add the {{Name}} model to prisma/schema.prisma, then run "npm run db:generate".',
    );
  }

  return delegate;
}

export async function list{{NamePlural}}(
  params: Search{{NamePlural}}Input,
): Promise<PaginatedResponse<{{Name}}Response>> {
  const delegate = get{{Name}}Delegate(prisma);
  const query = build{{Name}}Query(params);

  const [records, total] = await Promise.all([
    delegate.findMany(query),
    delegate.count({ where: query.where }),
  ]);

  return paginate(records.map(toResponse), total, params.page, params.limit);
}

export async function get{{Name}}ById(id: string): Promise<{{Name}}Response> {
  const cacheKey = CACHE_PREFIX + ':' + id;
  const cachedValue = await cacheGet<{{Name}}Response>(cacheKey);

  if (cachedValue) {
    return cachedValue;
  }

  const delegate = get{{Name}}Delegate(prisma);
  const record = await delegate.findUnique({ where: { id } });

  if (!record) {
    throw new Error('{{Name}} not found');
  }

  const response = toResponse(record);
  await cacheSet(cacheKey, response, 300);

  return response;
}

export async function create{{Name}}(
  input: Create{{Name}}Input,
  actorId: string,
): Promise<{{Name}}Response> {
  return prisma.$transaction(async (tx) => {
    const delegate = get{{Name}}Delegate(tx);
    const createdRecord = await delegate.create({
      data: toCreateData(input),
    });

    await createAuditLog(
      {
        userId: actorId,
        action: {{NAME}}_DOMAIN_EVENTS.CREATED,
        entity: '{{nameKebab}}',
        entityId: createdRecord.id,
        metadata: {
          name: createdRecord.name,
        },
      },
      tx,
    );

    await cacheDelPattern(CACHE_PREFIX + ':list:*');
    logger.info({ entityId: createdRecord.id }, '{{Name}} created');

    return toResponse(createdRecord);
  });
}

export async function update{{Name}}(
  id: string,
  input: Update{{Name}}Input,
  actorId: string,
): Promise<{{Name}}Response> {
  return prisma.$transaction(async (tx) => {
    const delegate = get{{Name}}Delegate(tx);
    const existingRecord = await delegate.findUnique({ where: { id } });

    if (!existingRecord) {
      throw new Error('{{Name}} not found');
    }

    const updateData = toUpdateData(input);
    const updatedRecord = await delegate.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog(
      {
        userId: actorId,
        action: {{NAME}}_DOMAIN_EVENTS.UPDATED,
        entity: '{{nameKebab}}',
        entityId: id,
        metadata: {
          fields: Object.keys(updateData),
        },
      },
      tx,
    );

    await Promise.all([
      cacheDel(CACHE_PREFIX + ':' + id),
      cacheDelPattern(CACHE_PREFIX + ':list:*'),
    ]);

    logger.info({ entityId: id }, '{{Name}} updated');

    return toResponse(updatedRecord);
  });
}

export async function delete{{Name}}(
  id: string,
  actorId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const delegate = get{{Name}}Delegate(tx);
    const existingRecord = await delegate.findUnique({ where: { id } });

    if (!existingRecord) {
      throw new Error('{{Name}} not found');
    }

    await delegate.delete({ where: { id } });

    await createAuditLog(
      {
        userId: actorId,
        action: {{NAME}}_DOMAIN_EVENTS.DELETED,
        entity: '{{nameKebab}}',
        entityId: id,
      },
      tx,
    );
  });

  await Promise.all([
    cacheDel(CACHE_PREFIX + ':' + id),
    cacheDelPattern(CACHE_PREFIX + ':list:*'),
  ]);

  logger.info({ entityId: id }, '{{Name}} deleted');
}
`;

const INDEX_TEMPLATE = `export { {{NAME}}_DOMAIN_EVENTS } from './constants/{{nameKebab}}.events';
export { {{NAME}}_PERMISSIONS } from './constants/{{nameKebab}}.permissions';
export { to{{Name}}Response } from './dto/{{nameKebab}}-response.dto';
export { toResponse, toCreateData, toUpdateData } from './mappers/{{nameKebab}}.mapper';
export { {{nameCamel}}Policy } from './policies/{{nameKebab}}.policy';
export type { {{Name}}Response } from '../types/{{nameKebab}}.types';
export {
  create{{Name}}Schema,
  search{{NamePlural}}Schema,
  update{{Name}}Schema,
} from './schemas/{{nameKebab}}.schema';
export type {
  Create{{Name}}Input,
  Search{{NamePlural}}Input,
  Update{{Name}}Input,
} from './schemas/{{nameKebab}}.schema';
export { build{{Name}}Query } from './queries/{{nameKebab}}.query';
export {
  create{{Name}},
  delete{{Name}},
  get{{Name}}ById,
  list{{NamePlural}},
  update{{Name}},
} from './services/{{nameKebab}}.service';
`;

const SERVICE_TEST_TEMPLATE = `import { beforeEach, describe, expect, it, vi } from 'vitest';
import { {{nameCamel}}PrismaMock, reset{{Name}}PrismaMock, sample{{Name}}Record } from '../testing/{{nameKebab}}.prisma.mock';

vi.mock('@/server/db/prisma', () => ({
  prisma: {{nameCamel}}PrismaMock,
}));

vi.mock('@/server/cache/redis', () => ({
  cacheGet: vi.fn(async () => null),
  cacheSet: vi.fn(async () => undefined),
  cacheDel: vi.fn(async () => undefined),
  cacheDelPattern: vi.fn(async () => undefined),
}));

vi.mock('@/server/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { cacheDelPattern } from '@/server/cache/redis';
import { create{{Name}}, list{{NamePlural}} } from '../services/{{nameKebab}}.service';

describe('{{Name}} service', () => {
  beforeEach(() => {
    reset{{Name}}PrismaMock();
    vi.mocked(cacheDelPattern).mockReset();
  });

  it('lists paginated records', async () => {
    {{nameCamel}}PrismaMock.{{nameCamel}}.findMany.mockResolvedValue([sample{{Name}}Record]);
    {{nameCamel}}PrismaMock.{{nameCamel}}.count.mockResolvedValue(1);

    const result = await list{{NamePlural}}({
      page: 1,
      limit: 10,
      search: 'sample',
      sort: '-createdAt',
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe(sample{{Name}}Record.name);
    expect(result.meta.total).toBe(1);
  });

  it('creates a record and writes an audit log inside the transaction', async () => {
    {{nameCamel}}PrismaMock.{{nameCamel}}.create.mockResolvedValue(sample{{Name}}Record);

    const created = await create{{Name}}(
      {
        name: sample{{Name}}Record.name,
        description: sample{{Name}}Record.description ?? undefined,
      },
      'actor-123',
    );

    expect(created.id).toBe(sample{{Name}}Record.id);
    expect({{nameCamel}}PrismaMock.auditLog.create).toHaveBeenCalledTimes(1);
    expect(cacheDelPattern).toHaveBeenCalledWith('{{namePluralKebab}}:list:*');
  });
});
`;

const QUERY_TEST_TEMPLATE = `import { describe, expect, it } from 'vitest';
import { build{{Name}}Query } from '../queries/{{nameKebab}}.query';

describe('build{{Name}}Query', () => {
  it('creates pagination, search, and descending sort metadata', () => {
    const query = build{{Name}}Query({
      page: 2,
      limit: 5,
      search: 'example',
      sort: '-updatedAt',
    });

    expect(query.skip).toBe(5);
    expect(query.take).toBe(5);
    expect(query.orderBy).toEqual({ updatedAt: 'desc' });
    expect(query.where).toMatchObject({
      OR: [
        { name: { contains: 'example', mode: 'insensitive' } },
        { description: { contains: 'example', mode: 'insensitive' } },
      ],
    });
  });
});
`;

const PRISMA_MOCK_TEMPLATE = `import { vi } from 'vitest';
import type { {{Name}}Record } from '../../types/{{nameKebab}}.types';

export const sample{{Name}}Record: {{Name}}Record = {
  id: '{{nameKebab}}-1',
  name: '{{Name}} Example',
  description: 'Generated {{nameKebab}} example record',
  createdAt: new Date('2026-03-10T00:00:00.000Z'),
  updatedAt: new Date('2026-03-10T00:00:00.000Z'),
};

const {{nameCamel}}Delegate = {
  findMany: vi.fn(async () => [] as {{Name}}Record[]),
  count: vi.fn(async () => 0),
  findUnique: vi.fn(async () => null as {{Name}}Record | null),
  create: vi.fn(async () => sample{{Name}}Record),
  update: vi.fn(async () => sample{{Name}}Record),
  delete: vi.fn(async () => sample{{Name}}Record),
};

const auditLog = {
  create: vi.fn(async () => undefined),
};

export const {{nameCamel}}PrismaMock = {
  {{nameCamel}}: {{nameCamel}}Delegate,
  auditLog,
  async $transaction<T>(
    callback: (tx: {
      {{nameCamel}}: typeof {{nameCamel}}Delegate;
      auditLog: typeof auditLog;
    }) => Promise<T>,
  ): Promise<T> {
    return callback({
      {{nameCamel}}: {{nameCamel}}Delegate,
      auditLog,
    });
  },
};

export function reset{{Name}}PrismaMock(): void {
  {{nameCamel}}Delegate.findMany.mockReset();
  {{nameCamel}}Delegate.count.mockReset();
  {{nameCamel}}Delegate.findUnique.mockReset();
  {{nameCamel}}Delegate.create.mockReset();
  {{nameCamel}}Delegate.update.mockReset();
  {{nameCamel}}Delegate.delete.mockReset();
  auditLog.create.mockReset();
}
`;

function renderServerSchemaTemplate(
  vars: ReturnType<typeof createVariables>,
  options: GeneratorLayoutOptions,
): string {
  if (options.merge) {
    return `export {
  create{{Name}}Schema,
  search{{NamePlural}}Schema,
  update{{Name}}Schema,
} from '../../schemas/{{nameKebab}}.schema';
export type {
  Create{{Name}}Input,
  Search{{NamePlural}}Input,
  Update{{Name}}Input,
} from '../../schemas/{{nameKebab}}.schema';
`;
  }

  return SHARED_SCHEMA_TEMPLATE;
}

export async function generateBackendModule(
  name: string,
  options: GeneratorLayoutOptions = {},
): Promise<void> {
  const vars = createVariables(name);
  const modulePaths = getModuleGenerationPaths(vars);

  console.log(`\nGenerating backend module: ${vars.nameKebab}\n`);

  await Promise.all([
    ensureDir(path.dirname(modulePaths.sharedTypesFile)),
    ensureDir(path.join(modulePaths.serverRoot, "constants")),
    ensureDir(path.join(modulePaths.serverRoot, "dto")),
    ensureDir(path.join(modulePaths.serverRoot, "mappers")),
    ensureDir(path.join(modulePaths.serverRoot, "policies")),
    ensureDir(path.join(modulePaths.serverRoot, "queries")),
    ensureDir(path.join(modulePaths.serverRoot, "schemas")),
    ensureDir(path.join(modulePaths.serverRoot, "services")),
    ensureDir(path.join(modulePaths.serverRoot, "testing")),
    ensureDir(path.join(modulePaths.serverRoot, "tests")),
    ...(options.merge ? [ensureDir(path.dirname(modulePaths.sharedSchemaFile))] : []),
  ]);

  await writeFileSafe(modulePaths.sharedTypesFile, renderTemplate(SHARED_TYPES_TEMPLATE, vars));

  if (options.merge) {
    await writeFileSafe(modulePaths.sharedSchemaFile, renderTemplate(SHARED_SCHEMA_TEMPLATE, vars));
  }

  await writeFileSafe(
    path.join(modulePaths.moduleRoot, "index.ts"),
    renderRootModuleIndex(vars, {
      backend: `export * from './server';`,
    }),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "constants", `${vars.nameKebab}.permissions.ts`),
    renderTemplate(PERMISSIONS_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "constants", `${vars.nameKebab}.events.ts`),
    renderTemplate(EVENTS_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "dto", `${vars.nameKebab}-response.dto.ts`),
    renderTemplate(DTO_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "mappers", `${vars.nameKebab}.mapper.ts`),
    renderTemplate(MAPPER_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "policies", `${vars.nameKebab}.policy.ts`),
    renderTemplate(POLICY_TEMPLATE, vars),
  );
  await writeFileSafe(
    modulePaths.serverSchemaFile,
    renderTemplate(renderServerSchemaTemplate(vars, options), vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "queries", `${vars.nameKebab}.query.ts`),
    renderTemplate(QUERY_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "services", `${vars.nameKebab}.service.ts`),
    renderTemplate(SERVICE_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "testing", `${vars.nameKebab}.prisma.mock.ts`),
    renderTemplate(PRISMA_MOCK_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "tests", `${vars.nameKebab}.service.test.ts`),
    renderTemplate(SERVICE_TEST_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "tests", `${vars.nameKebab}.query.test.ts`),
    renderTemplate(QUERY_TEST_TEMPLATE, vars),
  );
  await writeFileSafe(
    path.join(modulePaths.serverRoot, "index.ts"),
    renderTemplate(INDEX_TEMPLATE, vars),
  );

  // Auto-update global constants
  await updateModulesConstants(vars);
  await updatePermissionsConstants(vars);

  console.log(`\nBackend module "${vars.nameKebab}" generated successfully.`);
  console.log(`  Location: src/modules/${vars.nameKebab}/server`);
  console.log(`\n  Don't forget to:`);
  console.log(`  1. Add the "${vars.Name}" model to prisma/schema.prisma`);
  console.log(`  2. Run: npm run db:migrate`);
  console.log(`  3. Run: npm run db:generate`);
}
