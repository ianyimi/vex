// =============================================================================
// STYLE TIER NAMES
// =============================================================================

/**
 * The style tier identifiers that a block can declare in admin.blockStyles.
 * Each tier corresponds to a section in the style popover and a set of CSS properties.
 */
export type StyleTier = "container" | "text" | "layout" | "media";

// =============================================================================
// STYLE CONFIG SHAPES (per tier)
// =============================================================================

/**
 * Container styles — universal layout/visual properties applied to the block's outer wrapper.
 * All values are Tailwind scale keys (e.g., "4" → 1rem/16px) or color strings.
 */
export interface ContainerStyleConfig {
  /** Tailwind margin scale value. Shorthand: applies to all sides. */
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  /** Tailwind padding scale value. */
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  /** Tailwind width class key (e.g., "full", "1/2", "screen"). */
  width?: string;
  /** Tailwind max-width class key. */
  maxWidth?: string;
  /** Background color — CSS color string or CSS variable reference. */
  backgroundColor?: string;
  /** Border width — Tailwind border width key (e.g., "", "2", "4"). */
  borderWidth?: string;
  /** Border color — CSS color string or CSS variable reference. */
  borderColor?: string;
  /** Border style. */
  borderStyle?: "solid" | "dashed" | "dotted" | "none";
  /** Tailwind border radius key (e.g., "sm", "md", "lg", "full"). */
  borderRadius?: string;
  /** Tailwind box shadow key (e.g., "sm", "md", "lg", "xl", "2xl", "none"). */
  boxShadow?: string;
  /** Tailwind opacity value (e.g., "0", "25", "50", "75", "100"). */
  opacity?: string;
  /** Display value. */
  display?: "block" | "flex" | "grid" | "none" | "inline-flex";
  /** Overflow value. */
  overflow?: "hidden" | "scroll" | "auto" | "visible";
}

/**
 * Text styles — typography properties for text-heavy blocks.
 */
export interface TextStyleConfig {
  /** Text alignment. */
  textAlign?: "left" | "center" | "right" | "justify";
  /** Tailwind font size key (e.g., "sm", "base", "lg", "xl", "2xl"). */
  fontSize?: string;
  /** Tailwind font weight key (e.g., "normal", "medium", "semibold", "bold"). */
  fontWeight?: string;
  /** Text color — CSS color string or CSS variable reference. */
  color?: string;
  /** Tailwind line height key (e.g., "tight", "snug", "normal", "relaxed"). */
  lineHeight?: string;
  /** Tailwind letter spacing key (e.g., "tighter", "tight", "normal", "wide"). */
  letterSpacing?: string;
}

/**
 * Layout styles — for blocks that contain child elements in flex/grid layouts.
 */
export interface LayoutStyleConfig {
  /** Tailwind gap scale value. */
  gap?: string;
  /** Flex direction. */
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  /** Align items. */
  alignItems?: "start" | "center" | "end" | "stretch" | "baseline";
  /** Justify content. */
  justifyContent?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /** Flex wrap. */
  flexWrap?: "wrap" | "nowrap" | "wrap-reverse";
}

/**
 * Media styles — for blocks with background images or media elements.
 */
export interface MediaStyleConfig {
  /** Object fit for background/media elements. */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** Aspect ratio (e.g., "video", "square", "auto", or custom like "4/3"). */
  aspectRatio?: string;
  /** Object position (e.g., "center", "top", "bottom"). */
  objectPosition?: string;
}

// =============================================================================
// COMBINED BLOCK STYLES (the shape stored as JSON in blockStyles field)
// =============================================================================

/**
 * Combined style config for a single breakpoint.
 * Which properties are present depends on the block's declared style tiers.
 */
export interface BlockStyleValues
  extends ContainerStyleConfig,
    TextStyleConfig,
    LayoutStyleConfig,
    MediaStyleConfig {}

/**
 * The full blockStyles structure stored as JSON string.
 * Keys are breakpoint names ("base" is always present, others come from config).
 *
 * @example
 * ```json
 * {
 *   "base": { "margin": "4", "padding": "2", "backgroundColor": "#fff" },
 *   "sm": { "margin": "6" },
 *   "lg": { "margin": "8", "padding": "4" }
 * }
 * ```
 */
export type BlockStylesData = Record<string, BlockStyleValues>;
