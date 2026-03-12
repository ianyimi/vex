import { describe, it, expect } from "vitest";
import { selectToValueTypeString } from "./schemaValueType";
import { select } from ".";

describe("selectToValueTypeString", () => {
  it("returns optional union of literals for single-select", () => {
    expect(
      selectToValueTypeString({
        field: select({
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ],
        }),
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.optional(v.union(v.literal("draft"),v.literal("published")))');
  });

  it("returns required union when required with defaultValue", () => {
    expect(
      selectToValueTypeString({
        field: select({
          required: true,
          defaultValue: "draft",
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ],
        }),
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.union(v.literal("draft"),v.literal("published"))');
  });

  it("wraps in v.array(v.union()) for multi-select (hasMany) with multiple options", () => {
    expect(
      selectToValueTypeString({
        field: select({
          hasMany: true,
          options: [
            { value: "tag1", label: "Tag 1" },
            { value: "tag2", label: "Tag 2" },
          ],
        }),
        collectionSlug: "posts",
        fieldName: "tags",
      }),
    ).toBe('v.optional(v.array(v.union(v.literal("tag1"),v.literal("tag2"))))');
  });

  it("wraps in v.array() without v.union() for hasMany with single option", () => {
    expect(
      selectToValueTypeString({
        field: select({
          hasMany: true,
          options: [
            { value: "only", label: "Only" },
          ],
        }),
        collectionSlug: "posts",
        fieldName: "tags",
      }),
    ).toBe('v.optional(v.array(v.literal("only")))');
  });

  it("handles single option", () => {
    expect(
      selectToValueTypeString({
        field: select({
          options: [{ value: "only", label: "Only Option" }],
        }),
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.optional(v.union(v.literal("only")))');
  });

  // TODO: Implementation does not yet validate empty options — add when implemented
  it.todo("throws on empty options");

  // TODO: Implementation does not yet deduplicate — add when implemented
  it.todo("deduplicates option values");

  // TODO: Implementation does not yet escape quotes — add when implemented
  it.todo("escapes quotes in option values");

  it("handles hasMany: false explicitly", () => {
    // hasMany: false should NOT wrap in v.array()
    expect(
      selectToValueTypeString({
        field: select({
          hasMany: false,
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
        }),
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.optional(v.union(v.literal("a"),v.literal("b")))');
  });

  it("throws when required with no defaultValue", () => {
    expect(() =>
      selectToValueTypeString({
        field: select({
          required: true,
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
        }),
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toThrow("status");
  });

  // TODO: Implementation does not yet validate defaultValue against options — add when implemented
  it.todo("throws when defaultValue is not in options");
});
