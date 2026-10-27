import { VexResourceSlug } from "../../types";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldLimit, resolveFieldComponents } from "../utils";
import type { EmailFieldInput, EmailField } from "./types";

/**
 * Creates an email field with all defaults applied.
 *
 * Email fields store single-line email address strings, format-checked in
 * the admin form and on every server write. Common uses: contact emails,
 * author emails, newsletter sign-ups.
 *
 * Accepts {@link EmailFieldInput} (all optional) and returns {@link EmailField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 * - `admin.mask` — not set (opt-in; no project-wide default applies unless configured)
 *
 * @param options - Email field configuration. All properties are optional.
 * @returns Resolved email field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { email, defineCollection } from '@vexcms/core'
 *
 * authors: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Contact Email")
 *     contactEmail: email(),
 *
 *     // Required with a length cap and a database index
 *     workEmail: email({ required: true, max: 254, index: "by_work_email" }),
 *   }
 * })
 * ```
 *
 * @see {@link EmailFieldInput} for the full input type
 * @see {@link EmailField} for the resolved output type
 */
export function email<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: EmailFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>): EmailField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.email.type,
    interfaceType: ADMIN_FIELDS.email.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.email.defaultValue,
    ...options,

    min: resolveFieldLimit({
      limit: options?.min,
      defaultError: (value) => `Must be at least ${value} characters.`,
    }),
    max: resolveFieldLimit({
      limit: options?.max,
      defaultError: (value) => `Must be no more than ${value} characters.`,
    }),

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
