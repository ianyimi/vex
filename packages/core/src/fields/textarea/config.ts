import { VexResourceSlug } from "../../types";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldLimit } from "../utils";
import type { TextareaFieldInput, TextareaField } from "./types";

/**
 * Creates a textarea field with all defaults applied.
 *
 * Textarea fields store multi-line string values.
 * Common uses: bios, descriptions, internal notes.
 *
 * Accepts {@link TextareaFieldInput} (all optional) and returns {@link TextareaField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `rows` — `4`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Textarea field configuration. All properties are optional.
 * @returns Resolved textarea field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { textarea, defineCollection } from '@vexcms/core'
 *
 * authors: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Bio")
 *     bio: textarea(),
 *
 *     // Required, length-limited, taller textarea
 *     bio: textarea({ required: true, min: 10, max: 500, rows: 8 }),
 *   }
 * })
 * ```
 *
 * @see {@link TextareaFieldInput} for the full input type
 * @see {@link TextareaField} for the resolved output type
 */
export function textarea<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: TextareaFieldInput<TCollectionSlug, TFieldMeta>,
): TextareaField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.textarea.type,
    interfaceType: ADMIN_FIELDS.textarea.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.textarea.defaultValue,
    ...options,

    min: resolveFieldLimit({
      limit: options?.min,
      defaultError: (value) => `Must be at least ${value} characters.`,
    }),
    max: resolveFieldLimit({
      limit: options?.max,
      defaultError: (value) => `Must be no more than ${value} characters.`,
    }),
    rows: options?.rows ?? 4,

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
