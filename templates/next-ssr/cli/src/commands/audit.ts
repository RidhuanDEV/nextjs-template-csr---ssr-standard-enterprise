import path from "node:path";
import fs from "fs-extra";
import type { Command } from "commander";
import { resolveProjectRoot } from "../utils/paths.js";

interface AuditFinding {
  category: "structure" | "quality" | "security" | "performance";
  severity: "error" | "warning" | "info";
  module: string;
  message: string;
}

interface ModuleAuditResult {
  name: string;
  score: number;
  findings: AuditFinding[];
}

const EXPECTED_SERVER_DIRS = [
  "constants",
  "dto",
  "mappers",
  "policies",
  "queries",
  "schemas",
  "services",
  "tests",
] as const;

async function auditModule(moduleName: string, moduleDir: string): Promise<ModuleAuditResult> {
  const findings: AuditFinding[] = [];
  let score = 100;

  // Check for server/ directory
  const serverDir = path.join(moduleDir, "server");
  const hasServer = await fs.pathExists(serverDir);

  if (!hasServer) {
    findings.push({
      category: "structure",
      severity: "info",
      module: moduleName,
      message: "No server/ directory — may be frontend-only module",
    });
  }

  // Check server subdirectories
  if (hasServer) {
    for (const expected of EXPECTED_SERVER_DIRS) {
      const target = path.join(serverDir, expected);
      if (!(await fs.pathExists(target))) {
        findings.push({
          category: "structure",
          severity: "warning",
          module: moduleName,
          message: `Missing server/${expected}/ directory`,
        });
        score -= 5;
      }
    }

    // Check for mapper file
    const mappersDir = path.join(serverDir, "mappers");
    if (await fs.pathExists(mappersDir)) {
      const files = await fs.readdir(mappersDir);
      if (files.length === 0) {
        findings.push({
          category: "quality",
          severity: "warning",
          module: moduleName,
          message: "server/mappers/ is empty — no data mappers",
        });
        score -= 5;
      }
    }

    // Check for policy file
    const policiesDir = path.join(serverDir, "policies");
    if (await fs.pathExists(policiesDir)) {
      const files = await fs.readdir(policiesDir);
      if (files.length === 0) {
        findings.push({
          category: "security",
          severity: "warning",
          module: moduleName,
          message: "server/policies/ is empty — no access policies",
        });
        score -= 8;
      }
    }

    // Check for tests
    const testsDir = path.join(serverDir, "tests");
    if (await fs.pathExists(testsDir)) {
      const testFiles = await fs.readdir(testsDir);
      if (testFiles.length === 0) {
        findings.push({
          category: "quality",
          severity: "error",
          module: moduleName,
          message: "server/tests/ is empty — no test coverage",
        });
        score -= 15;
      }
    }
  }

  // Check shared types
  const typesFile = path.join(moduleDir, "types");
  if (!(await fs.pathExists(typesFile))) {
    findings.push({
      category: "structure",
      severity: "warning",
      module: moduleName,
      message: "No types/ directory for shared type definitions",
    });
    score -= 5;
  }

  // Check index.ts barrel
  const indexPath = path.join(moduleDir, "index.ts");
  if (await fs.pathExists(indexPath)) {
    const content = await fs.readFile(indexPath, "utf-8");
    if (!content.includes("export")) {
      findings.push({
        category: "quality",
        severity: "warning",
        module: moduleName,
        message: "index.ts has no exports — barrel file may be empty",
      });
      score -= 10;
    }
  } else {
    findings.push({
      category: "structure",
      severity: "error",
      module: moduleName,
      message: "Missing index.ts barrel file",
    });
    score -= 10;
  }

  // Scan for `any` types and console.log across all TS files
  const allFiles = await collectTsFiles(moduleDir);
  for (const file of allFiles) {
    const content = await fs.readFile(file, "utf-8");
    const relPath = path.relative(moduleDir, file);

    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 0) {
      findings.push({
        category: "quality",
        severity: "error",
        module: moduleName,
        message: `${relPath} contains ${anyMatches.length} usage(s) of 'any' type`,
      });
      score -= anyMatches.length * 3;
    }

    if (content.includes("console.log") && !file.includes("test")) {
      findings.push({
        category: "quality",
        severity: "warning",
        module: moduleName,
        message: `${relPath} contains console.log statements`,
      });
      score -= 2;
    }

    // Check for hardcoded secrets patterns
    if (/(?:password|secret|token)\s*[:=]\s*['"][^'"]+['"]/i.test(content)) {
      findings.push({
        category: "security",
        severity: "error",
        module: moduleName,
        message: `${relPath} may contain hardcoded credentials`,
      });
      score -= 20;
    }
  }

  // Check CRUD pages exist in app directory
  const projectRoot = resolveProjectRoot();
  const appDir = path.join(projectRoot, "src", "app", "(dashboard)");
  if (await fs.pathExists(appDir)) {
    const appEntries = await fs.readdir(appDir);
    const hasPages = appEntries.some((e: string) => e.includes(moduleName) || e === moduleName);
    if (!hasPages) {
      findings.push({
        category: "structure",
        severity: "info",
        module: moduleName,
        message:
          "No CRUD pages found in app/(dashboard)/ — run generate frontend crud or generate fullstack crud",
      });
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
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

function severityIcon(severity: AuditFinding["severity"]): string {
  switch (severity) {
    case "error":
      return "[ERROR]";
    case "warning":
      return "[WARN] ";
    case "info":
      return "[INFO] ";
  }
}

export function registerAuditCommand(program: Command): void {
  program
    .command("audit")
    .description("Audit generated modules for quality, structure, and security")
    .option("-m, --module <name>", "Audit a specific module only")
    .action(async (options: { module?: string }) => {
      const projectRoot = resolveProjectRoot();
      const modulesDir = path.join(projectRoot, "src", "modules");

      if (!(await fs.pathExists(modulesDir))) {
        console.error("No src/modules/ directory found. Nothing to audit.");
        process.exit(1);
      }

      const allModules = (await fs.readdir(modulesDir, { withFileTypes: true }))
        .filter((d: fs.Dirent) => d.isDirectory())
        .map((d: fs.Dirent) => d.name);

      const modulesToAudit = options.module
        ? allModules.filter((m: string) => m === options.module)
        : allModules;

      if (modulesToAudit.length === 0) {
        console.log("No modules found to audit.");
        return;
      }

      console.log(`\n  SSR Fullstack Module Audit Report`);
      console.log(`  ${"=".repeat(44)}\n`);

      const results: ModuleAuditResult[] = [];

      for (const mod of modulesToAudit) {
        const result = await auditModule(mod, path.join(modulesDir, mod));
        results.push(result);
      }

      // Print results
      for (const result of results) {
        const grade =
          result.score >= 90
            ? "A"
            : result.score >= 80
              ? "B"
              : result.score >= 70
                ? "C"
                : result.score >= 60
                  ? "D"
                  : "F";

        console.log(`  Module: ${result.name}  [${grade}] ${result.score}/100`);

        if (result.findings.length === 0) {
          console.log(`    No issues found.\n`);
        } else {
          for (const f of result.findings) {
            console.log(`    ${severityIcon(f.severity)} [${f.category}] ${f.message}`);
          }
          console.log("");
        }
      }

      // Summary
      const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
      const totalErrors = results.reduce(
        (sum, r) => sum + r.findings.filter((f) => f.severity === "error").length,
        0,
      );
      const totalWarnings = results.reduce(
        (sum, r) => sum + r.findings.filter((f) => f.severity === "warning").length,
        0,
      );

      console.log(`  ${"=".repeat(44)}`);
      console.log(`  Enterprise Readiness Score: ${totalScore}/100`);
      console.log(
        `  ${results.length} module(s) audited | ${totalErrors} error(s) | ${totalWarnings} warning(s)`,
      );
      console.log("");
    });
}
