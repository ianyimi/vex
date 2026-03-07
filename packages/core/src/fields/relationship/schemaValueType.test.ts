import { describe, it, expect } from "vitest";
import { relationshipToValueTypeString } from "./schemaValueType";
import type { RelationshipFieldMeta } from "../../types";

describe("relationshipToValueTypeString", () => {
  it("returns v.id() for a required single relationship", () => {
    const meta: RelationshipFieldMeta = {
      type: "relationship",
      to: "users",
      required: true,
    };
    expect(
      relationshipToValueTypeString({ meta, collectionSlug: "posts", fieldName: "author" }),
    ).toBe('v.id("users")');
  });

  it("returns v.optional(v.id()) for an optional single relationship", () => {
    const meta: RelationshipFieldMeta = {
      type: "relationship",
      to: "users",
    };
    expect(
      relationshipToValueTypeString({ meta, collectionSlug: "posts", fieldName: "author" }),
    ).toBe('v.optional(v.id("users"))');
  });

  it("returns v.array(v.id()) for a required hasMany relationship", () => {
    const meta: RelationshipFieldMeta = {
      type: "relationship",
      to: "tags",
      hasMany: true,
      required: true,
    };
    expect(
      relationshipToValueTypeString({ meta, collectionSlug: "posts", fieldName: "tags" }),
    ).toBe('v.array(v.id("tags"))');
  });

  it("returns v.optional(v.array(v.id())) for an optional hasMany relationship", () => {
    const meta: RelationshipFieldMeta = {
      type: "relationship",
      to: "tags",
      hasMany: true,
    };
    expect(
      relationshipToValueTypeString({ meta, collectionSlug: "posts", fieldName: "tags" }),
    ).toBe('v.optional(v.array(v.id("tags")))');
  });
});
