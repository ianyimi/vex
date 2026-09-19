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

  it("rejects a missing value on a required field with a 'required' message (CORE-1)", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
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

  describe("min/max reference-count bounds", () => {
    it("enforces min/max on a required field", () => {
      const field = relationship({
        collection: { slug: "tags" },
        required: true,
        min: { value: 1 },
        max: { value: 2 },
      });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(false);
      expect(schema.safeParse(["a"]).success).toBe(true);
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
    });

    it("skips min/max on an optional field only when the value is empty or omitted", () => {
      const field = relationship({
        collection: { slug: "tags" },
        min: { value: 1 },
        max: { value: 2 },
      });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse(undefined).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(true);
    });

    it("still enforces min/max once a non-empty value is supplied, even though the field is optional", () => {
      // Regression: min/max is independent of `required` — `required` only
      // governs whether the value may be absent, not whether a *supplied*
      // (non-empty) array must respect the configured reference count.
      const field = relationship({
        collection: { slug: "tags" },
        min: { value: 2 },
        max: { value: 3 },
      });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse(["a"]).success).toBe(false);
      expect(schema.safeParse(["a", "b", "c", "d"]).success).toBe(false);
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
    });

    it("uses a custom error message when configured", () => {
      const field = relationship({
        collection: { slug: "tags" },
        required: true,
        min: { value: 2, error: "Pick at least two tags." },
        max: { value: 2, error: "Pick no more than two tags." },
      });
      const schema = relationshipFieldToInputSchema({ field });
      const belowMin = schema.safeParse(["a"]);
      expect(belowMin.success).toBe(false);
      if (!belowMin.success) expect(belowMin.error.issues[0].message).toBe("Pick at least two tags.");

      const aboveMax = schema.safeParse(["a", "b", "c"]);
      expect(aboveMax.success).toBe(false);
      if (!aboveMax.success) expect(aboveMax.error.issues[0].message).toBe("Pick no more than two tags.");
    });

    // Once a `min` is explicitly configured, it applies even on a required
    // field's empty array — otherwise a required field's custom `min`
    // message could never surface (an empty array is the only way to
    // violate a `min` in the first place, so unconditionally skipping the
    // check on empty would make the message unreachable).
    it("a required field's min still rejects an empty array once min is explicitly configured", () => {
      const field = relationship({
        collection: { slug: "tags" },
        required: true,
        min: { value: 1 },
      });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse([]).success).toBe(false);
    });

    // CORE-1, unaffected: with no `min` configured at all, `required` alone
    // never demands a non-empty array — a document may legitimately have
    // zero relations.
    it("a required field with no min configured still accepts an empty array (CORE-1)", () => {
      const field = relationship({ collection: { slug: "tags" }, required: true });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse([]).success).toBe(true);
    });
  });
});
