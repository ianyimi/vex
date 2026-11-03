import { describe, expect, it } from "vitest";
import { isPlainObject } from "./isPlainObject";

describe("isPlainObject", () => {
  it("accepts a plain object, including an empty one", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ where: { field: "title", op: "eq", value: "x" } })).toBe(true);
  });

  it("rejects null", () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it("rejects an array", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it("rejects primitives", () => {
    expect(isPlainObject("state")).toBe(false);
    expect(isPlainObject(42)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });
});
