import { describe, it, expect } from "vitest";
import { checkboxToValueTypeString } from "./schemaValueType";
import { checkbox } from ".";

describe("checkboxToValueTypeString", () => {
  it("returns v.optional(v.boolean()) for an optional checkbox", () => {
    expect(
      checkboxToValueTypeString({
        field: checkbox(),
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toBe("v.optional(v.boolean())");
  });

  it("returns v.boolean() for a required checkbox with defaultValue", () => {
    expect(
      checkboxToValueTypeString({
        field: checkbox({ required: true, defaultValue: true }),
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toBe("v.boolean()");
  });

  it("auto-provides defaultValue when required with no explicit defaultValue", () => {
    expect(
      checkboxToValueTypeString({
        field: checkbox({ required: true }),
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toBe("v.boolean()");
  });

  it("throws when defaultValue is wrong type", () => {
    expect(() =>
      checkboxToValueTypeString({
        field: checkbox({ required: true, defaultValue: "yes" as any }),
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toThrow("featured");
  });
});
