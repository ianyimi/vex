import { describe, it, expect } from "vitest";
import { checkbox } from "./config";
import { checkboxFieldToValidator } from "./validator";

describe("checkboxFieldToValidator", () => {
  it("generates required boolean validator", () => {
    const field = checkbox({ required: true });
    const validator = checkboxFieldToValidator({ field });

    expect(validator).toBe("v.boolean()");
  });

  it("generates optional boolean validator", () => {
    const field = checkbox({ required: false });
    const validator = checkboxFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.boolean())");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = checkbox();
    const validator = checkboxFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.boolean())");
  });
});
