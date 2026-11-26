import { describe, expect, it } from "vitest";
import { parseConvexValue, serializeConvexValue, stringifyConvexValue } from "./convexValueJson";

describe("stringifyConvexValue", () => {
  it("renders a bigint as bare unquoted decimal digits", () => {
    expect(stringifyConvexValue({ value: { count: 9007199254740993n } })).toBe(
      '{"count":9007199254740993}',
    );
  });

  it("renders a negative bigint correctly", () => {
    expect(stringifyConvexValue({ value: -5n })).toBe("-5");
  });

  it("renders an ArrayBuffer as its byte-size placeholder", () => {
    expect(stringifyConvexValue({ value: { payload: new ArrayBuffer(512) } })).toBe(
      '{"payload":"<512 bytes>"}',
    );
  });

  it("renders a plain object identically to JSON.stringify", () => {
    expect(stringifyConvexValue({ value: { a: 1, b: "x" } })).toBe(JSON.stringify({ a: 1, b: "x" }));
  });

  it("passes space through like JSON.stringify", () => {
    expect(stringifyConvexValue({ value: { a: 1 }, space: 2 })).toBe(
      JSON.stringify({ a: 1 }, null, 2),
    );
  });

  it("never throws on a mix of bigint and ArrayBuffer nested inside an array", () => {
    expect(() =>
      stringifyConvexValue({ value: [1n, new ArrayBuffer(4), { n: 2n }] }),
    ).not.toThrow();
    expect(stringifyConvexValue({ value: [1n, new ArrayBuffer(4), { n: 2n }] })).toBe(
      '[1,"<4 bytes>",{"n":2}]',
    );
  });

  it("never unquotes a plain string value shaped like the sentinel marker (regression: a fixed sentinel collided with user data before the per-call nonce)", () => {
    const trap = "\u0000vex:bigint:5";
    const result = stringifyConvexValue({ value: { a: trap, b: 10n } });
    expect(result).toBe(`{"a":${JSON.stringify(trap)},"b":10}`);
  });
});

describe("serializeConvexValue / parseConvexValue", () => {
  it("round-trips a bigint losslessly", () => {
    const text = serializeConvexValue({ value: { count: 9007199254740993n } });
    expect(parseConvexValue({ text })).toEqual({ count: 9007199254740993n });
  });

  it("round-trips an ArrayBuffer losslessly", () => {
    const bytes = new Uint8Array([1, 2, 3, 255]).buffer;
    const text = serializeConvexValue({ value: { payload: bytes } });
    const parsed = parseConvexValue({ text }) as { payload: ArrayBuffer };
    expect(new Uint8Array(parsed.payload)).toEqual(new Uint8Array(bytes));
  });

  it("round-trips a plain object", () => {
    const text = serializeConvexValue({ value: { a: 1, b: ["x", "y"] } });
    expect(parseConvexValue({ text })).toEqual({ a: 1, b: ["x", "y"] });
  });
});
