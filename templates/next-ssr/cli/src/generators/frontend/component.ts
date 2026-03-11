import path from "node:path";
import { resolveModulesDir, writeFileSafe, ensureDir } from "../../utils/paths.js";
import { createComponentVariables, renderTemplate } from "../../utils/template.js";
import type { ComponentGenerationRequest } from "../../commands/generate.js";

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

export async function generateFrontendComponent(
  request: ComponentGenerationRequest,
): Promise<void> {
  const vars = createComponentVariables(request.componentName);
  const componentsDir = path.join(resolveModulesDir(), request.moduleName, "client", "components");

  console.log(
    `\nGenerating frontend component: ${request.componentName} in module ${request.moduleName}\n`,
  );

  await ensureDir(componentsDir);
  await writeFileSafe(
    path.join(componentsDir, `${vars.Name}.tsx`),
    renderTemplate(COMPONENT_TEMPLATE, vars),
  );

  console.log(
    `\nComponent "${vars.Name}" generated in src/modules/${request.moduleName}/client/components/.`,
  );
}
