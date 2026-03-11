import path from 'node:path';
import fs from 'fs-extra';
import { resolveConstantsDir, ensureDir } from '../utils/paths.js';
import type { TemplateVariables } from '../utils/template.js';

export async function updateModulesConstants(vars: TemplateVariables): Promise<void> {
  const constantsDir = resolveConstantsDir();
  await ensureDir(constantsDir);

  const filePath = path.join(constantsDir, 'modules.constants.ts');
  const entryLine = `  '${vars.nameKebab}',`;
  const exportLine = `export const APP_MODULES = [\n${entryLine}\n] as const;\n\nexport type AppModule = (typeof APP_MODULES)[number];\n`;

  if (!(await fs.pathExists(filePath))) {
    await fs.writeFile(filePath, exportLine, 'utf-8');
    console.log(`  CREATE ${filePath}`);
    return;
  }

  const content = await fs.readFile(filePath, 'utf-8');

  if (content.includes(`'${vars.nameKebab}'`)) {
    console.log(`  SKIP modules.constants.ts (already contains '${vars.nameKebab}')`);
    return;
  }

  const updated = content.replace(/] as const;/, `  '${vars.nameKebab}',\n] as const;`);

  await fs.writeFile(filePath, updated, 'utf-8');
  console.log(`  UPDATE modules.constants.ts (added '${vars.nameKebab}')`);
}

export async function updatePermissionsConstants(vars: TemplateVariables): Promise<void> {
  const constantsDir = resolveConstantsDir();
  await ensureDir(constantsDir);

  const filePath = path.join(constantsDir, 'permissions.constants.ts');
  const importLine = `import { ${vars.NAME}_PERMISSIONS } from '@/modules/${vars.nameKebab}/constants/${vars.nameKebab}.permissions';`;
  const spreadLine = `  ...${vars.NAME}_PERMISSIONS,`;

  const initialContent = `${importLine}\n\nexport const ALL_PERMISSIONS = {\n${spreadLine}\n} as const;\n\nexport type Permission = (typeof ALL_PERMISSIONS)[keyof typeof ALL_PERMISSIONS];\n`;

  if (!(await fs.pathExists(filePath))) {
    await fs.writeFile(filePath, initialContent, 'utf-8');
    console.log(`  CREATE ${filePath}`);
    return;
  }

  const content = await fs.readFile(filePath, 'utf-8');

  if (content.includes(`${vars.NAME}_PERMISSIONS`)) {
    console.log(`  SKIP permissions.constants.ts (already contains ${vars.NAME}_PERMISSIONS)`);
    return;
  }

  let updated = content;

  // Add import at the top (before the first empty line or before export)
  const firstExportIndex = updated.indexOf('export const ALL_PERMISSIONS');
  if (firstExportIndex > -1) {
    updated =
      updated.slice(0, firstExportIndex) + importLine + '\n' + updated.slice(firstExportIndex);
  }

  // Add spread inside ALL_PERMISSIONS object
  updated = updated.replace(/} as const;/, `${spreadLine}\n} as const;`);

  await fs.writeFile(filePath, updated, 'utf-8');
  console.log(`  UPDATE permissions.constants.ts (added ${vars.NAME}_PERMISSIONS)`);
}
