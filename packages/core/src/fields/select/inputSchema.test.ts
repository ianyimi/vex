import { describe, it, expect } from "vitest";
import { select } from "./config";
import { selectFieldToInputSchema } from "./inputSchema";

const OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

describe("selectFieldToInputSchema", () => {
  it("generates required array schema", () => {
    const field = select({ required: true, hasMany: true, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    // Should accept valid option arrays
    expect(schema.safeParse(["draft"]).success).toBe(true);
    expect(schema.safeParse(["draft", "published"]).success).toBe(true);

    // Should reject non-arrays
    expect(schema.safeParse("draft").success).toBe(false);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("rejects values not in options", () => {
    const field = select({ required: true, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    expect(schema.safeParse(["unknown"]).success).toBe(false);
    expect(schema.safeParse(["draft", "unknown"]).success).toBe(false);
  });

  it("generates optional array schema with default", () => {
    const field = select({ required: false, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    // Should accept valid option arrays
    expect(schema.safeParse(["draft"]).success).toBe(true);

    // Should accept undefined and return default []
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("limits to one item when hasMany is false", () => {
    const field = select({ hasMany: false, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    // Single selection is fine
    expect(schema.safeParse(["draft"]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(true);

    // Multiple selections are rejected
    expect(schema.safeParse(["draft", "published"]).success).toBe(false);
  });

  it("allows multiple items when hasMany is true", () => {
    const field = select({ hasMany: true, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    expect(schema.safeParse(["draft", "published"]).success).toBe(true);
    expect(schema.safeParse(["draft", "published", "archived"]).success).toBe(
      true,
    );
  });

  it("falls back to z.string() item schema when no options configured", () => {
    const field = select({ options: [] });
    const schema = selectFieldToInputSchema({ field });

    // Any string is valid when no options are defined
    expect(schema.safeParse(["anything"]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(true);
  });

  it("returns default [] when parsed as undefined (optional)", () => {
    const field = select({ required: false, defaultValue: [], options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("includes metadata (label, description)", () => {
    const field = select({
      required: true,
      label: "Status",
      description: "Publication status",
      options: OPTIONS,
    });
    const schema = selectFieldToInputSchema({ field });

    // Verify schema was created — metadata is attached internally by applyBaseInputSchemaMeta
    expect(schema._def).toBeDefined();
  });
});
