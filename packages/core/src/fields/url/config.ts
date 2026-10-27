import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldLimit, resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types/generated";
import type { UrlFieldInput, UrlField } from "./types";

/**
 * Creates a URL field with all defaults applied.
 *
 * URL fields store absolute URLs as strings and render them as clickable
 * links in the admin data table. Common uses: website links, canonical
 * URLs, external resource references, social profile URLs.
 *
 * Accepts {@link UrlFieldInput} (all optional) and returns {@link UrlField} with all defaults applied.
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
 * @param options - URL field configuration. All properties are optional.
 * @returns Resolved URL field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { url, defineCollection } from '@vexcms/core'
 *
 * pages: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Canonical Url")
 *     canonicalUrl: url(),
 *
 *     // Required website URL with a length cap and database index
 *     website: url({ required: true, max: 2048, index: "by_website" }),
 *
 *     // Social profile URL with a placeholder hint
 *     twitterUrl: url({
 *       required: false,
 *       admin: { width: "50%", placeholder: "https://twitter.com/username" },
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link UrlFieldInput} for the full input type
 * @see {@link UrlField} for the resolved output type
 */
export function url<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: UrlFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): UrlField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.url.type,
    interfaceType: ADMIN_FIELDS.url.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.url.defaultValue,
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
