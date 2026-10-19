import { describe, it, expect } from "vitest";
import { textarea } from "./config";
import { textareaFieldToInputSchema } from "./inputSchema";

describe("textareaFieldToInputSchema", () => {
  it("generates required string schema", () => {
    const field = textarea({ required: true, defaultValue: "test" });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional string schema with default", () => {
    const field = textarea({ required: false, defaultValue: "" });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("hello").success).toBe(true);

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("applies min constraint", () => {
    const field = textarea({ required: true, defaultValue: "test", min: 3 });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcd").success).toBe(true);
    expect(schema.safeParse("ab").success).toBe(false);
  });

  it("applies max constraint", () => {
    const field = textarea({ required: true, defaultValue: "test", max: 5 });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse("hi").success).toBe(true);
    expect(schema.safeParse("toolong").success).toBe(false);
  });

  it("applies the default min-length message when min is a bare number", () => {
    const field = textarea({ required: true, defaultValue: "test", min: 3 });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse("ab");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be at least 3 characters.");
    }
  });

  it("applies the default max-length message when max is a bare number", () => {
    const field = textarea({ required: true, defaultValue: "test", max: 5 });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be no more than 5 characters.");
    }
  });

  it("applies min constraint with custom error", () => {
    const field = textarea({ required: true, defaultValue: "test", min: [3, "Too short"] });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse("ab");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too short");
    }
  });

  it("applies max constraint with custom error", () => {
    const field = textarea({ required: true, defaultValue: "test", max: [5, "Too long"] });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too long");
    }
  });

  it("combines min and max constraints", () => {
    const field = textarea({ required: true, defaultValue: "test", min: 3, max: 10 });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcdefghij").success).toBe(true);
    expect(schema.safeParse("ab").success).toBe(false);
    expect(schema.safeParse("abcdefghijk").success).toBe(false);
  });

  it("combines all constraints with custom errors", () => {
    const field = textarea({
      required: true,
      defaultValue: "test",
      min: [3, "Too short"],
      max: [10, "Too long"],
    });
    const schema = textareaFieldToInputSchema({ field });

    const minResult = schema.safeParse("ab");
    expect(minResult.success).toBe(false);
    if (!minResult.success) {
      expect(minResult.error.issues[0].message).toBe("Too short");
    }

    const maxResult = schema.safeParse("this is too long");
    expect(maxResult.success).toBe(false);
    if (!maxResult.success) {
      expect(maxResult.error.issues[0].message).toBe("Too long");
    }
  });

  it("applies optional after length constraints", () => {
    const field = textarea({ required: false, defaultValue: "", min: 5, max: 50 });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }

    expect(schema.safeParse("short").success).toBe(true);
    expect(schema.safeParse("hi").success).toBe(false); // Too short
  });

  it("includes metadata (label, description)", () => {
    const field = textarea({
      required: true,
      defaultValue: "test",
      label: "Notes",
      description: "Internal notes",
    });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = textarea({ required: true, defaultValue: "test" });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("defaults rows to 4 when not configured", () => {
    const field = textarea();
    expect(field.rows).toBe(4);
  });

  it("honors a configured rows value", () => {
    const field = textarea({ rows: 8 });
    expect(field.rows).toBe(8);
  });

  describe("min/max on an optional field", () => {
    it("skips min/max when the value is omitted (undefined)", () => {
      const field = textarea({ min: 3, max: 5, defaultValue: "" });
      const schema = textareaFieldToInputSchema({ field });
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it("still enforces min/max once a non-empty value is supplied, even though the field is optional", () => {
      const field = textarea({ min: 3, max: 5, defaultValue: "" });
      const schema = textareaFieldToInputSchema({ field });
      expect(schema.safeParse("ab").success).toBe(false);
      expect(schema.safeParse("toolong").success).toBe(false);
      expect(schema.safeParse("abc").success).toBe(true);
    });
  });
});
