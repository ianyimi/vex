import { describe, it, expect } from "vitest";
import { ConvexStorageAdapter } from "./index";
import { defineMediaCollection } from "../index";

describe("ConvexStorageAdapter", () => {
  it("sets the correct name", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = new ConvexStorageAdapter({ mediaCollections: [images] });
    expect(adapter.name).toBe("convex");
  });

  it("tags collections with storageAdapter", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = new ConvexStorageAdapter({ mediaCollections: [images] });
    expect(adapter.mediaCollections[0].meta?.storageAdapter).toBe("convex");
  });

  it("supports softDelete option", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = new ConvexStorageAdapter({
      mediaCollections: [images],
      admin: {
        softDelete: true,
      },
    });
    expect(adapter.admin.softDelete).toBe(true);
  });

  it("defaults softDelete to false", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = new ConvexStorageAdapter({ mediaCollections: [images] });
    expect(adapter.admin.softDelete).toBe(false);
  });
});
