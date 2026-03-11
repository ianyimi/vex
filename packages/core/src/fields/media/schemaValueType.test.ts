import { describe, it, expect } from "vitest";
import { uploadToValueTypeString } from "./schemaValueType";
import type { UploadFieldMeta } from "../../types";

describe("uploadToValueTypeString", () => {
  it("returns v.id() for a required single upload reference", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
      required: true,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.id("images")');
  });

  it("returns v.optional(v.id()) for an optional single upload reference", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.optional(v.id("images"))');
  });

  it("returns v.array(v.id()) for a required hasMany upload reference", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
      hasMany: true,
      required: true,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "gallery",
      }),
    ).toBe('v.array(v.id("images"))');
  });

  it("returns v.optional(v.array(v.id())) for an optional hasMany upload reference", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
      hasMany: true,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "gallery",
      }),
    ).toBe('v.optional(v.array(v.id("images")))');
  });

  it("uses the correct media collection slug in v.id()", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "documents",
      required: true,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "articles",
        fieldName: "attachment",
      }),
    ).toBe('v.id("documents")');
  });

  it("ignores accept and maxSize for schema generation", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
      required: true,
      accept: ["image/*"],
      maxSize: 5 * 1024 * 1024,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.id("images")');
  });
});
