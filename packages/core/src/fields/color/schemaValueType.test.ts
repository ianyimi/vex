import { describe, it, expect } from "vitest";
import { colorToValueTypeString } from "./schemaValueType";
import { color } from "./config";

describe("colorToValueTypeString", () => {
  it("generates v.optional(v.string()) for optional color", () => {
    const result = colorToValueTypeString({
      field: color({ label: "Color" }),
      collectionSlug: "test",
      fieldName: "color",
    });
    expect(result).toBe("v.optional(v.string())");
  });

  it("generates v.string() for required color", () => {
    const result = colorToValueTypeString({
      field: color({ label: "Color", required: true, defaultValue: "#000" }),
      collectionSlug: "test",
      fieldName: "color",
    });
    expect(result).toBe("v.string()");
  });

  it("schema is the same regardless of format", () => {
    const hex = colorToValueTypeString({
      field: color({ label: "C", format: "hex" }),
      collectionSlug: "t",
      fieldName: "c",
    });
    const oklch = colorToValueTypeString({
      field: color({ label: "C", format: "oklch" }),
      collectionSlug: "t",
      fieldName: "c",
    });
    expect(hex).toBe(oklch);
  });
});
