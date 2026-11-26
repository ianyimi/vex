import { describe, it, expect } from "vitest";
import { number } from "./config";

describe("number: int64", () => {
  it("has no implicit defaultValue for a non-required int64 field", () => {
    const field = number({ schema: { validator: "int64" } });
    expect(field.defaultValue).toBeUndefined();
    expect(field.interfaceType).toBe("bigint");
    expect(field.schema).toEqual({ validator: "int64" });
  });

  it("keeps an explicit bigint defaultValue", () => {
    const field = number({ schema: { validator: "int64" }, defaultValue: 42n });
    expect(field.defaultValue).toBe(42n);
  });

  it("resolves bare bigint min/max into [value, error] tuples", () => {
    const field = number({ schema: { validator: "int64" }, min: 1n, max: 100n });
    expect(field.min).toEqual([1n, "Must be at least 1."]);
    expect(field.max).toEqual([100n, "Must be no more than 100."]);
  });

  it("throws when min >= max, same as the float64 path", () => {
    expect(() => number({ schema: { validator: "int64" }, min: 10n, max: 5n })).toThrow(
      "Min value must be lower than the Max value",
    );
  });

  it("leaves the default float64 field untouched", () => {
    const field = number();
    expect(field.schema).toBeUndefined();
    expect(field.interfaceType).toBe("number");
    expect(field.defaultValue).toBeUndefined();
  });
});
