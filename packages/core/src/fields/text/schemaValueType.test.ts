import { describe, it, expect } from "vitest";
import { textToValueTypeString } from "./schemaValueType";
import type { TextFieldMeta } from "../../types";

describe("textToValueTypeString", () => {
  it("returns v.string() for a required text field", () => {
    const meta: TextFieldMeta = {
      type: "text",
      required: true,
      defaultValue: "x",
    };
    expect(
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toBe("v.string()");
  });

  it("returns v.optional(v.string()) for an optional text field", () => {
    const meta: TextFieldMeta = { type: "text" };
    expect(
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "subtitle",
      }),
    ).toBe("v.optional(v.string())");
  });

  it("returns v.optional(v.string()) regardless of minLength/maxLength", () => {
    const meta: TextFieldMeta = { type: "text", minLength: 1, maxLength: 200 };
    expect(
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "excerpt",
      }),
    ).toBe("v.optional(v.string())");
  });

  it("returns v.string() with full options including index", () => {
    const meta: TextFieldMeta = {
      type: "text",
      label: "Title",
      description: "The post title",
      required: true,
      minLength: 1,
      maxLength: 200,
      defaultValue: "Untitled",
      index: "by_title",
    };
    // index does not affect the validator string
    expect(
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toBe("v.string()");
  });

  it("throws when required with no defaultValue", () => {
    const meta: TextFieldMeta = { type: "text", required: true };
    expect(() =>
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toThrow("title");
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: TextFieldMeta = {
      type: "text",
      required: true,
      defaultValue: 42 as any,
    };
    expect(() =>
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toThrow("title");
  });
});
