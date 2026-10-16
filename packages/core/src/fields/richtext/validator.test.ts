import { describe, it, expect } from "vitest";
import { richtext } from "./config";
import { richTextFieldToValidator } from "./validator";

describe("richTextFieldToValidator", () => {
  it("generates the array validator for required fields", () => {
    expect(
      richTextFieldToValidator({ field: richtext({ required: true }) }),
    ).toBe("v.array(\nv.any()\n)");
  });

  it("wraps optional fields in v.optional()", () => {
    expect(
      richTextFieldToValidator({ field: richtext({ required: false }) }),
    ).toBe("v.optional(v.array(\nv.any()\n))");
  });

  it("ignores defaultValue — defaults are a form concern, not a schema one", () => {
    expect(
      richTextFieldToValidator({
        field: richtext({
          required: true,
          defaultValue: [{ type: "p", children: [{ text: "Hi" }] }],
        }),
      }),
    ).toBe("v.array(\nv.any()\n)");
  });
});
