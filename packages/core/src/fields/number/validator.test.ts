import { describe, it, expect } from "vitest";
import { number } from "./config";
import { numberFieldToValidator } from "./validator";

describe("numberFieldToValidator", () => {
  it("generates required number validator", () => {
    const field = number({ required: true, defaultValue: 0 });
    const validator = numberFieldToValidator({ field });

    expect(validator).toBe("v.number()");
  });

  it("generates optional number validator", () => {
    const field = number({ required: false, defaultValue: 0 });
    const validator = numberFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.number())");
  });

  it("ignores range constraints (enforced in form validation, not DB schema)", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: 0,
      max: 100,
    });
    const validator = numberFieldToValidator({ field });

    // Convex schema just validates type, not range
    expect(validator).toBe("v.number()");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = number({ defaultValue: 0 });
    const validator = numberFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.number())");
  });

  it("generates v.int64() for a required int64 field", () => {
    const field = number({ schema: { validator: "int64" }, required: true });
    expect(numberFieldToValidator({ field })).toBe("v.int64()");
  });

  it("generates v.optional(v.int64()) for an optional int64 field", () => {
    const field = number({ schema: { validator: "int64" } });
    expect(numberFieldToValidator({ field })).toBe("v.optional(v.int64())");
  });
});
