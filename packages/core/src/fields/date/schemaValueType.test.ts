import { describe, it, expect } from "vitest";
import { dateToValueTypeString } from "./schemaValueType";
import { date } from ".";

describe("dateToValueTypeString", () => {
  it("returns v.number() for a required date field", () => {
    expect(
      dateToValueTypeString({ field: date({ required: true, defaultValue: 0 }), collectionSlug: "posts", fieldName: "createdAt" }),
    ).toBe("v.number()");
  });

  it("returns v.optional(v.number()) for an optional date field", () => {
    expect(
      dateToValueTypeString({ field: date(), collectionSlug: "posts", fieldName: "publishedAt" }),
    ).toBe("v.optional(v.number())");
  });

  it("auto-provides defaultValue when required with no explicit defaultValue", () => {
    expect(
      dateToValueTypeString({ field: date({ required: true }), collectionSlug: "posts", fieldName: "createdAt" }),
    ).toBe("v.number()");
  });
});
