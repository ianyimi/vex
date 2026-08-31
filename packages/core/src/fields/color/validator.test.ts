import { describe, it, expect } from "vitest";
import { color } from "./config";
import { colorFieldToValidator } from "./validator";

describe("colorFieldToValidator", () => {
  it("generates a bare string validator for required fields", () => {
    expect(colorFieldToValidator({ field: color({ required: true }) })).toBe("v.string()");
  });

  it("wraps optional fields in v.optional()", () => {
    expect(colorFieldToValidator({ field: color({ required: false }) })).toBe(
      "v.optional(v.string())",
    );
  });

  it("stores the same Convex type for every format", () => {
    for (const format of ["hex", "rgb", "hsl", "oklch"] as const) {
      expect(colorFieldToValidator({ field: color({ required: true, format }) })).toBe(
        "v.string()",
      );
    }
  });

  it("stores the same Convex type whether or not themeColors is enabled", () => {
    expect(colorFieldToValidator({ field: color({ required: true, themeColors: true }) })).toBe(
      "v.string()",
    );
  });

  it("ignores defaultValue — defaults are a form concern, not a schema one", () => {
    expect(
      colorFieldToValidator({ field: color({ required: true, defaultValue: "#E8622A" }) }),
    ).toBe("v.string()");
  });
});
