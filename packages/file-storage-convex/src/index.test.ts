import { describe, it, expect } from "vitest";
import { convexFileStorage, defineMediaCollection } from "./index";
import { text } from "@vexcms/core";

describe("defineMediaCollection", () => {
  it("creates a media collection with required fields", () => {
    const collection = defineMediaCollection({ slug: "images" });
    expect(collection.slug).toBe("images");
    expect(collection.fields).toHaveProperty("alt");
    expect(collection.fields).toHaveProperty("filename");
    expect(collection.fields).toHaveProperty("mimeType");
    expect(collection.fields).toHaveProperty("size");
    expect(collection.fields).toHaveProperty("storageId");
    expect(collection.fields).toHaveProperty("deleted");
    expect(collection.fields).toHaveProperty("src");
    expect(collection.fields).toHaveProperty("width");
    expect(collection.fields).toHaveProperty("height");
  });

  it("preserves user-defined fields", () => {
    // text() would be imported from @vexcms/core in real usage
    const collection = defineMediaCollection({
      slug: "images",
      fields: {
        caption: text({ label: "Caption" }),
      },
    });
    expect(collection.fields).toHaveProperty("caption");
  });

  it("does not override user-provided alt field", () => {
    const collection = defineMediaCollection({
      slug: "images",
      fields: {
        alt: text({ label: "Custom Alt" }),
      },
    });
    const altField = collection.fields.alt;
    expect(altField.label).toBe("Custom Alt");
  });
});

describe("convexFileStorage", () => {
  it("requires explicit media collections", () => {
    // This should be a type error if mediaCollections is not provided
    // In runtime, it would throw or produce empty mediaCollections
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage({ mediaCollections: [images] });
    expect(adapter.mediaCollections.length).toBe(1);
    expect(adapter.mediaCollections[0].slug).toBe("images");
    expect(adapter.mediaCollections[0].meta?.storageAdapter).toBe("convex");
    expect(adapter.name).toBe("convex");
    expect(adapter.admin.softDelete).toBe(false);
  });

  it("uses provided media collections with soft delete", () => {
    const images = defineMediaCollection({ slug: "images" });
    const videos = defineMediaCollection({ slug: "videos" });
    const adapter = convexFileStorage({
      mediaCollections: [images, videos],
      admin: {
        softDelete: true,
      },
    });
    expect(adapter.mediaCollections.length).toBe(2);
    expect(adapter.admin.softDelete).toBe(true);
  });

  it("tags collections with storageAdapter", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage({ mediaCollections: [images] });
    expect(adapter.mediaCollections[0].meta?.storageAdapter).toBe("convex");
  });
});
