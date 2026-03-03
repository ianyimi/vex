import { describe, it, expect } from "vitest";
import { VexAuthConfigError } from "@vexcms/core";
import { betterAuthTypeToValueType } from "./valueTypes";

describe("betterAuthTypeToValueType", () => {
  // --- Primitive types (required) ---

  it('maps "string" required to v.string()', () => {
    expect(betterAuthTypeToValueType({ type: "string", required: true })).toBe(
      "v.string()",
    );
  });

  it('maps "number" required to v.number()', () => {
    expect(betterAuthTypeToValueType({ type: "number", required: true })).toBe(
      "v.number()",
    );
  });

  it('maps "boolean" required to v.boolean()', () => {
    expect(betterAuthTypeToValueType({ type: "boolean", required: true })).toBe(
      "v.boolean()",
    );
  });

  it('maps "date" required to v.number() (stored as ms)', () => {
    expect(betterAuthTypeToValueType({ type: "date", required: true })).toBe(
      "v.number()",
    );
  });

  it('maps "json" required to v.any()', () => {
    expect(betterAuthTypeToValueType({ type: "json", required: true })).toBe(
      "v.any()",
    );
  });

  // --- Array types (required) ---

  it('maps "string[]" required to v.array(v.string())', () => {
    expect(
      betterAuthTypeToValueType({ type: "string[]", required: true }),
    ).toBe("v.array(v.string())");
  });

  it('maps "number[]" required to v.array(v.number())', () => {
    expect(
      betterAuthTypeToValueType({ type: "number[]", required: true }),
    ).toBe("v.array(v.number())");
  });

  // --- Enum type (Array<LiteralString>) ---

  it('maps enum array ["admin", "user"] required to v.string()', () => {
    expect(
      betterAuthTypeToValueType({
        type: ["admin", "user"] as unknown as any,
        required: true,
      }),
    ).toBe("v.string()");
  });

  it("maps empty enum array [] required to v.string()", () => {
    expect(
      betterAuthTypeToValueType({
        type: [] as unknown as any,
        required: true,
      }),
    ).toBe("v.string()");
  });

  // --- Reference / relationship fields ---

  it("maps a required reference field to v.id() with the model name", () => {
    expect(
      betterAuthTypeToValueType({
        type: "string",
        required: true,
        references: { model: "user", field: "id" },
      }),
    ).toBe('v.id("user")');
  });

  it("maps an optional reference field to v.optional(v.id())", () => {
    expect(
      betterAuthTypeToValueType({
        type: "string",
        required: false,
        references: { model: "session", field: "id" },
      }),
    ).toBe('v.optional(v.id("session"))');
  });

  it("reference takes precedence over type (type is ignored)", () => {
    expect(
      betterAuthTypeToValueType({
        type: "number",
        required: true,
        references: { model: "account", field: "id" },
      }),
    ).toBe('v.id("account")');
  });

  it("uses the model name from references for custom table names", () => {
    expect(
      betterAuthTypeToValueType({
        type: "string",
        required: true,
        references: { model: "users", field: "id" },
      }),
    ).toBe('v.id("users")');
  });

  // --- Optional wrapping ---

  it("wraps in v.optional() when required is false", () => {
    expect(betterAuthTypeToValueType({ type: "string", required: false })).toBe(
      "v.optional(v.string())",
    );
  });

  it("wraps enum in v.optional() when required is false", () => {
    expect(
      betterAuthTypeToValueType({
        type: ["admin", "user"] as unknown as any,
        required: false,
      }),
    ).toBe("v.optional(v.string())");
  });

  it("wraps json in v.optional() when required is false", () => {
    expect(betterAuthTypeToValueType({ type: "json", required: false })).toBe(
      "v.optional(v.any())",
    );
  });

  it("defaults required to false when not specified", () => {
    expect(betterAuthTypeToValueType({ type: "string" })).toBe(
      "v.optional(v.string())",
    );
  });

  // --- Error cases ---

  it("throws VexAuthConfigError on truly unknown type", () => {
    expect(() =>
      betterAuthTypeToValueType({
        type: "bigint" as any,
        required: true,
      }),
    ).toThrow(VexAuthConfigError);
  });

  it("error message includes the unknown type", () => {
    expect(() =>
      betterAuthTypeToValueType({ type: "xml" as any, required: true }),
    ).toThrow(/xml/);
  });
});
