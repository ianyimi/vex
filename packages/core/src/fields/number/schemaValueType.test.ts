import { describe, it, expect } from "vitest";
import { numberToValueTypeString } from "./schemaValueType";
import type { NumberFieldMeta } from "../../types";

describe("numberToValueTypeString", () => {
  it("returns v.number() for a required number field", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      required: true,
      defaultValue: 0,
    };
    expect(numberToValueTypeString({ meta, collectionSlug: "items", fieldName: "count" })).toBe("v.number()");
  });

  it("returns v.optional(v.number()) for an optional number field", () => {
    const meta: NumberFieldMeta = { type: "number" };
    expect(numberToValueTypeString({ meta, collectionSlug: "items", fieldName: "count" })).toBe(
      "v.optional(v.number())",
    );
  });

  it("returns v.optional(v.number()) regardless of min/max/step", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      min: 0,
      max: 100,
      step: 0.01,
    };
    expect(numberToValueTypeString({ meta, collectionSlug: "items", fieldName: "price" })).toBe(
      "v.optional(v.number())",
    );
  });

  it("throws when required with no defaultValue", () => {
    const meta: NumberFieldMeta = { type: "number", required: true };
    expect(() => numberToValueTypeString({ meta, collectionSlug: "items", fieldName: "count" })).toThrow(
      "count",
    );
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      required: true,
      defaultValue: "ten" as any,
    };
    expect(() => numberToValueTypeString({ meta, collectionSlug: "items", fieldName: "count" })).toThrow(
      "count",
    );
  });
});

