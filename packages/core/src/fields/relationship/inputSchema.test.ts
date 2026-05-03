import { describe, it, expect } from "vitest";
import { relationship } from "./config";
import { relationshipFieldToInputSchema } from "./inputSchema";

describe("relationshipFieldToInputSchema", () => {
  // Relationship fields always validate as z.array(z.string()).
  // hasMany is a UI-only hint — it does not change the Zod schema.

  it("accepts an array of strings", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(["abc123", "def456"]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(true);
  });

  it("rejects a bare string — must be wrapped in an array", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse("abc123").success).toBe(false);
  });

  it("rejects non-string array items", () => {
    const field = relationship({
      collection: { slug: "tags" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse([1, 2]).success).toBe(false);
  });

  it("rejects non-array values", () => {
    const field = relationship({
      collection: { slug: "tags" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(true).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("defaults undefined to [] for required fields", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("defaults undefined to [] for optional fields", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: false,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("hasMany: true produces the same array schema (hasMany is UI-only)", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(["id1", "id2"]).success).toBe(true);
    expect(schema.safeParse("id1").success).toBe(false);
  });
});
