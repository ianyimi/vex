import { describe, it, expect } from "vitest";
import { keyValue } from "./config";
import { number } from "../number";
import { text } from "../text";
import { group } from "../group";
import { keyValueFieldToValidator } from "./validator";

describe("keyValueFieldToValidator", () => {
  it("generates string keys by default, wrapped in v.optional for a non-required field", () => {
    const field = keyValue({ value: number({ required: true }) });
    expect(keyValueFieldToValidator({ field })).toBe(
      "v.optional(v.record(v.string(), v.number()))",
    );
  });

  it("omits the optional wrapper for a required field", () => {
    const field = keyValue({ required: true, value: number({ required: true }) });
    expect(keyValueFieldToValidator({ field })).toBe("v.record(v.string(), v.number())");
  });

  it("stores v.id(slug) keys when keys.collection is set", () => {
    const field = keyValue({ keys: { collection: { slug: "user" } }, value: number() });
    expect(keyValueFieldToValidator({ field })).toBe(
      'v.optional(v.record(v.id("user"), v.number()))',
    );
  });

  it("never wraps the value validator in v.optional, regardless of the value field's own required", () => {
    const field = keyValue({ value: text({ required: false }) });
    expect(keyValueFieldToValidator({ field })).toBe(
      "v.optional(v.record(v.string(), v.string()))",
    );
  });

  it("supports a group() value — any data field including containers", () => {
    const field = keyValue({
      value: group({ required: true, fields: { score: number({ required: true }) } }),
    });
    expect(keyValueFieldToValidator({ field })).toBe(
      "v.optional(v.record(v.string(), v.object({ score: v.number() })))",
    );
  });
});
