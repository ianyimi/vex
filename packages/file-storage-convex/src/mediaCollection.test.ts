import { describe, it, expect } from "vitest";
import { text } from "@vexcms/core";
import { defineMediaCollection } from "./mediaCollection";

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

  it("gives every injected base field a human-readable label instead of leaving the admin UI to fall back to the raw key", () => {
    const collection = defineMediaCollection({ slug: "images" });
    expect(collection.fields.filename?.label).toBe("Filename");
    expect(collection.fields.alt?.label).toBe("Alt text");
    expect(collection.fields.mimeType?.label).toBe("MIME type");
    expect(collection.fields.size?.label).toBe("Size");
    expect(collection.fields.storageId?.label).toBe("Storage ID");
    expect(collection.fields.src?.label).toBe("URL");
    expect(collection.fields.width?.label).toBe("Width");
    expect(collection.fields.height?.label).toBe("Height");
    expect(collection.fields.deleted?.label).toBe("Deleted");
  });

  it("preserves user-defined fields", () => {
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

  it("tags the collection with meta.storageAdapter without an adapter instance", () => {
    const collection = defineMediaCollection({ slug: "images" });
    expect(collection.meta?.storageAdapter).toBe("convex");
  });
});
