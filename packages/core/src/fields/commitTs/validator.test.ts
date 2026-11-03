import { describe, it, expect } from "vitest";
import { commitTs } from "./config";
import { commitTsFieldToValidator } from "./validator";

describe("commitTsFieldToValidator", () => {
  it("is always optional, regardless of on", () => {
    expect(commitTsFieldToValidator({ field: commitTs() })).toBe("v.optional(v.commitTs())");
    expect(commitTsFieldToValidator({ field: commitTs({ on: "publish" }) })).toBe(
      "v.optional(v.commitTs())",
    );
    expect(commitTsFieldToValidator({ field: commitTs({ on: "all" }) })).toBe(
      "v.optional(v.commitTs())",
    );
  });
});
