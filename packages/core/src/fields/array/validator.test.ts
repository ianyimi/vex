import { describe, it, expect } from "vitest";
import { array } from "./config";
import { text } from "../text";
import { arrayFieldToValidator } from "./validator";

describe("arrayFieldToValidator", () => {
  it("generates optional array validator for array without required: true", () => {
    // Array has required: false (default, not explicitly set)
    // So it gets wrapped in v.optional()
    const field = array({
      items: text({ required: true, defaultValue: "test" }),
    });
    const validator = arrayFieldToValidator({ field });

    // Items are required=true, so v.string()
    // Array is optional (no required: true), so outer v.optional()
    expect(validator).toBe("v.optional(v.array(v.string()))");
  });

  it("generates required array validator with optional items", () => {
    // Array has required: false
    // Items have required: false (default)
    const field = array({ items: text({ defaultValue: "" }), required: false });
    const validator = arrayFieldToValidator({ field });

    // Items are optional, so v.optional(v.string())
    // Array is optional, so outer v.optional()
    expect(validator).toBe("v.optional(v.array(v.string()))");
  });

  it("ignores min/max constraints (enforced in form validation, not DB schema)", () => {
    const field = array({
      items: text({
        required: true,
        defaultValue: "test",
      }),
      min: { value: 3 },
      max: { value: 100 },
    });
    const validator = arrayFieldToValidator({ field });

    // min/max don't affect validator, just type validation
    // Array is optional (no required: true), so v.optional()
    expect(validator).toBe("v.optional(v.array(v.string()))");
  });

  it("generates required array validator when required: true", () => {
    const field = array({
      items: text({ required: true }),
      required: true,
    });
    const validator = arrayFieldToValidator({ field });

    // Array is required, so no outer v.optional()
    // Items are required, so v.string()
    expect(validator).toBe("v.array(v.string())");
  });
});

