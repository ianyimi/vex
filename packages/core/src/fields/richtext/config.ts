import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import type { VexResourceSlug } from "../../types/generated";
import type { RichTextFieldInput, RichTextField } from "./types";

/**
 * Creates a richtext field with all defaults applied.
 *
 * Richtext fields store a single locale-agnostic rich-text document — body
 * copy, article content, anything requiring headings, marks, and inline
 * media rather than a plain string. Editing requires a configured `editor`
 * adapter on `VexClientConfig` (e.g. `editor: plateEditor()`); the admin
 * `Input` renders a configuration error, not markup, when it is absent.
 *
 * Accepts {@link RichTextFieldInput} (all optional) and returns
 * {@link RichTextField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `[]`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Richtext field configuration. All properties are optional.
 * @returns Resolved richtext field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { richtext, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Body")
 *     body: richtext(),
 *
 *     // Required field, e.g. an article summary
 *     excerpt: richtext({ required: true }),
 *   }
 * })
 * ```
 *
 * @see {@link RichTextFieldInput} for the full input type
 * @see {@link RichTextField} for the resolved output type
 */
export function richtext<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: RichTextFieldInput<TCollectionSlug, TFieldMeta>,
): RichTextField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.richtext.type,
    interfaceType: ADMIN_FIELDS.richtext.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: [...ADMIN_FIELDS.richtext.defaultValue],
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
