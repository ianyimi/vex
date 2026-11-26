import { describe, it, expect } from "vitest";
import { text } from "../text/config";
import { applyBaseValidators } from "./utils";

describe("applyBaseValidators", () => {
  it("leaves a required, non-nullable field's validator unwrapped", () => {
    const field = text({ required: true });
    expect(applyBaseValidators({ field, validator: "v.string()" })).toBe("v.string()");
  });

  it("wraps an optional, non-nullable field's validator in v.optional()", () => {
    const field = text({ required: false });
    expect(applyBaseValidators({ field, validator: "v.string()" })).toBe("v.optional(v.string())");
  });

  it("wraps a required, nullable field's validator in v.nullable() only", () => {
    const field = text({ required: true, nullable: true });
    expect(applyBaseValidators({ field, validator: "v.string()" })).toBe("v.nullable(v.string())");
  });

  it("wraps an optional, nullable field's validator v.optional(v.nullable(...)), nullable innermost", () => {
    const field = text({ required: false, nullable: true });
    expect(applyBaseValidators({ field, validator: "v.string()" })).toBe(
      "v.optional(v.nullable(v.string()))",
    );
  });
});
