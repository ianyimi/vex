import { describe, it, expect } from "vitest";
import { jsonToValueTypeString } from "./schemaValueType";
import { json } from ".";

describe("jsonToValueTypeString", () => {
  it("returns v.any() for a required json field", () => {
    expect(
      jsonToValueTypeString({ field: json({ required: true }), collectionSlug: "posts", fieldName: "metadata" }),
    ).toBe("v.any()");
  });

  it("returns v.optional(v.any()) for an optional json field", () => {
    expect(
      jsonToValueTypeString({ field: json(), collectionSlug: "posts", fieldName: "metadata" }),
    ).toBe("v.optional(v.any())");
  });
});
