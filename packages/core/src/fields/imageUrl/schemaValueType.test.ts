import { describe, it, expect } from "vitest";
import { imageUrlToValueTypeString } from "./schemaValueType";
import type { ImageUrlFieldMeta } from "../../types";

describe("imageUrlToValueTypeString", () => {
  it("returns v.string() for a required imageUrl field", () => {
    const meta: ImageUrlFieldMeta = {
      type: "imageUrl",
      required: true,
      defaultValue: "",
    };
    expect(
      imageUrlToValueTypeString({ meta, collectionSlug: "users", fieldName: "avatar" }),
    ).toBe("v.string()");
  });

  it("returns v.optional(v.string()) for an optional imageUrl field", () => {
    const meta: ImageUrlFieldMeta = { type: "imageUrl" };
    expect(
      imageUrlToValueTypeString({ meta, collectionSlug: "users", fieldName: "avatar" }),
    ).toBe("v.optional(v.string())");
  });

  it("throws when required with no defaultValue", () => {
    const meta: ImageUrlFieldMeta = { type: "imageUrl", required: true };
    expect(() =>
      imageUrlToValueTypeString({ meta, collectionSlug: "users", fieldName: "avatar" }),
    ).toThrow("avatar");
  });
});
