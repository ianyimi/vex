import { describe, expect, it } from "vitest";
import { valuesEqual } from "./valuesEqual";

describe("valuesEqual", () => {
  it("treats two objects with the same content as equal regardless of reference", () => {
    expect(valuesEqual({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toBe(true);
  });

  it("detects a changed nested value", () => {
    expect(valuesEqual({ a: 1, b: [1, 2] }, { a: 1, b: [1, 3] })).toBe(false);
  });

  it("treats primitives by value", () => {
    expect(valuesEqual("x", "x")).toBe(true);
    expect(valuesEqual(1, 2)).toBe(false);
  });

  it("treats null and undefined as unequal to each other and to objects", () => {
    expect(valuesEqual(null, undefined)).toBe(false);
    expect(valuesEqual(null, {})).toBe(false);
  });
});
