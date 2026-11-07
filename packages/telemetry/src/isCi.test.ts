import { describe, expect, it } from "vitest";

import { isCi } from "./isCi";

describe("isCi", () => {
  it("returns false when no CI environment variable is set", () => {
    expect(isCi({ env: {} })).toBe(false);
  });

  it.each([
    "CI",
    "CONTINUOUS_INTEGRATION",
    "BUILD_NUMBER",
    "GITHUB_ACTIONS",
    "GITLAB_CI",
    "VERCEL",
    "NETLIFY",
  ])("returns true when %s is set", (key) => {
    expect(isCi({ env: { [key]: "true" } })).toBe(true);
  });

  it("ignores an empty string value", () => {
    expect(isCi({ env: { CI: "" } })).toBe(false);
  });
});
