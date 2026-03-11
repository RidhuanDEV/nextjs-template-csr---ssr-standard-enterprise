import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { findProjectRoot, writeFileSafe } from "./paths.ts";

const tempDirectories: string[] = [];

async function createTempDirectory(prefix: string): Promise<string> {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirectories.push(tempDirectory);
  return tempDirectory;
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => fs.remove(directory)));
});

describe("path utilities", () => {
  it("resolves the next-ssr project root instead of cli/", async () => {
    const projectRoot = await createTempDirectory("next-ssr-project-");
    await Promise.all([
      fs.ensureDir(path.join(projectRoot, "src")),
      fs.ensureDir(path.join(projectRoot, "cli", "src", "utils")),
      fs.writeFile(path.join(projectRoot, "package.json"), "{}", "utf-8"),
    ]);

    const resolvedRoot = findProjectRoot(path.join(projectRoot, "cli", "src", "utils"));

    expect(resolvedRoot).toBe(projectRoot);
  });

  it("merges fragment files instead of skipping useful content", async () => {
    const targetDirectory = await createTempDirectory("next-ssr-merge-");
    const filePath = path.join(targetDirectory, "index.ts");

    await fs.writeFile(
      filePath,
      [
        "/* FRAGMENT:backend */",
        "export * from './server';",
        "/* END FRAGMENT:backend */",
        "",
        "/* FRAGMENT:frontend */",
        "/* END FRAGMENT:frontend */",
      ].join("\n"),
      "utf-8",
    );

    const result = await writeFileSafe(
      filePath,
      [
        "/* FRAGMENT:backend */",
        "/* END FRAGMENT:backend */",
        "",
        "/* FRAGMENT:frontend */",
        "export * from './client';",
        "/* END FRAGMENT:frontend */",
      ].join("\n"),
    );

    const mergedContent = await fs.readFile(filePath, "utf-8");

    expect(result.action).toBe("merged");
    expect(mergedContent).toContain("export * from './server';");
    expect(mergedContent).toContain("export * from './client';");
  });

  it("creates a .gen-conflict file when no fragment markers exist", async () => {
    const targetDirectory = await createTempDirectory("next-ssr-conflict-");
    const filePath = path.join(targetDirectory, "sidebar.tsx");

    await fs.writeFile(filePath, "export const sidebar = [];", "utf-8");

    const result = await writeFileSafe(
      filePath,
      "export const sidebar = [{ label: 'Products', href: '/products' }];",
    );

    expect(result.action).toBe("conflict");
    expect(result.conflictPath).toBe(filePath + ".gen-conflict");
    expect(await fs.pathExists(filePath + ".gen-conflict")).toBe(true);
  });
});
