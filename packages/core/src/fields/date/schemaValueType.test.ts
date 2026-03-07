import { describe, it, expect } from "vitest";
import { dateToValueTypeString } from "./schemaValueType";
import type { DateFieldMeta } from "../../types";

describe("dateToValueTypeString", () => {
  it("returns v.number() for a required date field", () => {
    const meta: DateFieldMeta = {
      type: "date",
      required: true,
      defaultValue: 0,
    };
    expect(
      dateToValueTypeString({ meta, collectionSlug: "posts", fieldName: "createdAt" }),
    ).toBe("v.number()");
  });

  it("returns v.optional(v.number()) for an optional date field", () => {
    const meta: DateFieldMeta = { type: "date" };
    expect(
      dateToValueTypeString({ meta, collectionSlug: "posts", fieldName: "publishedAt" }),
    ).toBe("v.optional(v.number())");
  });

  it("throws when required with no defaultValue", () => {
    const meta: DateFieldMeta = { type: "date", required: true };
    expect(() =>
      dateToValueTypeString({ meta, collectionSlug: "posts", fieldName: "createdAt" }),
    ).toThrow("createdAt");
  });
});
