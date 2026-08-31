import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";
import type { ColorFormat } from "./formats";

/**
 * Configuration input for a `color()` field.
 *
 * Colour fields store a CSS colour string. `format` decides which notation the
 * picker writes — `"hex"` (default), `"rgb"`, `"hsl"` or `"oklch"`. With
 * `themeColors` the field may instead store a CSS custom-property reference,
 * `var(--primary)`, which resolves per colour scheme at render time.
 *
 * **Defaults applied by `color()`:**
 * ```ts
 * {
 *   type:        "color",
 *   label:       "",       // inferred from the field key by defineCollection
 *   required:    false,    // field is optional by default
 *   format:      "hex",    // picker writes #RRGGBB / #RRGGBBAA
 *   themeColors: false,    // picker shows the custom swatch only
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // swatch aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Brand Color"), stored as hex
 * brandColor: color()
 *
 * // Stored as oklch, ready to interpolate straight into a CSS custom property
 * primaryLight: color({ format: "oklch", required: true, defaultValue: "oklch(65.7% 0.179 40.9)" })
 *
 * // Half-width, and offer the host app's design tokens as a second tab
 * overlayTint: color({ themeColors: true, admin: { width: "half" } })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface ColorFieldInput<TFieldMeta extends {} = {}>
  extends BaseFieldInput<TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect existing database values.
   */
  defaultValue?: string;
  /**
   * The CSS notation the picker writes.
   *
   * Validation is deliberately wider than this: every supported notation is
   * accepted on save, so changing `format` never invalidates existing
   * documents. `format` governs new writes, not stored history.
   *
   * Pick the notation the front end consumes. A theme collection feeding CSS
   * custom properties should use `"oklch"` so values interpolate directly with
   * no conversion step.
   *
   * @defaultValue `"hex"`
   */
  format?: ColorFormat;
  /**
   * When `true`, the picker gains a **Theme** tab listing the CSS custom
   * properties declared by the host application's stylesheet, and selecting one
   * stores a `var(--token)` reference instead of a literal colour.
   *
   * The admin panel renders inside the host app, so those tokens are the site's
   * own tokens. Leave this `false` on the fields that *define* the tokens: a
   * field whose value is written back out as `--primary: var(--primary)` is a
   * custom-property cycle, which CSS discards at computed-value time.
   *
   * @defaultValue `false`
   */
  themeColors?: boolean;
}

/**
 * Resolved configuration for a `color()` field, after all defaults are applied.
 *
 * This is the type framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<ColorField>` and
 * `CellComponentProps<ColorField>` is this type.
 *
 * @see {@link ColorFieldInput} for the user-facing input type
 * @see {@link color} for the config function that produces this type
 */
export interface ColorField<TFieldMeta extends {} = {}>
  extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.color.type;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Defaults to `""` — an empty picker.
   */
  defaultValue?: string;
  /** The CSS notation the picker writes. */
  format: ColorFormat;
  /** Whether the picker offers the host app's design tokens as a second tab. */
  themeColors: boolean;
}
