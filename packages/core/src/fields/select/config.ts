import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types/generated";
import type { SelectFieldInput, SelectField } from "./types";
import { SELECT_DISPLAYS } from "./types";

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
 * - `admin.width` — `"100%"`
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
 *     tier: select({
 *       required: true,
 *       options: [
 *         { label: "Free", value: "free" },
 *         { label: "Pro", value: "pro" },
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
export function select<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: SelectFieldInput<TCollectionSlug, TFieldMeta>,
): SelectField<TCollectionSlug, TFieldMeta> {
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
      width: "100%",
      cellAlignment: "left",
      placeholder: "",
      searchable: false,
      display: SELECT_DISPLAYS.dropdown,
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
