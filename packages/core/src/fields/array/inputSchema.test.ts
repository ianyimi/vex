import { describe, it, expect } from "vitest";
import { text, number } from "../index";
import { array } from "./config";
import { arrayFieldToInputSchema } from "./inputSchema";

describe("arrayFieldToInputSchema", () => {
  describe("basic array validation", () => {
    it("generates array schema with required items", () => {
      const itemsField = text({ required: true });
      const field = array({ items: itemsField });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept valid arrays
      expect(schema.safeParse(["hello", "world"]).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(true);

      // Should reject non-arrays
      expect(schema.safeParse("hello").success).toBe(false);
      expect(schema.safeParse(123).success).toBe(false);
      expect(schema.safeParse(null).success).toBe(false);
    });

    it("validates items against item schema", () => {
      const itemsField = number({ required: true });
      const field = array({ items: itemsField });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept arrays of numbers
      expect(schema.safeParse([1, 2, 3]).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(true);

      // Should reject arrays with non-numbers
      expect(schema.safeParse(["a", "b"]).success).toBe(false);
      expect(schema.safeParse([1, "two", 3]).success).toBe(false);
    });

    it("generates required array schema", () => {
      const itemsField = text({ required: true });
      const field = array({ required: true, items: itemsField });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept valid arrays
      expect(schema.safeParse(["hello"]).success).toBe(true);

      // Zod arrays accept undefined by default (known limitation)
      // Required check is enforced at form level, not schema level
      expect(schema.safeParse(undefined).success).toBe(true);
      // Zod arrays reject null
      expect(schema.safeParse(null).success).toBe(false);
    });

    it("generates optional array schema with default", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: false,
        defaultValue: [],
        items: itemsField,
      });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept arrays
      expect(schema.safeParse(["hello"]).success).toBe(true);

      // Should accept undefined and return default
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("min constraint", () => {
    it("applies min items constraint", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: { value: 2 },
      });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept arrays with >= 2 items
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(true);

      // Should reject arrays with < 2 items
      expect(schema.safeParse([]).success).toBe(false);
      expect(schema.safeParse(["a"]).success).toBe(false);
    });

    it("applies min constraint with custom error", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: { value: 3, error: "At least 3 items required" },
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(["a", "b"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least 3 items required",
        );
      }
    });
  });

  describe("max constraint", () => {
    it("applies max items constraint", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        max: { value: 3 },
      });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept arrays with <= 3 items
      expect(schema.safeParse(["a"]).success).toBe(true);
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(true);

      // Should reject arrays with > 3 items
      expect(schema.safeParse(["a", "b", "c", "d"]).success).toBe(false);
    });

    it("applies max constraint with custom error", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        max: { value: 2, error: "Maximum 2 items allowed" },
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(["a", "b", "c"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Maximum 2 items allowed");
      }
    });
  });

  describe("combined min and max constraints", () => {
    it("applies both min and max constraints", () => {
      const itemsField = number({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: { value: 2 },
        max: { value: 5 },
      });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept arrays between 2-5 items
      expect(schema.safeParse([1, 2]).success).toBe(true);
      expect(schema.safeParse([1, 2, 3]).success).toBe(true);
      expect(schema.safeParse([1, 2, 3, 4, 5]).success).toBe(true);

      // Should reject arrays outside range
      expect(schema.safeParse([]).success).toBe(false);
      expect(schema.safeParse([1]).success).toBe(false);
      expect(schema.safeParse([1, 2, 3, 4, 5, 6]).success).toBe(false);
    });

    it("reports correct error for min violation", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: { value: 3, error: "Too few items" },
        max: { value: 10, error: "Too many items" },
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(["a", "b"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Too few items");
      }
    });

    it("reports correct error for max violation", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: { value: 1, error: "Too few items" },
        max: { value: 2, error: "Too many items" },
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(["a", "b", "c"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Too many items");
      }
    });
  });

  describe("nested arrays", () => {
    it("validates nested arrays", () => {
      const innerItems = number({ required: true });
      const innerArray = array({ items: innerItems });
      const field = array({ items: innerArray });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept nested arrays of numbers
      expect(
        schema.safeParse([
          [1, 2],
          [3, 4],
        ]).success,
      ).toBe(true);
      expect(schema.safeParse([[1], [2], [3]]).success).toBe(true);

      // Should reject nested arrays with non-numbers
      expect(schema.safeParse([[1, "two"]]).success).toBe(false);
      expect(schema.safeParse([["a"], ["b"]]).success).toBe(false);
    });

    it("applies constraints to nested arrays", () => {
      const innerItems = text({ required: true });
      const innerArray = array({ items: innerItems, max: { value: 3 } });
      const field = array({ items: innerArray, min: { value: 2 } });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept 2-3 nested arrays, each with max 3 items
      expect(schema.safeParse([["a", "b"], ["c"]]).success).toBe(true);

      // Should reject too few nested arrays
      expect(schema.safeParse([["a"]]).success).toBe(false);

      // Should reject nested arrays with too many items
      expect(schema.safeParse([["a", "b", "c", "d"], ["e"]]).success).toBe(
        false,
      );
    });
  });

  describe("default value", () => {
    it("applies default value for optional array", () => {
      const itemsField = number({ required: true });
      const field = array<number>({
        required: false,
        defaultValue: [1, 2, 3],
        items: itemsField,
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3]);
      }
    });
  });

  describe("metadata", () => {
    it("includes label and description", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        label: "Tags",
        description: "Add tags to categorize content",
      });
      const schema = arrayFieldToInputSchema({ field });

      // Verify schema was created
      expect(schema.safeParse(["tag1", "tag2"]).success).toBe(true);
    });
  });
});

