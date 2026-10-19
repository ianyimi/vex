import { describe, it, expect } from "vitest";
import { textarea } from "./config";
import { textareaFieldToValidator } from "./validator";

describe("textareaFieldToValidator", () => {
  it("generates required string validator", () => {
    const field = textarea({ required: true, defaultValue: "test" });
    const validator = textareaFieldToValidator({ field });

    expect(validator).toBe("v.string()");
  });

  it("generates optional string validator", () => {
    const field = textarea({ required: false, defaultValue: "" });
    const validator = textareaFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });

  it("ignores length constraints (enforced in form validation, not DB schema)", () => {
    const field = textarea({
      required: true,
      defaultValue: "test",
      min: 3,
      max: 100,
    });
    const validator = textareaFieldToValidator({ field });

    // Convex schema just validates type, not length
    expect(validator).toBe("v.string()");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = textarea({ defaultValue: "" });
    const validator = textareaFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });
});
