import { describe, it, expect } from "vitest";
import { relationshipToValueTypeString } from "./schemaValueType";
import { relationship } from ".";

describe("relationshipToValueTypeString", () => {
  it("returns v.id() for a required single relationship", () => {
    expect(
      relationshipToValueTypeString({ field: relationship({ to: "users", required: true }), collectionSlug: "posts", fieldName: "author" }),
    ).toBe('v.id("users")');
  });

  it("returns v.optional(v.id()) for an optional single relationship", () => {
    expect(
      relationshipToValueTypeString({ field: relationship({ to: "users" }), collectionSlug: "posts", fieldName: "author" }),
    ).toBe('v.optional(v.id("users"))');
  });

  it("returns v.array(v.id()) for a required hasMany relationship", () => {
    expect(
      relationshipToValueTypeString({ field: relationship({ to: "tags", hasMany: true, required: true }), collectionSlug: "posts", fieldName: "tags" }),
    ).toBe('v.array(v.id("tags"))');
  });

  it("returns v.optional(v.array(v.id())) for an optional hasMany relationship", () => {
    expect(
      relationshipToValueTypeString({ field: relationship({ to: "tags", hasMany: true }), collectionSlug: "posts", fieldName: "tags" }),
    ).toBe('v.optional(v.array(v.id("tags")))');
  });
});
