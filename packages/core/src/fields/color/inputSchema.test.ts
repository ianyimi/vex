import { describe, it, expect } from "vitest";
import { color } from "./config";
import { colorFieldToInputSchema } from "./inputSchema";

describe("colorFieldToInputSchema", () => {
  it("accepts every supported notation regardless of the field's format", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true }) });

    expect(schema.safeParse("#E8622A").success).toBe(true);
    expect(schema.safeParse("#e8622a").success).toBe(true);
    expect(schema.safeParse("#E8622A80").success).toBe(true);
    expect(schema.safeParse("rgb(232, 98, 42)").success).toBe(true);
    expect(schema.safeParse("rgba(232, 98, 42, 0.5)").success).toBe(true);
    expect(schema.safeParse("hsl(17.7, 81%, 54%)").success).toBe(true);
    expect(schema.safeParse("hsla(17.7, 81%, 54%, 0.5)").success).toBe(true);
    expect(schema.safeParse("oklch(65.7% 0.179 40.9)").success).toBe(true);
    expect(schema.safeParse("oklch(65.7% 0.179 40.9 / 0.5)").success).toBe(true);
  });

  it("still accepts hex after a field switches to oklch — existing documents stay valid", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true, format: "oklch" }) });

    expect(schema.safeParse("#E8622A").success).toBe(true);
    expect(schema.safeParse("oklch(65.7% 0.179 40.9)").success).toBe(true);
  });

  it("rejects shorthand hex, malformed notation, and non-strings", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true }) });

    expect(schema.safeParse("#fff").success).toBe(false);
    expect(schema.safeParse("E8622A").success).toBe(false);
    expect(schema.safeParse("#E8622AZZ").success).toBe(false);
    expect(schema.safeParse("rgb(232 98 42)").success).toBe(false);
    expect(schema.safeParse("oklch(65.7 0.179 40.9)").success).toBe(false);
    expect(schema.safeParse("red").success).toBe(false);
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("rejects theme tokens unless themeColors is enabled", () => {
    const off = colorFieldToInputSchema({ field: color({ required: true }) });
    const on = colorFieldToInputSchema({ field: color({ required: true, themeColors: true }) });

    expect(off.safeParse("var(--primary)").success).toBe(false);
    expect(on.safeParse("var(--primary)").success).toBe(true);
    expect(on.safeParse("var(--sidebar-primary-foreground)").success).toBe(true);
    expect(on.safeParse("#E8622A").success).toBe(true);
  });

  it("rejects var() fallback syntax even when themeColors is enabled", () => {
    const schema = colorFieldToInputSchema({
      field: color({ required: true, themeColors: true }),
    });

    expect(schema.safeParse("var(--primary, #fff)").success).toBe(false);
    expect(schema.safeParse("var(primary)").success).toBe(false);
  });

  it("names the field's own format in the error message", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true, format: "oklch" }) });
    const result = schema.safeParse("nope");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Enter a colour, e.g. oklch(65.7% 0.179 40.9).",
      );
    }
  });

  it("mentions theme tokens in the error message when they are accepted", () => {
    const schema = colorFieldToInputSchema({
      field: color({ required: true, themeColors: true }),
    });
    const result = schema.safeParse("nope");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Enter a colour, e.g. #E8622A. A theme token such as var(--primary) is also accepted.",
      );
    }
  });

  it("reports 'required' rather than a notation error on an empty required field", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: true }) });
    const result = schema.safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("This field is required.");
    }
  });

  it("returns the empty-string default for an optional field given undefined", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: false }) });
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("accepts a cleared optional field", () => {
    const schema = colorFieldToInputSchema({ field: color({ required: false }) });

    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse("#E8622A").success).toBe(true);
    expect(schema.safeParse("nope").success).toBe(false);
  });

  it("applies an explicit default on a required field", () => {
    const schema = colorFieldToInputSchema({
      field: color({ required: true, defaultValue: "#E8622A" }),
    });
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("#E8622A");
    }
  });
});
