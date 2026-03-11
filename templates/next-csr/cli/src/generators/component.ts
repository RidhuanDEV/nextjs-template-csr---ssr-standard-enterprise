import path from 'node:path';
import {
  resolveModulesDir,
  resolveComponentsDir,
  writeFileSafe,
  ensureDir,
} from '../utils/paths.ts';
import { createComponentVariables, renderTemplate } from '../utils/template.ts';

const COMPONENT_TEMPLATE = `'use client';

import type { ReactNode } from 'react';

interface {{Name}}Props {
  title?: string;
  children?: ReactNode;
}

export function {{Name}}({
  title = '{{Name}}',
  children,
}: {{Name}}Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
      </header>
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        {children ?? 'Replace this content with your own UI.'}
      </div>
    </section>
  );
}
`;

export interface ComponentGenerationRequest {
  componentName: string;
  moduleName: string;
}

export async function generateComponent(request: ComponentGenerationRequest): Promise<void> {
  const vars = createComponentVariables(request.componentName);
  const componentsDir = path.join(resolveModulesDir(), request.moduleName, 'components');

  console.log(`\nGenerating component: ${vars.Name} in module ${request.moduleName}\n`);

  await ensureDir(componentsDir);
  await writeFileSafe(
    path.join(componentsDir, `${vars.Name}.tsx`),
    renderTemplate(COMPONENT_TEMPLATE, vars)
  );

  console.log(
    `\nComponent "${vars.Name}" generated in src/modules/${request.moduleName}/components/.`
  );
}

export async function generateGlobalComponent(name: string, subdir?: string): Promise<void> {
  const vars = createComponentVariables(name);
  const dir = subdir ? path.join(resolveComponentsDir(), subdir) : resolveComponentsDir();

  console.log(`\nGenerating global component: ${vars.Name}\n`);

  await ensureDir(dir);
  await writeFileSafe(path.join(dir, `${vars.Name}.tsx`), renderTemplate(COMPONENT_TEMPLATE, vars));

  console.log(`\nComponent "${vars.Name}" generated successfully.`);
}
