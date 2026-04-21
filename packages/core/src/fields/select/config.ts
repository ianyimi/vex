import { ADMIN_FIELDS } from "../constants";
import type { SelectFieldInput, SelectField } from "./types";

/**
 * Creates a select field with all defaults applied.
 *
 * Select fields store an array of chosen option values — suitable for status
 * labels, categories, tags, or any enumerable choice set. Set `hasMany: false`
 * to restrict to a single selection.
 *
 * Accepts {@link SelectFieldInput} (all optional) and returns {@link SelectField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `[]`
 * - `options` — `[]`
 * - `hasMany` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Select field configuration. All properties are optional.
 * @returns Resolved select field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { select, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Single-select status field
 *     status: select({
 *       required: true,
 *       options: [
 *         { label: "Draft", value: "draft" },
 *         { label: "Published", value: "published" },
 *       ],
 *     }),
 *
 *     // Multi-select tag field
 *     tags: select({
 *       hasMany: true,
 *       options: [
 *         { label: "News", value: "news" },
 *         { label: "Tutorial", value: "tutorial" },
 *         { label: "Release", value: "release" },
 *       ],
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link SelectFieldInput} for the full input type
 * @see {@link SelectField} for the resolved output type
 */
export function select(options?: SelectFieldInput): SelectField {
  return {
    type: ADMIN_FIELDS.select.type,
    interfaceType: ADMIN_FIELDS.select.interfaceType,
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.select.defaultValue,
    options: [],
    hasMany: false,
    ...options,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      description: "",
      ...options?.admin,
    },
  };
}
