import { describe, it, expect } from "vitest";
import { text } from "./config";
import { textFieldToValidator } from "./validator";

describe("textFieldToValidator", () => {
  it("generates required string validator", () => {
    const field = text({ required: true, defaultValue: "test" });
    const validator = textFieldToValidator({ field });

    expect(validator).toBe("v.string()");
  });

  it("generates optional string validator", () => {
    const field = text({ required: false, defaultValue: "" });
    const validator = textFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });

  it("ignores length constraints (enforced in form validation, not DB schema)", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: { value: 3 },
      max: { value: 100 },
    });
    const validator = textFieldToValidator({ field });

    // Convex schema just validates type, not length
    expect(validator).toBe("v.string()");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = text({ defaultValue: "" });
    const validator = textFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });
});
