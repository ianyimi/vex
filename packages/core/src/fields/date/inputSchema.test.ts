import { describe, it, expect } from "vitest";
import { date } from "./config";
import { dateFieldToInputSchema } from "./inputSchema";

describe("dateFieldToInputSchema", () => {
  it("generates required number schema with default", () => {
    const field = date({ required: true });
    const schema = dateFieldToInputSchema({ field });

    // Should accept valid Unix ms timestamps
    expect(schema.safeParse(1735689600000).success).toBe(true);
    expect(schema.safeParse(0).success).toBe(true);

    // Should reject non-numbers
    expect(schema.safeParse("2025-01-01").success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional number schema", () => {
    const field = date({ required: false });
    const schema = dateFieldToInputSchema({ field });

    // Should accept valid timestamps
    expect(schema.safeParse(1735689600000).success).toBe(true);
    expect(schema.safeParse(0).success).toBe(true);

    // Should accept undefined
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("rejects a missing value on a required field with a 'required' message (CORE-1)", () => {
    const field = date({ required: true });
    const schema = dateFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("includes metadata (label, description)", () => {
    const field = date({
      required: true,
      label: "Event Date",
      description: "When the event takes place",
    });
    const schema = dateFieldToInputSchema({ field });

    // Verify the schema was created (metadata is attached via applyBaseInputSchemaMeta)
    expect(schema._def).toBeDefined();
  });

  describe("min/max timestamp bounds", () => {
    const MIN = 1700000000000;
    const MAX = 1800000000000;

    it("enforces min/max on a required field", () => {
      const field = date({ required: true, min: MIN, max: MAX });
      const schema = dateFieldToInputSchema({ field });
      expect(schema.safeParse(MIN - 1).success).toBe(false);
      expect(schema.safeParse(MAX + 1).success).toBe(false);
      expect(schema.safeParse(MIN).success).toBe(true);
      expect(schema.safeParse(MAX).success).toBe(true);
    });

    it("skips min/max on an optional field only when the value is omitted", () => {
      const field = date({ min: MIN, max: MAX });
      const schema = dateFieldToInputSchema({ field });
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it("still enforces min/max once a value is supplied, even though the field is optional", () => {
      // Regression: min/max is independent of `required` — `required` only
      // governs whether the field may be omitted, not whether a *supplied*
      // timestamp must fall within the configured bounds.
      const field = date({ min: MIN, max: MAX });
      const schema = dateFieldToInputSchema({ field });
      expect(schema.safeParse(MIN - 1).success).toBe(false);
      expect(schema.safeParse(MAX + 1).success).toBe(false);
      expect(schema.safeParse(MIN).success).toBe(true);
    });
  });
});
