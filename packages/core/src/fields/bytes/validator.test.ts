import { describe, it, expect } from "vitest";
import { bytes } from "./config";
import { bytesFieldToValidator } from "./validator";

describe("bytesFieldToValidator", () => {
  it("generates required v.bytes() validator", () => {
    const field = bytes({ required: true });
    expect(bytesFieldToValidator({ field })).toBe("v.bytes()");
  });

  it("generates optional v.optional(v.bytes()) validator", () => {
    const field = bytes({ required: false });
    expect(bytesFieldToValidator({ field })).toBe("v.optional(v.bytes())");
  });
});
