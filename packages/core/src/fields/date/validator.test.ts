import { describe, it, expect } from "vitest";
import { date } from "./config";
import { dateFieldToValidator } from "./validator";

describe("dateFieldToValidator", () => {
  it("generates required number validator", () => {
    const field = date({ required: true });
    const validator = dateFieldToValidator({ field });

    expect(validator).toBe("v.number()");
  });

  it("generates optional number validator", () => {
    const field = date({ required: false });
    const validator = dateFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.number())");
  });

  it("ignores time property (UI concern only, not reflected in DB schema)", () => {
    const field = date({
      required: true,
      time: true,
    });
    const validator = dateFieldToValidator({ field });

    // time affects the picker UI only — the stored value is still v.number()
    expect(validator).toBe("v.number()");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = date({});
    const validator = dateFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.number())");
  });
});
