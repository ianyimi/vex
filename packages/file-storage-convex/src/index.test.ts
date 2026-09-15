import { describe, it, expect } from "vitest";
import { convexFileStorage, defineMediaCollection } from "./index";

describe("index barrel", () => {
  it("re-exports defineMediaCollection and convexFileStorage", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage();
    expect(images.slug).toBe("images");
    expect(adapter.name).toBe("convex");
  });
});
