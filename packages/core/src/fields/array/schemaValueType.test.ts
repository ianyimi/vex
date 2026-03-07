import { describe, it, expect } from "vitest";
import { arrayToValueTypeString } from "./schemaValueType";
import type { ArrayFieldMeta } from "../../types";
import { text } from "../text";
import { number } from "../number";

// Simulates fieldToValueType dispatcher — inline for test isolation
function resolveInnerField(props: { field: any; collectionSlug: string; fieldName: string }): string {
  const type = props.field._meta.type;
  if (type === "text") return props.field._meta.required ? "v.string()" : "v.optional(v.string())";
  if (type === "number") return props.field._meta.required ? "v.number()" : "v.optional(v.number())";
  throw new Error(`Unknown type: ${type}`);
}

describe("arrayToValueTypeString", () => {
  it("returns v.array(v.string()) for a required array of text", () => {
    const meta: ArrayFieldMeta = {
      type: "array",
      field: text(),
      required: true,
    };
    expect(
      arrayToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "tags",
        resolveInnerField,
      }),
    ).toBe("v.array(v.string())");
  });

  it("returns v.optional(v.array(v.string())) for optional array of text", () => {
    const meta: ArrayFieldMeta = {
      type: "array",
      field: text(),
    };
    expect(
      arrayToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "tags",
        resolveInnerField,
      }),
    ).toBe("v.optional(v.array(v.string()))");
  });

  it("strips v.optional from inner field", () => {
    const meta: ArrayFieldMeta = {
      type: "array",
      field: number(), // optional number
      required: true,
    };
    expect(
      arrayToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "scores",
        resolveInnerField,
      }),
    ).toBe("v.array(v.number())");
  });

  it("wraps required inner field correctly", () => {
    const meta: ArrayFieldMeta = {
      type: "array",
      field: number({ required: true, defaultValue: 0 }),
      required: true,
    };
    expect(
      arrayToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "scores",
        resolveInnerField,
      }),
    ).toBe("v.array(v.number())");
  });
});
