export interface StylePreset {
  /** Tailwind scale value (stored in blockStyles JSON). */
  value: string;
  /** Display label in the popover. */
  label: string;
  /** Size hint shown next to the label (e.g., "16px / 1rem"). */
  hint: string;
}

// ---------------------------------------------------------------------------
// Spacing presets (margin, padding, gap)
// ---------------------------------------------------------------------------

export const SPACING_PRESETS: StylePreset[] = [
  { value: "0", label: "0", hint: "0px" },
  { value: "0.5", label: "0.5", hint: "2px / 0.125rem" },
  { value: "1", label: "1", hint: "4px / 0.25rem" },
  { value: "1.5", label: "1.5", hint: "6px / 0.375rem" },
  { value: "2", label: "2", hint: "8px / 0.5rem" },
  { value: "3", label: "3", hint: "12px / 0.75rem" },
  { value: "4", label: "4", hint: "16px / 1rem" },
  { value: "5", label: "5", hint: "20px / 1.25rem" },
  { value: "6", label: "6", hint: "24px / 1.5rem" },
  { value: "8", label: "8", hint: "32px / 2rem" },
  { value: "10", label: "10", hint: "40px / 2.5rem" },
  { value: "12", label: "12", hint: "48px / 3rem" },
  { value: "16", label: "16", hint: "64px / 4rem" },
  { value: "20", label: "20", hint: "80px / 5rem" },
  { value: "24", label: "24", hint: "96px / 6rem" },
];

// ---------------------------------------------------------------------------
// Font size presets
// ---------------------------------------------------------------------------

export const FONT_SIZE_PRESETS: StylePreset[] = [
  { value: "xs", label: "XS", hint: "12px / 0.75rem" },
  { value: "sm", label: "SM", hint: "14px / 0.875rem" },
  { value: "base", label: "Base", hint: "16px / 1rem" },
  { value: "lg", label: "LG", hint: "18px / 1.125rem" },
  { value: "xl", label: "XL", hint: "20px / 1.25rem" },
  { value: "2xl", label: "2XL", hint: "24px / 1.5rem" },
  { value: "3xl", label: "3XL", hint: "30px / 1.875rem" },
  { value: "4xl", label: "4XL", hint: "36px / 2.25rem" },
  { value: "5xl", label: "5XL", hint: "48px / 3rem" },
];

// ---------------------------------------------------------------------------
// Font weight presets
// ---------------------------------------------------------------------------

export const FONT_WEIGHT_PRESETS: StylePreset[] = [
  { value: "thin", label: "Thin", hint: "100" },
  { value: "light", label: "Light", hint: "300" },
  { value: "normal", label: "Normal", hint: "400" },
  { value: "medium", label: "Medium", hint: "500" },
  { value: "semibold", label: "Semibold", hint: "600" },
  { value: "bold", label: "Bold", hint: "700" },
  { value: "extrabold", label: "Extra Bold", hint: "800" },
];

// ---------------------------------------------------------------------------
// Border radius presets
// ---------------------------------------------------------------------------

export const BORDER_RADIUS_PRESETS: StylePreset[] = [
  { value: "none", label: "None", hint: "0px" },
  { value: "sm", label: "SM", hint: "2px / 0.125rem" },
  { value: "DEFAULT", label: "Default", hint: "4px / 0.25rem" },
  { value: "md", label: "MD", hint: "6px / 0.375rem" },
  { value: "lg", label: "LG", hint: "8px / 0.5rem" },
  { value: "xl", label: "XL", hint: "12px / 0.75rem" },
  { value: "2xl", label: "2XL", hint: "16px / 1rem" },
  { value: "3xl", label: "3XL", hint: "24px / 1.5rem" },
  { value: "full", label: "Full", hint: "9999px" },
];

// ---------------------------------------------------------------------------
// Box shadow presets
// ---------------------------------------------------------------------------

export const BOX_SHADOW_PRESETS: StylePreset[] = [
  { value: "none", label: "None", hint: "no shadow" },
  { value: "sm", label: "SM", hint: "small" },
  { value: "DEFAULT", label: "Default", hint: "medium" },
  { value: "md", label: "MD", hint: "medium" },
  { value: "lg", label: "LG", hint: "large" },
  { value: "xl", label: "XL", hint: "extra large" },
  { value: "2xl", label: "2XL", hint: "xx-large" },
];

// ---------------------------------------------------------------------------
// Opacity presets
// ---------------------------------------------------------------------------

export const OPACITY_PRESETS: StylePreset[] = [
  { value: "0", label: "0%", hint: "invisible" },
  { value: "5", label: "5%", hint: "" },
  { value: "10", label: "10%", hint: "" },
  { value: "25", label: "25%", hint: "" },
  { value: "50", label: "50%", hint: "" },
  { value: "75", label: "75%", hint: "" },
  { value: "100", label: "100%", hint: "fully visible" },
];

// ---------------------------------------------------------------------------
// Width presets
// ---------------------------------------------------------------------------

export const WIDTH_PRESETS: StylePreset[] = [
  { value: "auto", label: "Auto", hint: "auto" },
  { value: "full", label: "Full", hint: "100%" },
  { value: "screen", label: "Screen", hint: "100vw" },
  { value: "1/2", label: "1/2", hint: "50%" },
  { value: "1/3", label: "1/3", hint: "33.33%" },
  { value: "2/3", label: "2/3", hint: "66.67%" },
  { value: "1/4", label: "1/4", hint: "25%" },
  { value: "3/4", label: "3/4", hint: "75%" },
  { value: "max", label: "Max Content", hint: "max-content" },
  { value: "fit", label: "Fit Content", hint: "fit-content" },
];

// ---------------------------------------------------------------------------
// Max-width presets
// ---------------------------------------------------------------------------

export const MAX_WIDTH_PRESETS: StylePreset[] = [
  { value: "none", label: "None", hint: "no limit" },
  { value: "xs", label: "XS", hint: "320px / 20rem" },
  { value: "sm", label: "SM", hint: "384px / 24rem" },
  { value: "md", label: "MD", hint: "448px / 28rem" },
  { value: "lg", label: "LG", hint: "512px / 32rem" },
  { value: "xl", label: "XL", hint: "576px / 36rem" },
  { value: "2xl", label: "2XL", hint: "672px / 42rem" },
  { value: "3xl", label: "3XL", hint: "768px / 48rem" },
  { value: "4xl", label: "4XL", hint: "896px / 56rem" },
  { value: "5xl", label: "5XL", hint: "1024px / 64rem" },
  { value: "6xl", label: "6XL", hint: "1152px / 72rem" },
  { value: "7xl", label: "7XL", hint: "1280px / 80rem" },
  { value: "full", label: "Full", hint: "100%" },
  { value: "screen", label: "Screen", hint: "100vw" },
];

// ---------------------------------------------------------------------------
// Line height presets
// ---------------------------------------------------------------------------

export const LINE_HEIGHT_PRESETS: StylePreset[] = [
  { value: "none", label: "None", hint: "1" },
  { value: "tight", label: "Tight", hint: "1.25" },
  { value: "snug", label: "Snug", hint: "1.375" },
  { value: "normal", label: "Normal", hint: "1.5" },
  { value: "relaxed", label: "Relaxed", hint: "1.625" },
  { value: "loose", label: "Loose", hint: "2" },
];

// ---------------------------------------------------------------------------
// Letter spacing presets
// ---------------------------------------------------------------------------

export const LETTER_SPACING_PRESETS: StylePreset[] = [
  { value: "tighter", label: "Tighter", hint: "-0.05em" },
  { value: "tight", label: "Tight", hint: "-0.025em" },
  { value: "normal", label: "Normal", hint: "0em" },
  { value: "wide", label: "Wide", hint: "0.025em" },
  { value: "wider", label: "Wider", hint: "0.05em" },
  { value: "widest", label: "Widest", hint: "0.1em" },
];

// ---------------------------------------------------------------------------
// Border width presets
// ---------------------------------------------------------------------------

export const BORDER_WIDTH_PRESETS: StylePreset[] = [
  { value: "0", label: "None", hint: "0px" },
  { value: "DEFAULT", label: "Default", hint: "1px" },
  { value: "2", label: "2", hint: "2px" },
  { value: "4", label: "4", hint: "4px" },
  { value: "8", label: "8", hint: "8px" },
];

// ---------------------------------------------------------------------------
// Aspect ratio presets
// ---------------------------------------------------------------------------

export const ASPECT_RATIO_PRESETS: StylePreset[] = [
  { value: "auto", label: "Auto", hint: "auto" },
  { value: "square", label: "Square", hint: "1 / 1" },
  { value: "video", label: "Video", hint: "16 / 9" },
  { value: "4/3", label: "4:3", hint: "4 / 3" },
  { value: "3/2", label: "3:2", hint: "3 / 2" },
];
