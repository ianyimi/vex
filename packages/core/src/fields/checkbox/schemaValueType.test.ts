import { describe, it, expect } from "vitest";
import { checkboxToValueTypeString } from "./schemaValueType";
import type { CheckboxFieldMeta } from "../../types";

describe("checkboxToValueTypeString", () => {
  it("returns v.optional(v.boolean()) for an optional checkbox", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox" };
    expect(
      checkboxToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toBe("v.optional(v.boolean())");
  });

  it("returns v.boolean() for a required checkbox with defaultValue", () => {
    const meta: CheckboxFieldMeta = {
      type: "checkbox",
      required: true,
      defaultValue: true,
    };
    expect(
      checkboxToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toBe("v.boolean()");
  });

  it("throws when required with no defaultValue", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox", required: true };
    expect(() =>
      checkboxToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toThrow("featured");
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: CheckboxFieldMeta = {
      type: "checkbox",
      required: true,
      defaultValue: "yes" as any,
    };
    expect(() =>
      checkboxToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toThrow("featured");
  });
});
