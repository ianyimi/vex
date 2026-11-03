import { describe, expect, it } from "vitest";
import { parseJsonFieldText, stringifyJsonFieldValue } from "./utils";

describe("stringifyJsonFieldValue", () => {
  it("serializes a plain object with two-space indentation", () => {
    expect(stringifyJsonFieldValue({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it("serializes a bare scalar", () => {
    expect(stringifyJsonFieldValue(42)).toBe("42");
  });

  it("returns an empty string for undefined", () => {
    expect(stringifyJsonFieldValue(undefined)).toBe("");
  });

  it("serializes null as the literal 'null'", () => {
    expect(stringifyJsonFieldValue(null)).toBe("null");
  });
});

describe("parseJsonFieldText", () => {
  it("parses a valid JSON object", () => {
    expect(parseJsonFieldText({ text: '{"a":1}' })).toStrictEqual({ ok: true, value: { a: 1 } });
  });

  it("parses a valid bare scalar", () => {
    expect(parseJsonFieldText({ text: "true" })).toStrictEqual({ ok: true, value: true });
  });

  it("parses blank text as undefined", () => {
    expect(parseJsonFieldText({ text: "" })).toStrictEqual({ ok: true, value: undefined });
  });

  it("parses whitespace-only text as undefined", () => {
    expect(parseJsonFieldText({ text: "   \n  " })).toStrictEqual({ ok: true, value: undefined });
  });

  it("returns the parser's own message on invalid JSON", () => {
    const result = parseJsonFieldText({ text: "not valid json" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});
