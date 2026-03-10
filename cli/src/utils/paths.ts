import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveProjectRoot(): string {
  return process.cwd();
}

export function resolveModulesDir(): string {
  return path.join(resolveProjectRoot(), 'src', 'modules');
}

export function resolveComponentsDir(): string {
  return path.join(resolveProjectRoot(), 'src', 'components');
}

export function resolveAppDir(): string {
  return path.join(resolveProjectRoot(), 'src', 'app');
}

export function resolveTemplatesDir(): string {
  return path.join(__dirname, '..', 'templates');
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

export async function writeFileSafe(filePath: string, content: string): Promise<boolean> {
  if (await fileExists(filePath)) {
    console.log(`  SKIP ${path.basename(filePath)} (already exists)`);
    return false;
  }
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
  console.log(`  CREATE ${path.relative(process.cwd(), filePath)}`);
  return true;
}
