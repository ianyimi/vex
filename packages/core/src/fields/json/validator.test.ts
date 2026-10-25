import { describe, it, expect } from "vitest";
import { json } from "./config";
import { jsonFieldToValidator } from "./validator";

describe("jsonFieldToValidator", () => {
  it("generates required v.any() validator", () => {
    const field = json({ required: true });
    expect(jsonFieldToValidator({ field })).toBe("v.any()");
  });

  it("generates optional v.optional(v.any()) validator", () => {
    const field = json({ required: false });
    expect(jsonFieldToValidator({ field })).toBe("v.optional(v.any())");
  });

  it("ignores value shape — a plain object and a plain array produce the same validator", () => {
    const objectField = json({ required: true, defaultValue: { a: 1 } });
    const arrayField = json({ required: true, defaultValue: [1, 2, 3] });
    expect(jsonFieldToValidator({ field: objectField })).toBe("v.any()");
    expect(jsonFieldToValidator({ field: arrayField })).toBe("v.any()");
  });
});
