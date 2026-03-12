import { describe, it, expect } from "vitest";
import { imageUrlToValueTypeString } from "./schemaValueType";
import { imageUrl } from ".";

describe("imageUrlToValueTypeString", () => {
  it("returns v.string() for a required imageUrl field", () => {
    expect(
      imageUrlToValueTypeString({ field: imageUrl({ required: true, defaultValue: "" }), collectionSlug: "users", fieldName: "avatar" }),
    ).toBe("v.string()");
  });

  it("returns v.optional(v.string()) for an optional imageUrl field", () => {
    expect(
      imageUrlToValueTypeString({ field: imageUrl(), collectionSlug: "users", fieldName: "avatar" }),
    ).toBe("v.optional(v.string())");
  });

  it("auto-provides defaultValue when required with no explicit defaultValue", () => {
    expect(
      imageUrlToValueTypeString({ field: imageUrl({ required: true }), collectionSlug: "users", fieldName: "avatar" }),
    ).toBe("v.string()");
  });
});
