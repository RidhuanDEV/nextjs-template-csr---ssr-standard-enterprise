import { describe, expect, it } from "vitest";
import { resolveComponentGenerationRequest } from "./generate.ts";

describe("component generation request", () => {
  it("uses the provided --dir value as the module name", () => {
    expect(resolveComponentGenerationRequest("ProductSummaryCard", { dir: "catalog" })).toEqual({
      componentName: "ProductSummaryCard",
      moduleName: "catalog",
    });
  });

  it("falls back to the first parameter as the module name when --dir is omitted", () => {
    expect(resolveComponentGenerationRequest("ProductCard", {})).toEqual({
      componentName: "ProductCard",
      moduleName: "product-card",
    });
  });
});
