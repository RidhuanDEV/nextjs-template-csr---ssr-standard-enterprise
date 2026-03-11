import path from "node:path";
import fs from "fs-extra";
import { resolveProjectRoot, ensureDir } from "../../utils/paths.ts";
import type { TemplateVariables } from "../../utils/template.ts";

export async function updateModulesConstants(vars: TemplateVariables): Promise<void> {
  const constantsDir = path.join(resolveProjectRoot(), "src", "lib", "constants");
  await ensureDir(constantsDir);

  const filePath = path.join(constantsDir, "modules.constants.ts");
  const entryLine = `  '${vars.nameKebab}',`;
  const exportLine = `export const APP_MODULES = [\n${entryLine}\n] as const;\n\nexport type AppModule = (typeof APP_MODULES)[number];\n`;

  if (!(await fs.pathExists(filePath))) {
    await fs.writeFile(filePath, exportLine, "utf-8");
    console.log(`  CREATE ${filePath}`);
    return;
  }

  const content = await fs.readFile(filePath, "utf-8");

  if (content.includes(`'${vars.nameKebab}'`)) {
    console.log(`  SKIP modules.constants.ts (already contains '${vars.nameKebab}')`);
    return;
  }

  const updated = content.replace(/] as const;/, `  '${vars.nameKebab}',\n] as const;`);

  await fs.writeFile(filePath, updated, "utf-8");
  console.log(`  UPDATE modules.constants.ts (added '${vars.nameKebab}')`);
}

export async function updatePermissionsConstants(vars: TemplateVariables): Promise<void> {
  const constantsDir = path.join(resolveProjectRoot(), "src", "lib", "constants");
  const filePath = path.join(constantsDir, "permissions.ts");

  if (!(await fs.pathExists(filePath))) {
    console.log(`  SKIP permissions.ts (file not found)`);
    return;
  }

  const content = await fs.readFile(filePath, "utf-8");

  if (content.includes(`${vars.NAME_PLURAL}_READ`)) {
    console.log(`  SKIP permissions.ts (already contains ${vars.NAME_PLURAL} permissions)`);
    return;
  }

  // Add new permissions to the PERMISSIONS object
  const newPermissions = [
    `  ${vars.NAME_PLURAL}_READ: '${vars.namePluralKebab}:read',`,
    `  ${vars.NAME_PLURAL}_CREATE: '${vars.namePluralKebab}:create',`,
    `  ${vars.NAME_PLURAL}_UPDATE: '${vars.namePluralKebab}:update',`,
    `  ${vars.NAME_PLURAL}_DELETE: '${vars.namePluralKebab}:delete',`,
  ].join("\n");

  const updated = content.replace(
    /} as const;\n\nexport type Permission/,
    `${newPermissions}\n} as const;\n\nexport type Permission`,
  );

  await fs.writeFile(filePath, updated, "utf-8");
  console.log(`  UPDATE permissions.ts (added ${vars.namePluralKebab} permissions)`);
}
