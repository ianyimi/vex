import { describe, it, expect } from "vitest";
import { richtextToValueTypeString } from "./schemaValueType";
import type { RichTextFieldDef } from "../../types";

describe("richtextToValueTypeString", () => {
  it("returns v.any() for required richtext field", () => {
    const field: RichTextFieldDef = { type: "richtext", required: true };
    const result = richtextToValueTypeString({
      field,
      collectionSlug: "posts",
      fieldName: "content",
    });
    expect(result).toBe("v.any()");
  });

  it("returns v.optional(v.any()) for optional richtext field", () => {
    const field: RichTextFieldDef = { type: "richtext" };
    const result = richtextToValueTypeString({
      field,
      collectionSlug: "posts",
      fieldName: "content",
    });
    expect(result).toBe("v.optional(v.any())");
  });
});
