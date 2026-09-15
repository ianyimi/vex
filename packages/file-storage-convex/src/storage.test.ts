import { describe, it, expect } from "vitest";
import { convexFileStorage } from "./storage";

describe("convexFileStorage", () => {
  it("constructs with no arguments", () => {
    const adapter = convexFileStorage();
    expect(adapter.name).toBe("convex");
    expect(adapter.mediaCollections).toEqual([]);
    expect(adapter.admin.softDelete).toBe(false);
  });

  it("supports softDelete option", () => {
    const adapter = convexFileStorage({ admin: { softDelete: true } });
    expect(adapter.admin.softDelete).toBe(true);
  });
});
