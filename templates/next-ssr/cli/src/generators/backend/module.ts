import path from 'node:path';
import { resolveServerDir, writeFileSafe, ensureDir } from '../../utils/paths.js';
import { createVariables, renderTemplate } from '../../utils/template.js';

const DTO_TEMPLATE = `import type { {{Name}} } from '@prisma/client';

export interface {{Name}}Response {
  id: string;
  // TODO: add response fields
  createdAt: Date;
  updatedAt: Date;
}

export function to{{Name}}Response({{name}}: {{Name}}): {{Name}}Response {
  return {
    id: {{name}}.id,
    // TODO: map fields
    createdAt: {{name}}.createdAt,
    updatedAt: {{name}}.updatedAt,
  };
}

export function to{{Name}}ListResponse({{namePlural}}: {{Name}}[]): {{Name}}Response[] {
  return {{namePlural}}.map(to{{Name}}Response);
}
`;

const SCHEMA_TEMPLATE = `import { z } from 'zod';

export const create{{Name}}Schema = z.object({
  // TODO: add fields
});

export const update{{Name}}Schema = create{{Name}}Schema.partial();

export const search{{Name}}Schema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional().default(''),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});
`;

const QUERY_TEMPLATE = `import { QueryBuilder } from '@/lib/query/query-builder';
import type { z } from 'zod';
import type { search{{Name}}Schema } from '../schemas/{{name}}.schema';

type Search{{Name}}Params = z.infer<typeof search{{Name}}Schema>;

export function build{{Name}}Query(params: Search{{Name}}Params) {
  return new QueryBuilder()
    .withSearch(params.search, [/* TODO: add searchable fields e.g. 'name', 'description' */])
    .withSort(params.sort, params.order)
    .withPagination(params.page, params.limit)
    .build();
}
`;

const SERVICE_TEMPLATE = `import { prisma } from '@/server/db/prisma';
import { cacheDel, cacheDelPattern, cacheGet, cacheSet } from '@/server/cache/redis';
import { createAuditLog } from '@/server/middleware/audit-log';
import { createLogger } from '@/server/logger';
import { paginate } from '@/lib/query/pagination';
import { build{{Name}}Query } from '../queries/{{name}}.query';
import { to{{Name}}Response, to{{Name}}ListResponse } from '../dto/{{name}}-response.dto';
import type { z } from 'zod';
import type { create{{Name}}Schema, update{{Name}}Schema, search{{Name}}Schema } from '../schemas/{{name}}.schema';

const logger = createLogger('{{name}}-service');

type Create{{Name}}Input = z.infer<typeof create{{Name}}Schema>;
type Update{{Name}}Input = z.infer<typeof update{{Name}}Schema>;
type Search{{Name}}Params = z.infer<typeof search{{Name}}Schema>;

const CACHE_PREFIX = '{{name}}';

export async function list{{NamePlural}}(params: Search{{Name}}Params) {
  const { where, orderBy, skip, take } = build{{Name}}Query(params);

  const [{{namePlural}}, total] = await Promise.all([
    prisma.{{name}}.findMany({ where, orderBy, skip, take }),
    prisma.{{name}}.count({ where }),
  ]);

  return paginate(to{{Name}}ListResponse({{namePlural}}), total, params.page, params.limit);
}

export async function get{{Name}}ById(id: string) {
  const cached = await cacheGet(\`\${CACHE_PREFIX}:\${id}\`);
  if (cached) return JSON.parse(cached);

  const {{name}} = await prisma.{{name}}.findUnique({ where: { id } });
  if (!{{name}}) throw new Error('{{Name}} not found');

  const response = to{{Name}}Response({{name}});
  await cacheSet(\`\${CACHE_PREFIX}:\${id}\`, JSON.stringify(response), 300);
  return response;
}

export async function create{{Name}}(data: Create{{Name}}Input, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const {{name}} = await tx.{{name}}.create({ data });

    await createAuditLog({
      userId: actorId,
      action: '{{NAME}}_CREATED',
      entity: '{{Name}}',
      entityId: {{name}}.id,
    });

    logger.info({ {{name}}Id: {{name}}.id }, '{{Name}} created');
    return to{{Name}}Response({{name}});
  });
}

export async function update{{Name}}(id: string, data: Update{{Name}}Input, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.{{name}}.findUnique({ where: { id } });
    if (!existing) throw new Error('{{Name}} not found');

    const {{name}} = await tx.{{name}}.update({ where: { id }, data });

    await createAuditLog({
      userId: actorId,
      action: '{{NAME}}_UPDATED',
      entity: '{{Name}}',
      entityId: id,
    });

    await cacheDel(\`\${CACHE_PREFIX}:\${id}\`);
    await cacheDelPattern(\`\${CACHE_PREFIX}:list:*\`);

    logger.info({ {{name}}Id: id }, '{{Name}} updated');
    return to{{Name}}Response({{name}});
  });
}

export async function delete{{Name}}(id: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.{{name}}.findUnique({ where: { id } });
    if (!existing) throw new Error('{{Name}} not found');

    await tx.{{name}}.delete({ where: { id } });

    await createAuditLog({
      userId: actorId,
      action: '{{NAME}}_DELETED',
      entity: '{{Name}}',
      entityId: id,
    });

    await cacheDel(\`\${CACHE_PREFIX}:\${id}\`);
    await cacheDelPattern(\`\${CACHE_PREFIX}:list:*\`);

    logger.info({ {{name}}Id: id }, '{{Name}} deleted');
  });
}
`;

const INDEX_TEMPLATE = `export { list{{NamePlural}}, get{{Name}}ById, create{{Name}}, update{{Name}}, delete{{Name}} } from './services/{{name}}.service';
export { create{{Name}}Schema, update{{Name}}Schema, search{{Name}}Schema } from './schemas/{{name}}.schema';
export type { {{Name}}Response } from './dto/{{name}}-response.dto';
`;

export async function generateBackendModule(name: string): Promise<void> {
  const vars = createVariables(name);
  const moduleDir = path.join(resolveServerDir(), '..', 'modules', name);

  console.log(`\nGenerating backend module: ${name}\n`);

  await ensureDir(path.join(moduleDir, 'dto'));
  await ensureDir(path.join(moduleDir, 'schemas'));
  await ensureDir(path.join(moduleDir, 'queries'));
  await ensureDir(path.join(moduleDir, 'services'));

  await writeFileSafe(
    path.join(moduleDir, 'dto', `${name}-response.dto.ts`),
    renderTemplate(DTO_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'schemas', `${name}.schema.ts`),
    renderTemplate(SCHEMA_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'queries', `${name}.query.ts`),
    renderTemplate(QUERY_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'services', `${name}.service.ts`),
    renderTemplate(SERVICE_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'index.ts'),
    renderTemplate(INDEX_TEMPLATE, vars)
  );

  console.log(`\nBackend module "${name}" generated successfully.`);
  console.log(`  Location: src/modules/${name}/`);
  console.log(`\n  Don't forget to:`);
  console.log(`  1. Add the "${vars.Name}" model to prisma/schema.prisma`);
  console.log(`  2. Run: npx prisma migrate dev`);
  console.log(`  3. Add permissions to src/lib/constants/permissions.ts`);
}
