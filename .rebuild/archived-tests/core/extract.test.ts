import { describe, it, expect } from "vitest";
import { fieldToValueType } from "./extract";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";
import { upload } from "../fields/media";

describe("fieldToValueType", () => {
  describe("required fields (no v.optional wrapper)", () => {
    it("text field with required: true and defaultValue", () => {
      const field = text({ required: true, defaultValue: "Untitled" });
      expect(fieldToValueType({ field, collectionSlug: "posts", fieldName: "title" })).toBe(
        "v.string()",
      );
    });

    it("number field with required: true and defaultValue", () => {
      const field = number({ required: true, defaultValue: 0 });
      expect(fieldToValueType({ field, collectionSlug: "items", fieldName: "count" })).toBe(
        "v.number()",
      );
    });

    it("select field with required: true and defaultValue", () => {
      const field = select({
        required: true,
        defaultValue: "a",
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      });
      expect(fieldToValueType({ field, collectionSlug: "posts", fieldName: "status" })).toBe(
        'v.union(v.literal("a"),v.literal("b"))',
      );
    });
  });

  describe("optional fields (wrapped in v.optional)", () => {
    it("text field with no required option", () => {
      const field = text();
      expect(fieldToValueType({ field, collectionSlug: "posts", fieldName: "subtitle" })).toBe(
        "v.optional(v.string())",
      );
    });

    it("text field with required: false", () => {
      const field = text({ required: false });
      expect(fieldToValueType({ field, collectionSlug: "posts", fieldName: "subtitle" })).toBe(
        "v.optional(v.string())",
      );
    });

    it("number field without required", () => {
      const field = number({ min: 0 });
      expect(fieldToValueType({ field, collectionSlug: "items", fieldName: "price" })).toBe(
        "v.optional(v.number())",
      );
    });

    it("checkbox field without required", () => {
      const field = checkbox();
      expect(fieldToValueType({ field, collectionSlug: "posts", fieldName: "featured" })).toBe(
        "v.optional(v.boolean())",
      );
    });

    it("select field without required", () => {
      const field = select({
        options: [{ value: "x", label: "X" }],
      });
      expect(fieldToValueType({ field, collectionSlug: "posts", fieldName: "status" })).toBe(
        'v.optional(v.union(v.literal("x")))',
      );
    });

    it("multi-select field without required", () => {
      const field = select({
        hasMany: true,
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      });
      expect(fieldToValueType({ field, collectionSlug: "posts", fieldName: "tags" })).toBe(
        'v.optional(v.array(v.union(v.literal("a"),v.literal("b"))))',
      );
    });
  });

  describe("index property does not affect valueType", () => {
    it("text field with index still returns same valueType", () => {
      const field = text({
        required: true,
        defaultValue: "x",
        index: "by_title",
      });
      expect(fieldToValueType({ field, collectionSlug: "posts", fieldName: "title" })).toBe(
        "v.string()",
      );
    });
  });

  describe("upload fields", () => {
    it("converts upload field to v.id()", () => {
      expect(
        fieldToValueType({
          field: upload({ to: "images", required: true }),
          collectionSlug: "posts",
          fieldName: "cover",
        }),
      ).toBe('v.id("images")');
    });

    it("converts optional upload field to v.optional(v.id())", () => {
      expect(
        fieldToValueType({
          field: upload({ to: "images" }),
          collectionSlug: "posts",
          fieldName: "cover",
        }),
      ).toBe('v.optional(v.id("images"))');
    });

    it("converts hasMany upload field to v.array(v.id())", () => {
      expect(
        fieldToValueType({
          field: upload({ to: "images", hasMany: true, required: true }),
          collectionSlug: "posts",
          fieldName: "gallery",
        }),
      ).toBe('v.array(v.id("images"))');
    });
  });

  describe("error cases", () => {
    it("throws on unknown field type", () => {
      const field = { type: "unknown_type" } as any;
      expect(() => fieldToValueType({ field, collectionSlug: "posts", fieldName: "mystery" })).toThrow(
        "unknown_type",
      );
    });
  });
});

