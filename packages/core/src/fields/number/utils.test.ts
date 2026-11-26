import { describe, expect, it } from "vitest";
import { number } from "./config";
import { isInt64NumberField } from "./utils";

describe("isInt64NumberField", () => {
  it("returns true for a field configured with schema.validator: \"int64\"", () => {
    expect(isInt64NumberField(number({ schema: { validator: "int64" } }))).toBe(true);
  });

  it("returns false for the default float64 field", () => {
    expect(isInt64NumberField(number())).toBe(false);
  });
});
