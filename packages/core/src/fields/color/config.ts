import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { COLOR_FORMATS } from "./formats";
import type { ColorFieldInput, ColorField } from "./types";

/**
 * Creates a colour field with all defaults applied.
 *
 * Colour fields store a CSS colour string and render a swatch picker in the
 * admin form. Common uses: theme palettes, per-document accent colours, block
 * background overrides.
 *
 * Accepts {@link ColorFieldInput} (all optional) and returns {@link ColorField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `""`
 * - `format` — `"hex"`
 * - `themeColors` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Colour field configuration. All properties are optional.
 * @returns Resolved colour field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { color, defineCollection } from '@vexcms/core'
 *
 * themes: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Brand Color"), stored as hex
 *     brandColor: color(),
 *
 *     // Stored as oklch so the front end can interpolate it directly
 *     primaryLight: color({ format: "oklch", required: true }),
 *
 *     // Offer the host app's design tokens as a second picker tab
 *     overlayTint: color({ themeColors: true, admin: { width: "half" } }),
 *   }
 * })
 * ```
 *
 * @see {@link ColorFieldInput} for the full input type
 * @see {@link ColorField} for the resolved output type
 */
export function color<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>(
  options?: ColorFieldInput<TFieldMeta>,
): ColorField<TFieldMeta> {
  return {
    type: ADMIN_FIELDS.color.type,
    interfaceType: ADMIN_FIELDS.color.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.color.defaultValue,
    ...options,

    // Resolved after `...options` so both are always defined.
    format: options?.format ?? COLOR_FORMATS.hex.format,
    themeColors: options?.themeColors ?? false,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
