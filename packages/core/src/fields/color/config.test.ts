import { describe, it, expect } from "vitest";
import { color } from "./config";

describe("color", () => {
  it("defaults format to hex and themeColors to false", () => {
    const field = color();

    expect(field.format).toBe("hex");
    expect(field.themeColors).toBe(false);
  });

  it("keeps an explicit format and themeColors", () => {
    const field = color({ format: "oklch", themeColors: true });

    expect(field.format).toBe("oklch");
    expect(field.themeColors).toBe(true);
  });

  it("resolves format even when options spread an explicit undefined", () => {
    const field = color({ format: undefined, themeColors: undefined });

    expect(field.format).toBe("hex");
    expect(field.themeColors).toBe(false);
  });
});
