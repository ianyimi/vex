import { describe, it, expect } from "vitest";
import { convexFileStorage } from "./index";

describe("convexFileStorage", () => {
  it("returns adapter with name 'convex'", () => {
    const adapter = convexFileStorage();
    expect(adapter.name).toBe("convex");
  });

  it('sets storageIdValueType to v.id("_storage")', () => {
    const adapter = convexFileStorage();
    expect(adapter.storageIdValueType).toBe('v.id("_storage")');
  });

  it("returns adapter with all required methods", () => {
    const adapter = convexFileStorage();
    expect(typeof adapter.getUploadUrl).toBe("function");
    expect(typeof adapter.getUrl).toBe("function");
    expect(typeof adapter.deleteFile).toBe("function");
  });

  it("accepts optional convexUrl", () => {
    const adapter = convexFileStorage({
      convexUrl: "https://my-deployment.convex.cloud",
    });
    expect(adapter.name).toBe("convex");
  });

  it("getUploadUrl throws descriptive error (not yet wired)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.getUploadUrl()).rejects.toThrow("Convex client");
  });

  it("getUrl throws descriptive error (not yet wired)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.getUrl({ storageId: "test-id" })).rejects.toThrow(
      "Convex client",
    );
  });

  it("deleteFile throws descriptive error (not yet wired)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.deleteFile({ storageId: "test-id" })).rejects.toThrow(
      "Convex client",
    );
  });
});
