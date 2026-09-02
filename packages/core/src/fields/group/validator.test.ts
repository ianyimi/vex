import { describe, it, expect } from "vitest";
import { group } from "./config";
import { text } from "../text";
import { number } from "../number";
import { groupFieldToValidator } from "./validator";

describe("groupFieldToValidator", () => {
  it("generates optional wrapper for non-required group", () => {
    const field = group({
      fields: {
        title: text({ required: true }),
        body: text(),
      },
    });
    expect(groupFieldToValidator({ field })).toBe(
      "v.optional(v.object({ title: v.string(), body: v.optional(v.string()) }))",
    );
  });

  it("omits optional wrapper for required group", () => {
    const field = group({
      required: true,
      fields: { score: number({ required: true }) },
    });
    expect(groupFieldToValidator({ field })).toBe(
      "v.object({ score: v.number() })",
    );
  });

  it("handles all-optional sub-fields", () => {
    const field = group({ fields: { a: text(), b: number() } });
    expect(groupFieldToValidator({ field })).toBe(
      "v.optional(v.object({ a: v.optional(v.string()), b: v.optional(v.number()) }))",
    );
  });

  it("supports nested group (group within group)", () => {
    const inner = group({
      required: true,
      fields: { zip: text({ required: true }) },
    });
    const outer = group({ fields: { address: inner } });
    expect(groupFieldToValidator({ field: outer })).toBe(
      "v.optional(v.object({ address: v.object({ zip: v.string() }) }))",
    );
  });
});
