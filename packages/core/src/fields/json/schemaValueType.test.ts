import { describe, it, expect } from "vitest";
import { jsonToValueTypeString } from "./schemaValueType";
import type { JsonFieldMeta } from "../../types";

describe("jsonToValueTypeString", () => {
  it("returns v.any() for a required json field", () => {
    const meta: JsonFieldMeta = { type: "json", required: true };
    expect(
      jsonToValueTypeString({ meta, collectionSlug: "posts", fieldName: "metadata" }),
    ).toBe("v.any()");
  });

  it("returns v.optional(v.any()) for an optional json field", () => {
    const meta: JsonFieldMeta = { type: "json" };
    expect(
      jsonToValueTypeString({ meta, collectionSlug: "posts", fieldName: "metadata" }),
    ).toBe("v.optional(v.any())");
  });
});
