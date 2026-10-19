import { describe, it, expect } from "vitest";
import { resolveFieldLimit } from "./utils";

describe("resolveFieldLimit", () => {
  it("returns undefined when limit is undefined", () => {
    expect(
      resolveFieldLimit({ limit: undefined, defaultError: () => "Too short." }),
    ).toBeUndefined();
  });

  it("pairs a bare number with the default error message", () => {
    expect(resolveFieldLimit({ limit: 3, defaultError: () => "Too short." })).toEqual([
      3,
      "Too short.",
    ]);
  });

  it("passes the resolved value into defaultError", () => {
    expect(
      resolveFieldLimit({
        limit: 5,
        defaultError: (value) => `At least ${value} required.`,
      }),
    ).toEqual([5, "At least 5 required."]);
  });

  it("returns a [value, error] tuple input unchanged", () => {
    expect(
      resolveFieldLimit({
        limit: [3, "Need 3+ chars."],
        defaultError: () => "Too short.",
      }),
    ).toEqual([3, "Need 3+ chars."]);
  });

  it("does not call defaultError for a tuple input", () => {
    let called = false;
    resolveFieldLimit({
      limit: [3, "Need 3+ chars."],
      defaultError: () => {
        called = true;
        return "Too short.";
      },
    });
    expect(called).toBe(false);
  });
});
