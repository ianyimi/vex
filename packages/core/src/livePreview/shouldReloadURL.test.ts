import { describe, it, expect } from "vitest";
import { shouldReloadURL } from "./shouldReloadURL";

describe("shouldReloadURL", () => {
  it("returns true when reloadOnFields is not set", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview" },
        changedFields: ["title"],
      }),
    ).toBe(true);
  });

  it("returns false when reloadOnFields is empty array", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview", reloadOnFields: [] },
        changedFields: ["title"],
      }),
    ).toBe(false);
  });

  it("returns true when changed field is in reloadOnFields", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview", reloadOnFields: ["slug"] },
        changedFields: ["title", "slug"],
      }),
    ).toBe(true);
  });

  it("returns false when changed field is not in reloadOnFields", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview", reloadOnFields: ["slug"] },
        changedFields: ["title", "content"],
      }),
    ).toBe(false);
  });

  it("returns false when changedFields is empty", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview", reloadOnFields: ["slug"] },
        changedFields: [],
      }),
    ).toBe(false);
  });

  it("returns true with undefined reloadOnFields and empty changedFields", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview" },
        changedFields: [],
      }),
    ).toBe(true);
  });
});
