import { describe, it, expect } from "vitest";
import { select } from "./config";
import { VexConfigError } from "../../errors";

describe("select() — schema override", () => {
  it("defaults to array storage without a schema override", () => {
    const field = select({ options: [{ label: "Draft", value: "draft" }] });
    expect(field.defaultValue).toEqual([]);
    expect(field.interfaceType).toBe("string[]");
    expect(field.schema).toBeUndefined();
  });

  it("defaults defaultValue to '' and interfaceType to string for schema.validator: 'literal'", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "literal" },
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(field.defaultValue).toBe("");
    expect(field.interfaceType).toBe("string");
    expect(field.schema).toEqual({ validator: "literal" });
  });

  it("defaults defaultValue to '' and interfaceType to string for schema.validator: 'string'", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "string" },
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(field.defaultValue).toBe("");
    expect(field.interfaceType).toBe("string");
    expect(field.schema).toEqual({ validator: "string" });
  });

  it("honors an explicit defaultValue over the computed scalar default", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "literal" },
      defaultValue: "draft",
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(field.defaultValue).toBe("draft");
  });

  it("throws VexConfigError when schema.validator: 'literal' has no options", () => {
    expect(() => select({ hasMany: false, schema: { validator: "literal" } })).toThrow(
      new VexConfigError(
        'select(): schema.validator: "literal" requires at least one option — an empty option set has no literal to store.',
      ),
    );
  });

  it("does not throw for schema.validator: 'string' with no options", () => {
    expect(() => select({ hasMany: false, schema: { validator: "string" } })).not.toThrow();
  });
});
