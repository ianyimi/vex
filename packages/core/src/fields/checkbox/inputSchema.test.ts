import { describe, it, expect } from "vitest";
import { checkbox } from "./config";
import { checkboxFieldToInputSchema } from "./inputSchema";

describe("checkboxFieldToInputSchema", () => {
  it("generates a boolean schema", () => {
    const field = checkbox({ required: true });
    const schema = checkboxFieldToInputSchema({ field });

    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);

    expect(schema.safeParse("true").success).toBe(false);
    expect(schema.safeParse(1).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional schema with default false", () => {
    const field = checkbox({ required: false });
    const schema = checkboxFieldToInputSchema({ field });

    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(false);
    }
  });

  it("respects a custom defaultValue", () => {
    const field = checkbox({ required: false, defaultValue: true });
    const schema = checkboxFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
  });

  it("includes metadata (label, description)", () => {
    const field = checkbox({
      required: true,
      label: "Published",
      description: "Whether the post is publicly visible",
    });
    const schema = checkboxFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });
});
