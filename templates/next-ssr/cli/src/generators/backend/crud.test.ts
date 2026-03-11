import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureDir: vi.fn(async () => undefined),
  fileExists: vi.fn(async () => false),
  generateBackendModule: vi.fn(async () => undefined),
  writeFileSafe: vi.fn(async () => ({
    action: "created" as const,
    targetPath: "/workspace/target.ts",
  })),
}));

vi.mock("../../utils/paths.ts", () => ({
  ensureDir: mocks.ensureDir,
  fileExists: mocks.fileExists,
  resolveModulesDir: () => "/workspace/src/modules",
  resolveProjectRoot: () => "/workspace",
  writeFileSafe: mocks.writeFileSafe,
}));

vi.mock("./module.ts", () => ({
  generateBackendModule: mocks.generateBackendModule,
}));

const { generateBackendCrud } = await import("./crud.ts");

describe("generateBackendCrud", () => {
  beforeEach(() => {
    mocks.ensureDir.mockClear();
    mocks.fileExists.mockClear();
    mocks.generateBackendModule.mockClear();
    mocks.writeFileSafe.mockClear();
  });

  it("bootstraps the backend module before generating CRUD routes when the module scaffold is missing", async () => {
    mocks.fileExists.mockResolvedValue(false);
    const expectedApiDir = path.join("/workspace", "src", "app", "api", "products");

    await generateBackendCrud("product");

    expect(mocks.generateBackendModule).toHaveBeenCalledWith("product", {});
    expect(mocks.ensureDir).toHaveBeenCalledWith(expectedApiDir);
    expect(mocks.writeFileSafe).toHaveBeenCalledTimes(2);
  });

  it("reuses the existing backend module scaffold and only generates CRUD routes when the module already exists", async () => {
    mocks.fileExists.mockResolvedValue(true);
    const expectedApiDir = path.join("/workspace", "src", "app", "api", "products");

    await generateBackendCrud("product");

    expect(mocks.generateBackendModule).not.toHaveBeenCalled();
    expect(mocks.ensureDir).toHaveBeenCalledWith(expectedApiDir);
    expect(mocks.writeFileSafe).toHaveBeenCalledTimes(2);
  });
});
