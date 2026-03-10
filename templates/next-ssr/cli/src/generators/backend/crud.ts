import path from 'node:path';
import { resolveProjectRoot, writeFileSafe, ensureDir } from '../../utils/paths.js';
import { createVariables, renderTemplate } from '../../utils/template.js';
import { generateBackendModule } from './module.js';

const LIST_ROUTE_TEMPLATE = `import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { handleApiError } from '@/server/middleware/error-handler';
import { list{{NamePlural}}, create{{Name}}, search{{Name}}Schema, create{{Name}}Schema } from '@/modules/{{name}}';

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, '{{namePlural}}:read');

    const { searchParams } = new URL(request.url);
    const params = search{{Name}}Schema.parse(Object.fromEntries(searchParams));
    const result = await list{{NamePlural}}(params);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, '{{namePlural}}:create');

    const body = await request.json();
    const data = create{{Name}}Schema.parse(body);
    const result = await create{{Name}}(data, session.sub);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
`;

const DETAIL_ROUTE_TEMPLATE = `import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { handleApiError } from '@/server/middleware/error-handler';
import { get{{Name}}ById, update{{Name}}, delete{{Name}}, update{{Name}}Schema } from '@/modules/{{name}}';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, '{{namePlural}}:read');

    const { id } = await params;
    const result = await get{{Name}}ById(id);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, '{{namePlural}}:update');

    const { id } = await params;
    const body = await request.json();
    const data = update{{Name}}Schema.parse(body);
    const result = await update{{Name}}(id, data, session.sub);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, '{{namePlural}}:delete');

    const { id } = await params;
    await delete{{Name}}(id, session.sub);

    return NextResponse.json({ message: '{{Name}} deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
`;

export async function generateBackendCrud(name: string): Promise<void> {
  const vars = createVariables(name);
  const root = resolveProjectRoot();
  const apiDir = path.join(root, 'src', 'app', 'api', vars.namePlural);

  console.log(`\nGenerating backend CRUD for: ${name}\n`);

  // Generate the backend module (dto, schema, query, service, index)
  await generateBackendModule(name);

  // API routes
  await ensureDir(apiDir);
  await writeFileSafe(
    path.join(apiDir, 'route.ts'),
    renderTemplate(LIST_ROUTE_TEMPLATE, vars)
  );

  const detailDir = path.join(apiDir, '[id]');
  await ensureDir(detailDir);
  await writeFileSafe(
    path.join(detailDir, 'route.ts'),
    renderTemplate(DETAIL_ROUTE_TEMPLATE, vars)
  );

  console.log(`\nBackend CRUD for "${name}" generated successfully.`);
  console.log(`  API routes: src/app/api/${vars.namePlural}/`);
}
