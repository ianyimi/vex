import { describe, expect, it } from "vitest";
import { peekFieldCopyText } from "./ListViewPeekCopyButton";

describe("peekFieldCopyText", () => {
  it("stringifies an object-shaped value", () => {
    expect(peekFieldCopyText({ a: 1, b: "x" })).toBe(JSON.stringify({ a: 1, b: "x" }));
  });

  it("stringifies a primitive via String()", () => {
    expect(peekFieldCopyText(42)).toBe("42");
    expect(peekFieldCopyText(true)).toBe("true");
  });

  it("returns an empty string for null/undefined", () => {
    expect(peekFieldCopyText(null)).toBe("");
    expect(peekFieldCopyText(undefined)).toBe("");
  });

  it("never throws copying a value containing a bigint", () => {
    expect(() => peekFieldCopyText({ count: 9007199254740993n })).not.toThrow();
    expect(peekFieldCopyText({ count: 9007199254740993n })).toBe('{"count":9007199254740993}');
  });

  it("never throws copying a value containing an ArrayBuffer", () => {
    const value = { payload: new ArrayBuffer(16) };
    expect(() => peekFieldCopyText(value)).not.toThrow();
    expect(peekFieldCopyText(value)).toBe('{"payload":"<16 bytes>"}');
  });
});
