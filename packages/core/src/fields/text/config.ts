import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import type { TextFieldInput, TextField } from "./types";

/**
 * Creates a text field with all defaults applied.
 *
 * Text fields store short, single-line string values.
 * Common uses: titles, names, slugs, URLs, email addresses.
 *
 * Accepts {@link TextFieldInput} (all optional) and returns {@link TextField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Text field configuration. All properties are optional.
 * @returns Resolved text field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { text, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Title")
 *     title: text(),
 *
 *     // Required slug with length validation and a database index
 *     slug: text({ required: true, minLength: 3, maxLength: 100, index: "by_slug" }),
 *
 *     // Author name with a placeholder hint in the admin form
 *     authorName: text({
 *       required: true,
 *       admin: { width: "half", placeholder: "e.g. Jane Smith" },
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link TextFieldInput} for the full input type
 * @see {@link TextField} for the resolved output type
 */
export function text<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>(
  options?: TextFieldInput<TFieldMeta>,
): TextField<TFieldMeta> {
  return {
    type: ADMIN_FIELDS.text.type,
    interfaceType: ADMIN_FIELDS.text.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.text.defaultValue,
    ...options,

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
