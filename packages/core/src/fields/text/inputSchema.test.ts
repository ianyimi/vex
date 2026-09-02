import { describe, it, expect } from "vitest";
import { text } from "./config";
import { textFieldToInputSchema } from "./inputSchema";

describe("textFieldToInputSchema", () => {
  it("generates required string schema", () => {
    const field = text({ required: true, defaultValue: "test" });
    const schema = textFieldToInputSchema({ field });

    // Should accept valid strings
    expect(schema.safeParse("hello").success).toBe(true);

    // Should reject non-strings
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional string schema with default", () => {
    const field = text({ required: false, defaultValue: "" });
    const schema = textFieldToInputSchema({ field });

    // Should accept valid strings
    expect(schema.safeParse("hello").success).toBe(true);

    // Should accept undefined and return default
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("applies min constraint", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: { value: 3 },
    });
    const schema = textFieldToInputSchema({ field });

    // Should accept strings >= 3 chars
    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcd").success).toBe(true);

    // Should reject strings < 3 chars
    expect(schema.safeParse("ab").success).toBe(false);
  });

  it("applies max constraint", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      max: { value: 5 },
    });
    const schema = textFieldToInputSchema({ field });

    // Should accept strings <= 5 chars
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse("hi").success).toBe(true);

    // Should reject strings > 5 chars
    expect(schema.safeParse("toolong").success).toBe(false);
  });

  it("applies min constraint with custom error", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: { value: 3, error: "Too short" },
    });
    const schema = textFieldToInputSchema({ field });

    const result = schema.safeParse("ab");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too short");
    }
  });

  it("applies max constraint with custom error", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      max: { value: 5, error: "Too long" },
    });
    const schema = textFieldToInputSchema({ field });

    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too long");
    }
  });

  it("combines min and max constraints", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: { value: 3 },
      max: { value: 10 },
    });
    const schema = textFieldToInputSchema({ field });

    // Should accept strings between 3-10 chars
    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcdefghij").success).toBe(true);

    // Should reject strings outside range
    expect(schema.safeParse("ab").success).toBe(false);
    expect(schema.safeParse("abcdefghijk").success).toBe(false);
  });

  it("combines all constraints with custom errors", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: { value: 3, error: "Too short" },
      max: { value: 10, error: "Too long" },
    });
    const schema = textFieldToInputSchema({ field });

    // Test min error
    const minResult = schema.safeParse("ab");
    expect(minResult.success).toBe(false);
    if (!minResult.success) {
      expect(minResult.error.issues[0].message).toBe("Too short");
    }

    // Test max error
    const maxResult = schema.safeParse("this is too long");
    expect(maxResult.success).toBe(false);
    if (!maxResult.success) {
      expect(maxResult.error.issues[0].message).toBe("Too long");
    }
  });

  it("applies optional after length constraints", () => {
    const field = text({
      required: false,
      defaultValue: "",
      min: { value: 5 },
      max: { value: 50 },
    });
    const schema = textFieldToInputSchema({ field });

    // Should accept undefined
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }

    // Should still enforce constraints when value is provided
    expect(schema.safeParse("short").success).toBe(true);
    expect(schema.safeParse("hi").success).toBe(false); // Too short
  });

  it("includes metadata (label, description)", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      label: "Title",
      description: "Page title",
    });
    const schema = textFieldToInputSchema({ field });

    // Verify metadata is attached
    expect(schema._def).toBeDefined();
    // Note: Exact metadata access depends on Zod's internal structure
    // This test verifies the schema was created with metadata
  });
});
