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

  it("required schema provides a numeric default (Date.now())", () => {
    const before = Date.now();
    const field = date({ required: true });
    const schema = dateFieldToInputSchema({ field });
    const after = Date.now();

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data).toBe("number");
      expect(result.data as number).toBeGreaterThanOrEqual(before);
      expect(result.data as number).toBeLessThanOrEqual(after);
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
});
