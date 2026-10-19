import { describe, it, expect } from "vitest";
import { json } from "./config";
import { jsonFieldToInputSchema } from "./inputSchema";

describe("jsonFieldToInputSchema", () => {
  it("accepts any defined, non-null value", () => {
    const field = json({ required: false });
    const schema = jsonFieldToInputSchema({ field });

    expect(schema.safeParse({ a: 1 }).success).toBe(true);
    expect(schema.safeParse([1, 2, 3]).success).toBe(true);
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(42).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);
  });

  it("accepts a missing value when not required", () => {
    const field = json({ required: false });
    const schema = jsonFieldToInputSchema({ field });

    expect(schema.safeParse(undefined).success).toBe(true);
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = json({ required: true });
    const schema = jsonFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects null on a required field with the same 'required' message", () => {
    const field = json({ required: true });
    const schema = jsonFieldToInputSchema({ field });

    const result = schema.safeParse(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("accepts a defined, non-null value on a required field", () => {
    const field = json({ required: true });
    const schema = jsonFieldToInputSchema({ field });

    expect(schema.safeParse({ theme: "dark" }).success).toBe(true);
  });

  it("includes metadata (label, description)", () => {
    const field = json({
      required: true,
      label: "Settings",
      description: "Raw config.",
    });
    const schema = jsonFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });
});
