import { describe, it, expect } from "vitest";
import { selectToValueTypeString } from "./schemaValueType";
import type { SelectFieldMeta } from "../../types";

describe("selectToValueTypeString", () => {
  it("returns optional union of literals for single-select", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    };
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.optional(v.union(v.literal("draft"),v.literal("published")))');
  });

  it("returns required union when required with defaultValue", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    };
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.union(v.literal("draft"),v.literal("published"))');
  });

  it("wraps in v.array() for multi-select (hasMany) — no v.union() wrapper", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      hasMany: true,
      options: [
        { value: "tag1", label: "Tag 1" },
        { value: "tag2", label: "Tag 2" },
      ],
    };
    // hasMany wraps literals directly in v.array(), no v.union()
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "tags",
      }),
    ).toBe('v.optional(v.array(v.literal("tag1"),v.literal("tag2")))');
  });

  it("handles single option", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [{ value: "only", label: "Only Option" }],
    };
    expect(
      selectToValueTypeString({
        meta,
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
    const meta: SelectFieldMeta<string> = {
      type: "select",
      hasMany: false,
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    };
    // hasMany: false should NOT wrap in v.array()
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.optional(v.union(v.literal("a"),v.literal("b")))');
  });

  it("throws when required with no defaultValue", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      required: true,
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    };
    expect(() =>
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toThrow("status");
  });

  // TODO: Implementation does not yet validate defaultValue against options — add when implemented
  it.todo("throws when defaultValue is not in options");
});
