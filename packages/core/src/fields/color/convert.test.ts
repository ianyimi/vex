import { describe, it, expect } from "vitest";
import { parseColor, serializeColor, type ColorValue } from "./convert";
import { COLOR_FORMATS, type ColorFormat } from "./formats";

/** Ember brand colour from apps/www/src/app/globals.css. */
const EMBER: ColorValue = { r: 232, g: 98, b: 42, a: 1 };

const FORMATS = Object.values(COLOR_FORMATS).map((entry) => entry.format);

describe("serializeColor", () => {
  it("writes each notation for an opaque colour", () => {
    expect(serializeColor({ color: EMBER, format: "hex" })).toBe("#e8622a");
    expect(serializeColor({ color: EMBER, format: "rgb" })).toBe("rgb(232, 98, 42)");
    expect(serializeColor({ color: EMBER, format: "hsl" })).toBe("hsl(17.7, 80.5%, 53.7%)");
    expect(serializeColor({ color: EMBER, format: "oklch" })).toBe("oklch(65.73% 0.17941 40.85)");
  });

  it("adds an alpha channel only when the colour is translucent", () => {
    const translucent: ColorValue = { ...EMBER, a: 0.5 };

    expect(serializeColor({ color: translucent, format: "hex" })).toBe("#e8622a80");
    expect(serializeColor({ color: translucent, format: "rgb" })).toBe("rgba(232, 98, 42, 0.5)");
    expect(serializeColor({ color: translucent, format: "hsl" })).toBe(
      "hsla(17.7, 80.5%, 53.7%, 0.5)",
    );
    expect(serializeColor({ color: translucent, format: "oklch" })).toBe(
      "oklch(65.73% 0.17941 40.85 / 0.5)",
    );
  });

  it("pins hue to zero for achromatic colours", () => {
    const black: ColorValue = { r: 10, g: 10, b: 10, a: 1 };

    expect(serializeColor({ color: black, format: "oklch" })).toBe("oklch(14.48% 0 0)");
    expect(serializeColor({ color: black, format: "hsl" })).toBe("hsl(0, 0%, 3.9%)");
  });
});

describe("parseColor", () => {
  it("reads each notation back to the same colour", () => {
    for (const format of FORMATS) {
      const value = serializeColor({ color: EMBER, format });

      expect(parseColor({ value }), format).toEqual(EMBER);
    }
  });

  it("round-trips every 8-bit colour on a deterministic sweep", () => {
    // 4096 colours on a 16-step lattice, covering every channel extreme and the
    // full hue circle. A precision regression in any notation shows up here
    // rather than in a hand-picked example that happens to survive.
    const drifted: string[] = [];
    for (let r = 0; r < 256; r += 17) {
      for (let g = 0; g < 256; g += 17) {
        for (let b = 0; b < 256; b += 17) {
          const color: ColorValue = { r, g, b, a: 1 };
          for (const format of FORMATS) {
            const parsed = parseColor({ value: serializeColor({ color, format }) });
            if (parsed?.r !== r || parsed?.g !== g || parsed?.b !== b) {
              drifted.push(`${format} ${serializeColor({ color, format })}`);
            }
          }
        }
      }
    }

    expect(drifted).toEqual([]);
  });

  it("reads a value written in a format the field no longer uses", () => {
    const parsed = parseColor({ value: "#E8622A" });

    expect(serializeColor({ color: parsed!, format: "oklch" })).toBe("oklch(65.73% 0.17941 40.85)");
  });

  it("accepts oklch lightness as a fraction as well as a percentage", () => {
    expect(parseColor({ value: "oklch(0.6573 0.17941 40.85)" })).toEqual(
      parseColor({ value: "oklch(65.73% 0.17941 40.85)" }),
    );
  });

  it("preserves alpha through a round trip", () => {
    for (const format of FORMATS) {
      const value = serializeColor({ color: { ...EMBER, a: 0.5 }, format });

      expect(parseColor({ value })?.a, format).toBeCloseTo(0.5, 2);
    }
  });

  it("clamps an out-of-gamut oklch to sRGB rather than failing", () => {
    const parsed = parseColor({ value: "oklch(70% 0.4 30)" });

    expect(parsed).not.toBeNull();
    for (const channel of [parsed!.r, parsed!.g, parsed!.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });

  it("returns null for theme tokens, empty values, and unrecognised notation", () => {
    expect(parseColor({ value: "var(--primary)" })).toBeNull();
    expect(parseColor({ value: "" })).toBeNull();
    expect(parseColor({ value: "   " })).toBeNull();
    expect(parseColor({ value: "rebeccapurple" })).toBeNull();
    expect(parseColor({ value: "#fff" })).toBeNull();
    expect(parseColor({ value: "rgb(999, 0, 0)" })).toBeNull();
  });

  it("throws on an unsupported format", () => {
    expect(() =>
      serializeColor({ color: EMBER, format: "cmyk" as ColorFormat }),
    ).toThrow(/unsupported colour format/);
  });
});
