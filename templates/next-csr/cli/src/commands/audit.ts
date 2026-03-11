import path from 'node:path';
import fs from 'fs-extra';
import type { Command } from 'commander';
import { resolveProjectRoot } from '../utils/paths.ts';

interface AuditFinding {
  category: 'structure' | 'quality' | 'security' | 'performance';
  severity: 'error' | 'warning' | 'info';
  module: string;
  message: string;
}

interface ModuleAuditResult {
  name: string;
  score: number;
  findings: AuditFinding[];
}

const EXPECTED_MODULE_FILES = [
  'index.ts',
  'types',
  'services',
  'hooks',
  'schemas',
  'constants',
] as const;

async function auditModule(moduleName: string, moduleDir: string): Promise<ModuleAuditResult> {
  const findings: AuditFinding[] = [];
  let score = 100;

  // Check essential directories & files
  for (const expected of EXPECTED_MODULE_FILES) {
    const target = path.join(moduleDir, expected);
    if (!(await fs.pathExists(target))) {
      findings.push({
        category: 'structure',
        severity: 'warning',
        module: moduleName,
        message: `Missing ${expected}/ directory or file`,
      });
      score -= 5;
    }
  }

  // Check index.ts has exports
  const indexPath = path.join(moduleDir, 'index.ts');
  if (await fs.pathExists(indexPath)) {
    const content = await fs.readFile(indexPath, 'utf-8');
    if (!content.includes('export')) {
      findings.push({
        category: 'quality',
        severity: 'warning',
        module: moduleName,
        message: 'index.ts has no exports — barrel file may be empty',
      });
      score -= 10;
    }
  }

  // Check for Zod schema
  const schemasDir = path.join(moduleDir, 'schemas');
  if (await fs.pathExists(schemasDir)) {
    const schemaFiles = await fs.readdir(schemasDir);
    if (schemaFiles.length === 0) {
      findings.push({
        category: 'quality',
        severity: 'warning',
        module: moduleName,
        message: 'schemas/ directory is empty — no validation schemas',
      });
      score -= 10;
    }
  }

  // Check for types
  const typesDir = path.join(moduleDir, 'types');
  if (await fs.pathExists(typesDir)) {
    const typeFiles = await fs.readdir(typesDir);
    if (typeFiles.length === 0) {
      findings.push({
        category: 'quality',
        severity: 'warning',
        module: moduleName,
        message: 'types/ directory is empty — no type definitions',
      });
      score -= 10;
    }
  }

  // Check CRUD pages exist in app directory
  const projectRoot = resolveProjectRoot();
  const appDir = path.join(projectRoot, 'src', 'app', '(dashboard)');
  if (await fs.pathExists(appDir)) {
    const appEntries = await fs.readdir(appDir);
    const hasPages = appEntries.some((e: string) => e.includes(moduleName) || e === moduleName);
    if (!hasPages) {
      findings.push({
        category: 'structure',
        severity: 'info',
        module: moduleName,
        message: 'No CRUD pages found in app/(dashboard)/ — run generate crud',
      });
      score -= 5;
    }
  }

  // Check for any `any` types in module files
  const allFiles = await collectTsFiles(moduleDir);
  for (const file of allFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 0) {
      findings.push({
        category: 'quality',
        severity: 'error',
        module: moduleName,
        message: `${path.relative(moduleDir, file)} contains ${anyMatches.length} usage(s) of 'any' type`,
      });
      score -= anyMatches.length * 3;
    }

    // Check for console.log
    if (content.includes('console.log')) {
      findings.push({
        category: 'quality',
        severity: 'warning',
        module: moduleName,
        message: `${path.relative(moduleDir, file)} contains console.log statements`,
      });
      score -= 2;
    }
  }

  return {
    name: moduleName,
    score: Math.max(0, Math.min(100, score)),
    findings,
  };
}

async function collectTsFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  if (!(await fs.pathExists(dir))) return results;

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectTsFiles(full)));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

function severityIcon(severity: AuditFinding['severity']): string {
  switch (severity) {
    case 'error':
      return '[ERROR]';
    case 'warning':
      return '[WARN] ';
    case 'info':
      return '[INFO] ';
  }
}

export function registerAuditCommand(program: Command): void {
  program
    .command('audit')
    .description('Audit generated modules for quality, structure, and security')
    .option('-m, --module <name>', 'Audit a specific module only')
    .action(async (options: { module?: string }) => {
      const projectRoot = resolveProjectRoot();
      const modulesDir = path.join(projectRoot, 'src', 'modules');

      if (!(await fs.pathExists(modulesDir))) {
        console.error('No src/modules/ directory found. Nothing to audit.');
        process.exit(1);
      }

      const allModules = (await fs.readdir(modulesDir, { withFileTypes: true }))
        .filter((d: fs.Dirent) => d.isDirectory())
        .map((d: fs.Dirent) => d.name);

      const modulesToAudit = options.module
        ? allModules.filter((m: string) => m === options.module)
        : allModules;

      if (modulesToAudit.length === 0) {
        console.log('No modules found to audit.');
        return;
      }

      console.log(`\n  CSR Module Audit Report`);
      console.log(`  ${'='.repeat(40)}\n`);

      const results: ModuleAuditResult[] = [];

      for (const mod of modulesToAudit) {
        const result = await auditModule(mod, path.join(modulesDir, mod));
        results.push(result);
      }

      // Print results
      for (const result of results) {
        const grade =
          result.score >= 90
            ? 'A'
            : result.score >= 80
              ? 'B'
              : result.score >= 70
                ? 'C'
                : result.score >= 60
                  ? 'D'
                  : 'F';

        console.log(`  Module: ${result.name}  [${grade}] ${result.score}/100`);

        if (result.findings.length === 0) {
          console.log(`    No issues found.\n`);
        } else {
          for (const f of result.findings) {
            console.log(`    ${severityIcon(f.severity)} [${f.category}] ${f.message}`);
          }
          console.log('');
        }
      }

      // Summary
      const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
      const totalErrors = results.reduce(
        (sum, r) => sum + r.findings.filter((f) => f.severity === 'error').length,
        0
      );
      const totalWarnings = results.reduce(
        (sum, r) => sum + r.findings.filter((f) => f.severity === 'warning').length,
        0
      );

      console.log(`  ${'='.repeat(40)}`);
      console.log(`  Enterprise Readiness Score: ${totalScore}/100`);
      console.log(
        `  ${results.length} module(s) audited | ${totalErrors} error(s) | ${totalWarnings} warning(s)`
      );
      console.log('');
    });
}
