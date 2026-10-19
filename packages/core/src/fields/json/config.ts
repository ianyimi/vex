import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import type { VexResourceSlug } from "../../types";
import type { JsonFieldInput, JsonField } from "./types";

/**
 * Creates a json field with all defaults applied.
 *
 * Json fields store arbitrary JSON-serializable values with no fixed shape —
 * settings blobs, feature flags, raw API payloads. Shape checks are not part
 * of this field type; use the field's own server `validate()` for that.
 *
 * Accepts {@link JsonFieldInput} (all optional) and returns {@link JsonField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `undefined`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Json field configuration. All properties are optional.
 * @returns Resolved json field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { json, defineCollection } from '@vexcms/core'
 *
 * siteSettings: defineCollection({
 *   fields: {
 *     metadata: json({ label: "Raw Metadata" }),
 *   }
 * })
 * ```
 *
 * @see {@link JsonFieldInput} for the full input type
 * @see {@link JsonField} for the resolved output type
 */
export function json<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: JsonFieldInput<TCollectionSlug, TFieldMeta>): JsonField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.json.type,
    interfaceType: ADMIN_FIELDS.json.interfaceType,

    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.json.defaultValue,
    ...options,

    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
