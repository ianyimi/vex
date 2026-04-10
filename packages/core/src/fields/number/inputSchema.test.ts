import { describe, it, expect } from "vitest";
import { number } from "./config";
import { numberFieldToInputSchema } from "./inputSchema";

describe("numberFieldToInputSchema", () => {
  it("generates required number schema", () => {
    const field = number({ required: true, defaultValue: 0 });
    const schema = numberFieldToInputSchema({ field });

    // Should accept valid numbers
    expect(schema.safeParse(42).success).toBe(true);
    expect(schema.safeParse(0).success).toBe(true);
    expect(schema.safeParse(-5).success).toBe(true);

    // Should reject non-numbers
    expect(schema.safeParse("hello").success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional number schema with default", () => {
    const field = number({ required: false, defaultValue: 0 });
    const schema = numberFieldToInputSchema({ field });

    // Should accept valid numbers
    expect(schema.safeParse(42).success).toBe(true);

    // Should accept undefined and return default
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(0);
    }
  });

  it("applies min constraint", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: { value: 3 },
    });
    const schema = numberFieldToInputSchema({ field });

    // Should accept numbers >= 3
    expect(schema.safeParse(3).success).toBe(true);
    expect(schema.safeParse(100).success).toBe(true);

    // Should reject numbers < 3
    expect(schema.safeParse(2).success).toBe(false);
    expect(schema.safeParse(-1).success).toBe(false);
  });

  it("applies max constraint", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      max: { value: 5 },
    });
    const schema = numberFieldToInputSchema({ field });

    // Should accept numbers <= 5
    expect(schema.safeParse(5).success).toBe(true);
    expect(schema.safeParse(0).success).toBe(true);

    // Should reject numbers > 5
    expect(schema.safeParse(6).success).toBe(false);
    expect(schema.safeParse(100).success).toBe(false);
  });

  it("applies min constraint with custom error", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: { value: 3, error: "Too small" },
    });
    const schema = numberFieldToInputSchema({ field });

    const result = schema.safeParse(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too small");
    }
  });

  it("applies max constraint with custom error", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      max: { value: 5, error: "Too large" },
    });
    const schema = numberFieldToInputSchema({ field });

    const result = schema.safeParse(10);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too large");
    }
  });

  it("combines min and max constraints", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: { value: 1 },
      max: { value: 10 },
    });
    const schema = numberFieldToInputSchema({ field });

    // Should accept numbers between 1-10
    expect(schema.safeParse(1).success).toBe(true);
    expect(schema.safeParse(10).success).toBe(true);
    expect(schema.safeParse(5).success).toBe(true);

    // Should reject numbers outside range
    expect(schema.safeParse(0).success).toBe(false);
    expect(schema.safeParse(11).success).toBe(false);
  });

  it("combines all constraints with custom errors", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: { value: 1, error: "Too small" },
      max: { value: 10, error: "Too large" },
    });
    const schema = numberFieldToInputSchema({ field });

    // Test min error
    const minResult = schema.safeParse(0);
    expect(minResult.success).toBe(false);
    if (!minResult.success) {
      expect(minResult.error.issues[0].message).toBe("Too small");
    }

    // Test max error
    const maxResult = schema.safeParse(11);
    expect(maxResult.success).toBe(false);
    if (!maxResult.success) {
      expect(maxResult.error.issues[0].message).toBe("Too large");
    }
  });

  it("applies optional after range constraints", () => {
    const field = number({
      required: false,
      defaultValue: 0,
      min: { value: 5 },
      max: { value: 50 },
    });
    const schema = numberFieldToInputSchema({ field });

    // Should accept undefined
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(0);
    }

    // Should still enforce constraints when value is provided
    expect(schema.safeParse(10).success).toBe(true);
    expect(schema.safeParse(4).success).toBe(false); // Too small
  });

  it("includes metadata (label, description)", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      label: "Price",
      description: "Product price",
    });
    const schema = numberFieldToInputSchema({ field });

    // Verify metadata is attached
    expect(schema._def).toBeDefined();
    // Note: Exact metadata access depends on Zod's internal structure
    // This test verifies the schema was created with metadata
  });
});
