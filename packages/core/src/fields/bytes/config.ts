import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types";
import { BYTES_FIELD_DEFAULT_MAX_SIZE, type BytesFieldInput, type BytesField } from "./types";

/**
 * Creates a bytes field that stores a raw binary payload (`v.bytes()`).
 *
 * Accepts {@link BytesFieldInput} (all optional) and returns {@link BytesField}
 * with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `maxSize` — `524_288` (512 KiB)
 * - `accept` — `""`
 * - `defaultValue` — `undefined`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Bytes field configuration. All properties are optional.
 * @returns Resolved bytes field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { bytes, defineCollection } from '@vexcms/core'
 *
 * storageShapes: defineCollection({
 *   fields: {
 *     payload: bytes({ label: "Payload", maxSize: 65_536 }),
 *   }
 * })
 * ```
 *
 * @see {@link BytesFieldInput} for the full input type
 * @see {@link BytesField} for the resolved output type
 */
export function bytes<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: BytesFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>): BytesField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.bytes.type,
    interfaceType: ADMIN_FIELDS.bytes.interfaceType,

    label: "",
    required: false,
    nullable: false,
    maxSize: BYTES_FIELD_DEFAULT_MAX_SIZE,
    accept: "",
    defaultValue: ADMIN_FIELDS.bytes.defaultValue,
    ...options,

    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
