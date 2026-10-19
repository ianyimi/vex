import { describe, it, expect } from "vitest";
import { email } from "./config";
import { emailFieldToValidator } from "./validator";

describe("emailFieldToValidator", () => {
  it("generates required string validator", () => {
    const field = email({ required: true, defaultValue: "test@example.com" });
    const validator = emailFieldToValidator({ field });

    expect(validator).toBe("v.string()");
  });

  it("generates optional string validator", () => {
    const field = email({ required: false, defaultValue: "" });
    const validator = emailFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });

  it("ignores length constraints (enforced in form validation, not DB schema)", () => {
    const field = email({
      required: true,
      defaultValue: "test@example.com",
      min: 3,
      max: 100,
    });
    const validator = emailFieldToValidator({ field });

    expect(validator).toBe("v.string()");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = email({ defaultValue: "" });
    const validator = emailFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });
});
