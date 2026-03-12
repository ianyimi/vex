import { describe, it, expect } from "vitest";
import { textToValueTypeString } from "./schemaValueType";
import { text } from ".";

describe("textToValueTypeString", () => {
  it("returns v.string() for a required text field", () => {
    expect(
      textToValueTypeString({
        field: text({ required: true, defaultValue: "x" }),
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toBe("v.string()");
  });

  it("returns v.optional(v.string()) for an optional text field", () => {
    expect(
      textToValueTypeString({
        field: text(),
        collectionSlug: "posts",
        fieldName: "subtitle",
      }),
    ).toBe("v.optional(v.string())");
  });

  it("returns v.optional(v.string()) regardless of minLength/maxLength", () => {
    expect(
      textToValueTypeString({
        field: text({ minLength: 1, maxLength: 200 }),
        collectionSlug: "posts",
        fieldName: "excerpt",
      }),
    ).toBe("v.optional(v.string())");
  });

  it("returns v.string() with full options including index", () => {
    // index does not affect the valueType string
    expect(
      textToValueTypeString({
        field: text({
          label: "Title",
          description: "The post title",
          required: true,
          minLength: 1,
          maxLength: 200,
          defaultValue: "Untitled",
          index: "by_title",
        }),
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toBe("v.string()");
  });

  it("auto-provides defaultValue when required with no explicit defaultValue", () => {
    expect(
      textToValueTypeString({
        field: text({ required: true }),
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toBe("v.string()");
  });

  it("throws when defaultValue is wrong type", () => {
    expect(() =>
      textToValueTypeString({
        field: text({ required: true, defaultValue: 42 as any }),
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toThrow("title");
  });
});
