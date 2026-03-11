import { describe, expect, it } from "vitest";
import { createVariables, normalizeEntityName } from "./template.ts";

describe("template naming utilities", () => {
  it("normalizes entity names to singular kebab-case", () => {
    expect(normalizeEntityName("Product Categories")).toBe("product-category");
  });

  it("builds plural, camel, snake, and upper snake variables", () => {
    const vars = createVariables("product-category");

    expect(vars.nameKebab).toBe("product-category");
    expect(vars.nameSnake).toBe("product_category");
    expect(vars.nameCamel).toBe("productCategory");
    expect(vars.Name).toBe("ProductCategory");
    expect(vars.namePlural).toBe("productCategories");
    expect(vars.namePluralKebab).toBe("product-categories");
    expect(vars.NamePlural).toBe("ProductCategories");
    expect(vars.NAME).toBe("PRODUCT_CATEGORY");
  });
});
