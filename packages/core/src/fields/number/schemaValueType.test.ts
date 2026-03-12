import { describe, it, expect } from "vitest";
import { numberToValueTypeString } from "./schemaValueType";
import { number } from ".";

describe("numberToValueTypeString", () => {
  it("returns v.number() for a required number field", () => {
    expect(numberToValueTypeString({ field: number({ required: true, defaultValue: 0 }), collectionSlug: "items", fieldName: "count" })).toBe("v.number()");
  });

  it("returns v.optional(v.number()) for an optional number field", () => {
    expect(numberToValueTypeString({ field: number(), collectionSlug: "items", fieldName: "count" })).toBe(
      "v.optional(v.number())",
    );
  });

  it("returns v.optional(v.number()) regardless of min/max/step", () => {
    expect(numberToValueTypeString({ field: number({ min: 0, max: 100, step: 0.01 }), collectionSlug: "items", fieldName: "price" })).toBe(
      "v.optional(v.number())",
    );
  });

  it("auto-provides defaultValue when required with no explicit defaultValue", () => {
    expect(numberToValueTypeString({ field: number({ required: true }), collectionSlug: "items", fieldName: "count" })).toBe("v.number()");
  });

  it("throws when defaultValue is wrong type", () => {
    expect(() => numberToValueTypeString({ field: number({ required: true, defaultValue: "ten" as any }), collectionSlug: "items", fieldName: "count" })).toThrow(
      "count",
    );
  });
});
