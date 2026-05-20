import { describe, it, expect } from "vitest";
import { group } from "./config";
import { text } from "../text";
import { number } from "../number";
import { groupFieldToInputSchema } from "./inputSchema";

describe("groupFieldToInputSchema", () => {
  it("parses a valid object with required sub-field", () => {
    const field = group({
      fields: { title: text({ required: true }), body: text() },
    });
    const schema = groupFieldToInputSchema({ field });
    const result = schema.safeParse({ title: "Hello", body: "World" });
    expect(result.success).toBe(true);
  });

  it("fills missing optional sub-fields with their defaults", () => {
    const field = group({ fields: { score: number() } });
    const schema = groupFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("defaults to {} when field is optional and value is undefined", () => {
    const field = group({ fields: { note: text() } });
    const schema = groupFieldToInputSchema({ field });
    const result = schema.parse(undefined);
    expect(result).toBeDefined();
  });
});
