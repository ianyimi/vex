import { describe, it, expect } from "vitest";
import { processFieldValueTypeOptions } from "./processAdminOptions";
import { VexFieldValidationError } from "../errors";

describe("processFieldValueTypeOptions", () => {
  describe("optional fields", () => {
    it("wraps in v.optional() when required is undefined", () => {
      const result = processFieldValueTypeOptions({
        meta: { type: "text" },
        collectionSlug: "posts",
        fieldName: "title",
        expectedType: "string",
        valueType: "v.string()",
      });
      expect(result).toBe("v.optional(v.string())");
    });

    it("wraps in v.optional() when required is false", () => {
      const result = processFieldValueTypeOptions({
        meta: { type: "text", required: false },
        collectionSlug: "posts",
        fieldName: "title",
        expectedType: "string",
        valueType: "v.string()",
      });
      expect(result).toBe("v.optional(v.string())");
    });
  });

  describe("required fields", () => {
    it("returns valueType directly when required with valid defaultValue", () => {
      const result = processFieldValueTypeOptions({
        meta: { type: "text", required: true, defaultValue: "hello" },
        collectionSlug: "posts",
        fieldName: "title",
        expectedType: "string",
        valueType: "v.string()",
      });
      expect(result).toBe("v.string()");
    });

    it("throws VexFieldValidationError when required with no defaultValue", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "text", required: true },
          collectionSlug: "posts",
          fieldName: "title",
          expectedType: "string",
          valueType: "v.string()",
        }),
      ).toThrow(VexFieldValidationError);
    });

    it("error message includes collection slug and field name", () => {
      try {
        processFieldValueTypeOptions({
          meta: { type: "text", required: true },
          collectionSlug: "posts",
          fieldName: "title",
          expectedType: "string",
          valueType: "v.string()",
        });
        expect.unreachable("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(VexFieldValidationError);
        const err = e as VexFieldValidationError;
        expect(err.collectionSlug).toBe("posts");
        expect(err.fieldName).toBe("title");
        expect(err.message).toContain("title");
        expect(err.message).toContain("posts");
      }
    });
  });

  describe("defaultValue type checking", () => {
    it("accepts string defaultValue for string expectedType", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "text", required: true, defaultValue: "hello" },
          collectionSlug: "posts",
          fieldName: "title",
          expectedType: "string",
          valueType: "v.string()",
        }),
      ).not.toThrow();
    });

    it("throws when defaultValue is number but expectedType is string", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "text", required: true, defaultValue: 42 },
          collectionSlug: "posts",
          fieldName: "title",
          expectedType: "string",
          valueType: "v.string()",
        }),
      ).toThrow(VexFieldValidationError);
    });

    it("accepts number defaultValue for number expectedType", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "number", required: true, defaultValue: 0 },
          collectionSlug: "items",
          fieldName: "count",
          expectedType: "number",
          valueType: "v.number()",
        }),
      ).not.toThrow();
    });

    it("accepts boolean defaultValue for boolean expectedType", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "checkbox", required: true, defaultValue: false },
          collectionSlug: "posts",
          fieldName: "featured",
          expectedType: "boolean",
          valueType: "v.boolean()",
        }),
      ).not.toThrow();
    });
  });
});
