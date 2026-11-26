import { describe, it, expect } from "vitest";
import { select } from "./config";
import { selectFieldToValidator } from "./validator";

const OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

describe("selectFieldToValidator", () => {
  it("generates required array union validator", () => {
    const field = select({ required: true, options: OPTIONS });
    const validator = selectFieldToValidator({ field });

    expect(validator).toBe(
      'v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
  });

  it("generates optional array union validator", () => {
    const field = select({ required: false, options: OPTIONS });
    const validator = selectFieldToValidator({ field });

    expect(validator).toBe(
      'v.optional(v.array(v.union(v.literal("draft"), v.literal("published"))))',
    );
  });

  it("generates validator with a single option", () => {
    const field = select({
      required: true,
      options: [{ label: "Active", value: "active" }],
    });
    const validator = selectFieldToValidator({ field });

    expect(validator).toBe('v.array(v.union(v.literal("active")))');
  });

  it("generates validator with no options (empty union)", () => {
    const field = select({ required: true, options: [] });
    const validator = selectFieldToValidator({ field });

    expect(validator).toBe("v.array(v.union())");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = select({ options: OPTIONS });
    const validator = selectFieldToValidator({ field });

    expect(validator).toBe(
      'v.optional(v.array(v.union(v.literal("draft"), v.literal("published"))))',
    );
  });
});

describe("selectFieldToValidator — schema.validator override", () => {
  it("stores v.string() for schema.validator: 'string'", () => {
    const field = select({ required: true, hasMany: false, schema: { validator: "string" }, options: OPTIONS });
    expect(selectFieldToValidator({ field })).toBe("v.string()");
  });

  it("stores a bare v.literal(...) for a single option with schema.validator: 'literal'", () => {
    const field = select({
      required: true,
      hasMany: false,
      schema: { validator: "literal" },
      options: [{ label: "Active", value: "active" }],
    });
    expect(selectFieldToValidator({ field })).toBe('v.literal("active")');
  });

  it("stores v.union(v.literal(...)) for multiple options with schema.validator: 'literal'", () => {
    const field = select({ required: true, hasMany: false, schema: { validator: "literal" }, options: OPTIONS });
    expect(selectFieldToValidator({ field })).toBe(
      'v.union(v.literal("draft"), v.literal("published"))',
    );
  });

  it("wraps the scalar validator in v.optional() when not required", () => {
    const field = select({ required: false, hasMany: false, schema: { validator: "string" }, options: OPTIONS });
    expect(selectFieldToValidator({ field })).toBe("v.optional(v.string())");
  });
});
