import { describe, it, expect } from "vitest";
import { color } from "./config";

describe("color field factory", () => {
  it("creates a color field with default options", () => {
    const field = color({ label: "Color" });
    expect(field.type).toBe("color");
    expect(field.label).toBe("Color");
    expect(field.format).toBeUndefined();
    expect(field.themeColors).toBeUndefined();
  });

  it("accepts format option", () => {
    const field = color({ label: "Color", format: "oklch" });
    expect(field.format).toBe("oklch");
  });

  it("accepts themeColors option", () => {
    const field = color({ label: "Color", themeColors: true });
    expect(field.themeColors).toBe(true);
  });

  it("creates with no args", () => {
    const field = color();
    expect(field.type).toBe("color");
  });

  it("accepts required and defaultValue", () => {
    const field = color({ label: "Color", required: true, defaultValue: "#000000" });
    expect(field.required).toBe(true);
    expect(field.defaultValue).toBe("#000000");
  });

  it("accepts all format values", () => {
    expect(color({ format: "hex" }).format).toBe("hex");
    expect(color({ format: "hsl" }).format).toBe("hsl");
    expect(color({ format: "oklch" }).format).toBe("oklch");
  });
});
