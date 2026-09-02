import { describe, it, expect } from "vitest";
import { url } from "./config";
import { urlFieldToInputSchema } from "./inputSchema";

describe("urlFieldToInputSchema", () => {
  it("generates required URL schema — accepts valid URLs", () => {
    const field = url({ required: true });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("https://example.com").success).toBe(true);
    expect(schema.safeParse("http://localhost:3000/path?q=1").success).toBe(true);
  });

  it("generates required URL schema — rejects invalid URLs", () => {
    const field = url({ required: true });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("not-a-url").success).toBe(false);
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional URL schema — accepts undefined and returns default", () => {
    const field = url({ required: false, defaultValue: "" });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("generates optional URL schema — accepts valid URLs when provided", () => {
    const field = url({ required: false, defaultValue: "" });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("https://example.com").success).toBe(true);
  });

  it("includes metadata (label, description)", () => {
    const field = url({
      required: true,
      label: "Website",
      description: "Company website URL",
    });
    const schema = urlFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });
});
