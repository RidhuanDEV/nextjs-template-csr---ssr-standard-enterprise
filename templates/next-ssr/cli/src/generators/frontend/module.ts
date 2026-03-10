import path from 'node:path';
import { resolveModulesDir, writeFileSafe, ensureDir } from '../../utils/paths.js';
import { createVariables, renderTemplate } from '../../utils/template.js';

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

const INDEX_TEMPLATE = `export type { {{Name}}, Create{{Name}}Payload, Update{{Name}}Payload } from './types/{{name}}.types';
export { create{{Name}}Schema, update{{Name}}Schema } from './schemas/{{name}}.schema';
`;

export async function generateFrontendModule(name: string): Promise<void> {
  const vars = createVariables(name);
  const moduleDir = path.join(resolveModulesDir(), name);

  console.log(`\nGenerating frontend module: ${name}\n`);

  await ensureDir(path.join(moduleDir, 'components'));
  await ensureDir(path.join(moduleDir, 'schemas'));
  await ensureDir(path.join(moduleDir, 'types'));

  await writeFileSafe(
    path.join(moduleDir, 'types', `${name}.types.ts`),
    renderTemplate(TYPES_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'schemas', `${name}.schema.ts`),
    renderTemplate(SCHEMA_TEMPLATE, vars)
  );
  await writeFileSafe(
    path.join(moduleDir, 'index.ts'),
    renderTemplate(INDEX_TEMPLATE, vars)
  );

  console.log(`\nFrontend module "${name}" generated successfully.`);
}
