import { describe, it, expect } from "vitest";
import { ConvexStorageAdapter } from "./index";

describe("ConvexStorageAdapter", () => {
  it("sets the correct name", () => {
    const adapter = new ConvexStorageAdapter();
    expect(adapter.name).toBe("convex");
  });

  it("always resolves mediaCollections to an empty array", () => {
    const adapter = new ConvexStorageAdapter();
    expect(adapter.mediaCollections).toEqual([]);
  });

  it("supports softDelete option", () => {
    const adapter = new ConvexStorageAdapter({ admin: { softDelete: true } });
    expect(adapter.admin.softDelete).toBe(true);
  });

  it("defaults softDelete to false", () => {
    const adapter = new ConvexStorageAdapter();
    expect(adapter.admin.softDelete).toBe(false);
  });
});
