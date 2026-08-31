import { COLOR_FORMATS, type ColorFormat } from "./formats";

/**
 * A colour in 8-bit sRGB with straight (non-premultiplied) alpha.
 *
 * This is the pivot representation for every notation: parsing produces one,
 * serialising consumes one. sRGB rather than HSV because HSV is a *picker's*
 * working model — `@uiw/react-color-sketch` happens to use it — while sRGB is
 * what every CSS notation converts to and from.
 *
 * @example
 * ```ts
 * const ember: ColorValue = { r: 232, g: 98, b: 42, a: 1 };
 * ```
 */
export interface ColorValue {
  /** Red channel, `0`–`255`. */
  r: number;
  /** Green channel, `0`–`255`. */
  g: number;
  /** Blue channel, `0`–`255`. */
  b: number;
  /** Alpha, `0`–`1`. `1` is fully opaque. */
  a: number;
}

/** A colour in the OKLCh polar form: lightness 0–1, chroma, hue in degrees. */
interface OklchColor {
  l: number;
  c: number;
  h: number;
}

/** A colour in the HSL cylindrical form: hue in degrees, saturation and lightness 0–100. */
interface HslColor {
  h: number;
  s: number;
  l: number;
}

/**
 * Decimal places used when serialising each notation.
 *
 * Chosen by measurement, not taste. `convert.test.ts` sweeps a 4096-colour
 * lattice through serialise → parse and requires an exact 8-bit match; these are
 * the coarsest values that reach zero drift. The measured cliff for OKLCh:
 *
 * | precision | colours that drift |
 * | --- | --- |
 * | L1 C3 H1 (shadcn's hand-authored style) | 869 |
 * | L1 C4 H1 | 251 |
 * | L2 C4 H2 | 5 |
 * | **L2 C5 H2** | **0** |
 *
 * Trailing zeros are dropped when serialising, so a grey still reads
 * `oklch(14.51% 0 0)` rather than `oklch(14.51% 0.00000 0.0)` — the extra
 * digits appear only on colours that need them.
 *
 * For comparison, `@uiw/color-convert`'s `hsvaToHslString` rounds saturation
 * and lightness to whole percents, which turns `#E8622A` into `#E9632B` in one
 * round trip.
 */
const PRECISION = {
  hslHue: 1,
  hslPercent: 1,
  oklchLightness: 2,
  oklchChroma: 5,
  oklchHue: 2,
  alpha: 3,
} as const;

/** `#RRGGBB` or `#RRGGBBAA`, captured in two-digit groups. */
const HEX_STRING = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})?$/;

/** `rgb(232, 98, 42)` / `rgba(232, 98, 42, 0.5)`. */
const RGB_STRING =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)$/;

/** `hsl(17.7, 80.5%, 53.7%)` / `hsla(17.7, 80.5%, 53.7%, 0.5)`. */
const HSL_STRING =
  /^hsla?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)$/;

/** `oklch(65.7% 0.1793 40.9)` / `oklch(0.657 0.1793 40.9 / 0.5)`. */
const OKLCH_STRING =
  /^oklch\(\s*(\d+(?:\.\d+)?)(%?)\s+(\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*(?:\/\s*(\d*(?:\.\d+)?)\s*)?\)$/;

/**
 * Clamps a value into a closed range.
 *
 * @param props - Input props.
 * @param props.value - The value to clamp.
 * @param props.min - Lower bound, inclusive.
 * @param props.max - Upper bound, inclusive.
 * @returns The value, bounded.
 */
function clamp(props: { value: number; min: number; max: number }): number {
  return Math.min(props.max, Math.max(props.min, props.value));
}

/**
 * Rounds to a fixed number of decimals, dropping trailing zeros.
 *
 * Used for alpha so `0.5` serialises as `0.5` rather than `0.500`.
 *
 * @param props - Input props.
 * @param props.value - The value to round.
 * @param props.decimals - Maximum decimal places to keep.
 * @returns The rounded value.
 */
function round(props: { value: number; decimals: number }): number {
  return Number(props.value.toFixed(props.decimals));
}

/**
 * Converts a gamma-encoded sRGB channel to its linear-light value.
 *
 * @param props - Input props.
 * @param props.channel - Channel in the 0–1 range.
 * @returns The linear-light channel value.
 */
function srgbToLinear(props: { channel: number }): number {
  const c = props.channel;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converts a linear-light channel back to gamma-encoded sRGB.
 *
 * @param props - Input props.
 * @param props.channel - Linear-light channel in the 0–1 range.
 * @returns The gamma-encoded channel value.
 */
function linearToSrgb(props: { channel: number }): number {
  const c = props.channel;
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * Converts sRGB to OKLCh.
 *
 * Uses Björn Ottosson's sRGB→OKLab matrices — the same transform browsers
 * implement for the `oklch()` notation, verified against Chromium's own output
 * to the byte. Hand-rolled rather than pulled from a colour library: it is
 * twenty lines of closed-form arithmetic, and the alternative (`culori`) would
 * become a runtime dependency of `@vexcms/core`.
 *
 * @param props - Input props.
 * @param props.color - The sRGB colour. Alpha is ignored.
 * @returns The equivalent OKLCh colour. Hue is `0` for achromatic input.
 */
function rgbToOklch(props: { color: ColorValue }): OklchColor {
  const lr = srgbToLinear({ channel: props.color.r / 255 });
  const lg = srgbToLinear({ channel: props.color.g / 255 });
  const lb = srgbToLinear({ channel: props.color.b / 255 });

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(a * a + b * b);
  // Below this chroma the hue angle is numerical noise — pin it to 0 so grey
  // serialises as `oklch(14.5% 0 0)` rather than an arbitrary angle.
  const hue = chroma < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;

  return { l: lightness, c: chroma, h: hue };
}

/**
 * Converts OKLCh to sRGB, clamping to the sRGB gamut.
 *
 * OKLCh describes colours sRGB cannot show; those clamp per channel rather than
 * failing, which matches what a browser paints for an out-of-gamut `oklch()`.
 *
 * @param props - Input props.
 * @param props.oklch - The OKLCh colour.
 * @param props.alpha - Alpha to carry onto the result, `0`–`1`.
 * @returns The equivalent sRGB colour.
 */
function oklchToRgb(props: { oklch: OklchColor; alpha: number }): ColorValue {
  const radians = (props.oklch.h * Math.PI) / 180;
  const a = props.oklch.c * Math.cos(radians);
  const b = props.oklch.c * Math.sin(radians);

  const lCube = (props.oklch.l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCube = (props.oklch.l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCube = (props.oklch.l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const toChannel = (linear: number) =>
    clamp({ value: Math.round(linearToSrgb({ channel: linear }) * 255), min: 0, max: 255 });

  return {
    r: toChannel(4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube),
    g: toChannel(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube),
    b: toChannel(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube),
    a: props.alpha,
  };
}

/**
 * Converts sRGB to HSL.
 *
 * @param props - Input props.
 * @param props.color - The sRGB colour. Alpha is ignored.
 * @returns Hue in degrees, saturation and lightness as percentages.
 */
function rgbToHsl(props: { color: ColorValue }): HslColor {
  const r = props.color.r / 255;
  const g = props.color.g / 255;
  const b = props.color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: lightness * 100 };

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  return { h: ((hue * 60) % 360 + 360) % 360, s: saturation * 100, l: lightness * 100 };
}

/**
 * Converts HSL to sRGB.
 *
 * @param props - Input props.
 * @param props.hsl - Hue in degrees, saturation and lightness as percentages.
 * @param props.alpha - Alpha to carry onto the result, `0`–`1`.
 * @returns The equivalent sRGB colour.
 */
function hslToRgb(props: { hsl: HslColor; alpha: number }): ColorValue {
  const h = ((props.hsl.h % 360) + 360) % 360 / 360;
  const s = clamp({ value: props.hsl.s / 100, min: 0, max: 1 });
  const l = clamp({ value: props.hsl.l / 100, min: 0, max: 1 });

  if (s === 0) {
    const grey = Math.round(l * 255);
    return { r: grey, g: grey, b: grey, a: props.alpha };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toChannel = (offset: number) => {
    let t = h + offset;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return {
    r: Math.round(toChannel(1 / 3) * 255),
    g: Math.round(toChannel(0) * 255),
    b: Math.round(toChannel(-1 / 3) * 255),
    a: props.alpha,
  };
}

/**
 * Serialises a colour into one of the supported CSS notations.
 *
 * Alpha is emitted only when the colour is not fully opaque, so an opaque
 * colour produces `#e8622a` rather than `#e8622aff` and `rgb(...)` rather than
 * `rgba(..., 1)`.
 *
 * @param props - Input props.
 * @param props.color - The colour to write.
 * @param props.format - The notation to write it in.
 * @returns A CSS colour string in `format`.
 * @throws An Error if an unrecognised format is given. Reaching this is a
 * compile error: the default arm binds the exhausted union to `never`.
 *
 * @example
 * ```ts
 * const ember = { r: 232, g: 98, b: 42, a: 1 };
 * serializeColor({ color: ember, format: "hex" })   // "#e8622a"
 * serializeColor({ color: ember, format: "oklch" }) // "oklch(65.7% 0.1793 40.9)"
 * ```
 */
export function serializeColor(props: { color: ColorValue; format: ColorFormat }): string {
  const { color } = props;
  const isOpaque = color.a >= 1;
  const alpha = round({ value: color.a, decimals: PRECISION.alpha });

  switch (props.format) {
    case COLOR_FORMATS.hex.format: {
      const pair = (channel: number) =>
        clamp({ value: Math.round(channel), min: 0, max: 255 })
          .toString(16)
          .padStart(2, "0");
      const rgb = `#${pair(color.r)}${pair(color.g)}${pair(color.b)}`;
      return isOpaque ? rgb : `${rgb}${pair(color.a * 255)}`;
    }
    case COLOR_FORMATS.rgb.format: {
      const channels = `${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}`;
      return isOpaque ? `rgb(${channels})` : `rgba(${channels}, ${alpha})`;
    }
    case COLOR_FORMATS.hsl.format: {
      const hsl = rgbToHsl({ color });
      const h = round({ value: hsl.h, decimals: PRECISION.hslHue });
      const s = round({ value: hsl.s, decimals: PRECISION.hslPercent });
      const l = round({ value: hsl.l, decimals: PRECISION.hslPercent });
      return isOpaque ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    }
    case COLOR_FORMATS.oklch.format: {
      const oklch = rgbToOklch({ color });
      const l = round({ value: oklch.l * 100, decimals: PRECISION.oklchLightness });
      const c = round({ value: oklch.c, decimals: PRECISION.oklchChroma });
      const h = round({ value: oklch.h, decimals: PRECISION.oklchHue });
      return `oklch(${l}% ${c} ${h}${isOpaque ? "" : ` / ${alpha}`})`;
    }
    default: {
      const unhandled: never = props.format;
      throw new Error(`unsupported colour format: ${JSON.stringify(unhandled)}`);
    }
  }
}

/**
 * Parses a stored colour value into a {@link ColorValue}.
 *
 * Accepts every notation {@link serializeColor} can emit, regardless of the
 * field's current `format` — so a field whose format changed still reads its
 * stored colour instead of resetting. Values with no literal colour
 * (`var(--token)`, the empty string) return `null`.
 *
 * @param props - Input props.
 * @param props.value - The stored field value.
 * @returns The parsed colour, or `null` when the value is empty, a theme-token
 * reference, or not a recognised notation.
 *
 * @example
 * ```ts
 * parseColor({ value: "oklch(65.7% 0.1793 40.9)" }) // { r: 232, g: 98, b: 42, a: 1 }
 * parseColor({ value: "var(--primary)" })           // null
 * ```
 */
export function parseColor(props: { value: string }): ColorValue | null {
  const value = props.value.trim();
  if (!value) return null;

  const hex = HEX_STRING.exec(value);
  if (hex) {
    return {
      r: parseInt(hex[1], 16),
      g: parseInt(hex[2], 16),
      b: parseInt(hex[3], 16),
      a: hex[4] === undefined ? 1 : parseInt(hex[4], 16) / 255,
    };
  }

  const rgb = RGB_STRING.exec(value);
  if (rgb) {
    const channels = [rgb[1], rgb[2], rgb[3]].map(Number);
    if (channels.some((channel) => channel > 255)) return null;
    return {
      r: channels[0],
      g: channels[1],
      b: channels[2],
      a: rgb[4] === undefined ? 1 : clamp({ value: Number(rgb[4]), min: 0, max: 1 }),
    };
  }

  const hsl = HSL_STRING.exec(value);
  if (hsl) {
    return hslToRgb({
      hsl: { h: Number(hsl[1]), s: Number(hsl[2]), l: Number(hsl[3]) },
      alpha: hsl[4] === undefined ? 1 : clamp({ value: Number(hsl[4]), min: 0, max: 1 }),
    });
  }

  const oklch = OKLCH_STRING.exec(value);
  if (oklch) {
    const lightness = Number(oklch[1]);
    return oklchToRgb({
      oklch: {
        l: oklch[2] ? lightness / 100 : lightness,
        c: Number(oklch[3]),
        h: Number(oklch[4]),
      },
      alpha: oklch[5] === undefined ? 1 : clamp({ value: Number(oklch[5]), min: 0, max: 1 }),
    });
  }

  return null;
}
