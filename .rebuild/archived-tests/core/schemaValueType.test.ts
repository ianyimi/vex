import { describe, it, expect } from "vitest";
import { uploadToValueTypeString } from "./schemaValueType";
import { upload } from ".";

describe("uploadToValueTypeString", () => {
  it("returns v.id() for a required single upload reference", () => {
    expect(
      uploadToValueTypeString({
        field: upload({ to: "images", required: true }),
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.id("images")');
  });

  it("returns v.optional(v.id()) for an optional single upload reference", () => {
    expect(
      uploadToValueTypeString({
        field: upload({ to: "images" }),
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.optional(v.id("images"))');
  });

  it("returns v.array(v.id()) for a required hasMany upload reference", () => {
    expect(
      uploadToValueTypeString({
        field: upload({ to: "images", hasMany: true, required: true }),
        collectionSlug: "posts",
        fieldName: "gallery",
      }),
    ).toBe('v.array(v.id("images"))');
  });

  it("returns v.optional(v.array(v.id())) for an optional hasMany upload reference", () => {
    expect(
      uploadToValueTypeString({
        field: upload({ to: "images", hasMany: true }),
        collectionSlug: "posts",
        fieldName: "gallery",
      }),
    ).toBe('v.optional(v.array(v.id("images")))');
  });

  it("uses the correct media collection slug in v.id()", () => {
    expect(
      uploadToValueTypeString({
        field: upload({ to: "documents", required: true }),
        collectionSlug: "articles",
        fieldName: "attachment",
      }),
    ).toBe('v.id("documents")');
  });

  it("ignores accept and maxSize for schema generation", () => {
    expect(
      uploadToValueTypeString({
        field: upload({ to: "images", required: true, accept: ["image/*"], maxSize: 5 * 1024 * 1024 }),
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.id("images")');
  });
});
