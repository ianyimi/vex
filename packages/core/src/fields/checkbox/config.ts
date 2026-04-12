import { ADMIN_FIELDS } from "../constants";
import type { CheckboxFieldInput, CheckboxField } from "./types";

/**
 * Creates a checkbox field with all defaults applied.
 *
 * Checkbox fields store boolean values — feature flags, opt-in toggles,
 * published states, visibility flags, and similar on/off settings.
 *
 * Accepts {@link CheckboxFieldInput} (all optional) and returns {@link CheckboxField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Checkbox field configuration. All properties are optional.
 * @returns Resolved checkbox field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { checkbox, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Published")
 *     published: checkbox(),
 *
 *     // Required field, checked by default when creating a new document
 *     featured: checkbox({ defaultValue: true, admin: { width: "half" } }),
 *
 *     // Indexed flag for fast admin queries
 *     archived: checkbox({ index: "by_archived" }),
 *   }
 * })
 * ```
 *
 * @see {@link CheckboxFieldInput} for the full input type
 * @see {@link CheckboxField} for the resolved output type
 */
export function checkbox(options?: CheckboxFieldInput): CheckboxField {
  return {
    type: ADMIN_FIELDS.checkbox.type,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.checkbox.defaultValue,
    ...options,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      description: "",
      ...options?.admin,
    },

    // Optional field properties (no defaults)
    description: options?.description,
    index: options?.index,
  };
}
