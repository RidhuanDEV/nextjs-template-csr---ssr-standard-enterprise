import path from 'node:path';
import { resolveComponentsDir, writeFileSafe } from '../utils/paths.js';
import { createVariables, renderTemplate } from '../utils/template.js';

const COMPONENT_TEMPLATE = `'use client';

interface {{Name}}Props {
  // TODO: define props
}

export function {{Name}}({ }: {{Name}}Props) {
  return (
    <div>
      <h2>{{Name}}</h2>
    </div>
  );
}
`;

export async function generateComponent(name: string, subdir?: string): Promise<void> {
  const vars = createVariables(name);
  const dir = subdir
    ? path.join(resolveComponentsDir(), subdir)
    : resolveComponentsDir();

  console.log(`\nGenerating component: ${vars.Name}\n`);

  await writeFileSafe(
    path.join(dir, `${vars.Name}.tsx`),
    renderTemplate(COMPONENT_TEMPLATE, vars)
  );

  console.log(`\nComponent "${vars.Name}" generated successfully.`);
}
