import { describe, it, expect } from "vitest";
import { url } from "./config";
import { urlFieldToValidator } from "./validator";

describe("urlFieldToValidator", () => {
  it("generates required string validator", () => {
    const field = url({ required: true });
    const validator = urlFieldToValidator({ field });

    expect(validator).toBe("v.string()");
  });

  it("generates optional string validator", () => {
    const field = url({ required: false });
    const validator = urlFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = url({ defaultValue: "" });
    const validator = urlFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });
});
