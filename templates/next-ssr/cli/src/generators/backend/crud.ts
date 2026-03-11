import path from "node:path";
import { ensureDir, fileExists, resolveProjectRoot, writeFileSafe } from "../../utils/paths.js";
import { createVariables, renderTemplate } from "../../utils/template.js";
import { generateBackendModule } from "./module.js";
import { getModuleGenerationPaths, type GeneratorLayoutOptions } from "../shared.js";

const LIST_ROUTE_TEMPLATE = `import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { handleApiError } from '@/server/middleware/error-handler';
import {
  create{{Name}},
  create{{Name}}Schema,
  list{{NamePlural}},
  search{{NamePlural}}Schema,
  {{NAME}}_PERMISSIONS,
} from '@/modules/{{nameKebab}}/server';

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, {{NAME}}_PERMISSIONS.READ);

    const { searchParams } = new URL(request.url);
    const params = search{{NamePlural}}Schema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    });
    const result = await list{{NamePlural}}(params);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, {{NAME}}_PERMISSIONS.CREATE);

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
import {
  delete{{Name}},
  get{{Name}}ById,
  update{{Name}},
  update{{Name}}Schema,
  {{NAME}}_PERMISSIONS,
} from '@/modules/{{nameKebab}}/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, {{NAME}}_PERMISSIONS.READ);

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
    requirePermission(session, {{NAME}}_PERMISSIONS.UPDATE);

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
    requirePermission(session, {{NAME}}_PERMISSIONS.DELETE);

    const { id } = await params;
    await delete{{Name}}(id, session.sub);

    return NextResponse.json({ message: '{{Name}} deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
`;

async function hasBackendModuleScaffold(name: string): Promise<boolean> {
  const vars = createVariables(name);
  const modulePaths = getModuleGenerationPaths(vars);
  const markerFiles = [
    path.join(modulePaths.serverRoot, "index.ts"),
    path.join(modulePaths.serverRoot, "schemas", `${vars.nameKebab}.schema.ts`),
    path.join(modulePaths.serverRoot, "services", `${vars.nameKebab}.service.ts`),
  ];

  const markerStates = await Promise.all(markerFiles.map((filePath) => fileExists(filePath)));

  return markerStates.every(Boolean);
}

async function ensureBackendModuleForCrud(
  name: string,
  options: GeneratorLayoutOptions,
): Promise<"created" | "reused"> {
  const vars = createVariables(name);

  if (await hasBackendModuleScaffold(name)) {
    console.log(`  REUSE src/modules/${vars.nameKebab}/server (backend module already exists)`);
    return "reused";
  }

  console.log(
    `  BOOTSTRAP src/modules/${vars.nameKebab}/server (backend module missing, generating base scaffold first)`,
  );
  await generateBackendModule(name, options);

  return "created";
}

export async function generateBackendCrud(
  name: string,
  options: GeneratorLayoutOptions = {},
): Promise<void> {
  const vars = createVariables(name);
  const root = resolveProjectRoot();
  const apiDir = path.join(root, "src", "app", "api", vars.namePluralKebab);

  console.log(`\nGenerating backend CRUD for: ${vars.nameKebab}\n`);

  const bootstrapState = await ensureBackendModuleForCrud(name, options);

  await ensureDir(apiDir);
  await writeFileSafe(path.join(apiDir, "route.ts"), renderTemplate(LIST_ROUTE_TEMPLATE, vars));

  const detailDir = path.join(apiDir, "[id]");
  await ensureDir(detailDir);
  await writeFileSafe(
    path.join(detailDir, "route.ts"),
    renderTemplate(DETAIL_ROUTE_TEMPLATE, vars),
  );

  console.log(`\nBackend CRUD for "${vars.nameKebab}" generated successfully.`);
  console.log(`  API routes: src/app/api/${vars.namePluralKebab}/`);
  console.log(
    `  Flow: ${bootstrapState === "created" ? "backend module bootstrapped" : "existing backend module reused"} -> CRUD routes generated`,
  );
}
