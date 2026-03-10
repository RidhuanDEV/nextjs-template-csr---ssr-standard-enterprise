import path from 'node:path';
import { resolveModulesDir, writeFileSafe, ensureDir } from '../../utils/paths.js';
import { createVariables, renderTemplate } from '../../utils/template.js';

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

export async function generateFrontendComponent(
  moduleName: string,
  componentName: string
): Promise<void> {
  const vars = createVariables(componentName);
  const componentsDir = path.join(resolveModulesDir(), moduleName, 'components');

  console.log(`\nGenerating frontend component: ${componentName} in module ${moduleName}\n`);

  await ensureDir(componentsDir);
  await writeFileSafe(
    path.join(componentsDir, `${vars.Name}.tsx`),
    renderTemplate(COMPONENT_TEMPLATE, vars)
  );

  console.log(`\nComponent "${vars.Name}" generated in modules/${moduleName}/components/.`);
}
