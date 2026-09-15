import {
  text,
  number,
  checkbox,
  defineCollection,
  type MediaCollectionSlug,
  type MediaCollectionConfigInput,
  type MediaCollectionConfig,
  type MediaCollectionMeta,
  type ComponentHKT,
  type AdminField,
  BaseFieldMeta,
} from "@vexcms/core";

type MediaCollectionFieldName = string &
  Omit<string, "filename" | "mimeType" | "size" | "deleted" | "src" | "width" | "height">;

/**
 * Resolves a raw media collection config input into a fully-populated
 * `MediaCollectionConfig` tagged `meta.storageAdapter: "convex"`.
 *
 * Injects the Convex-specific base fields (`filename`, `alt`, `mimeType`,
 * `size`, `storageId`, `deleted`, `src`, `width`, `height`) beneath the
 * caller's own fields and defaults `admin.useAsTitle` to `filename`. Pure
 * and client-safe — never touches the Convex SDK — so the result is declared
 * on the client config's `mediaCollections`.
 *
 * @param config - The raw media collection configuration supplied by the caller.
 * @returns The resolved `MediaCollectionConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
 *
 * const images = defineMediaCollection({
 *   slug: "images",
 *   fields: { alt: text({ required: true }) },
 * });
 *
 * export default defineConfig({
 *   mediaCollections: [images],
 *   collections: [posts],
 * });
 * ```
 *
 * @see {@link core/src!MediaCollectionConfigInput} for the user-facing input type
 * @see {@link core/src!MediaCollectionConfig} for the resolved return type
 */
export function defineMediaCollection<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionMeta extends MediaCollectionMeta = MediaCollectionMeta,
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  config: MediaCollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent
  > & {
    fields?: Record<MediaCollectionFieldName, AdminField<TFieldMeta>>;
  },
): MediaCollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent> {
  const userFields = config.fields ?? {};

  // Typed as the INPUT `fields` shape, not `MediaCollectionConfig["fields"]`:
  // the resolved type also carries the reserved `updatedAt` slot
  // `defineCollection` injects, and this map is what gets handed IN.
  const fields: Record<string, AdminField<TFieldMeta>> = {
    // Required base fields — user fields spread after so label/description overrides work
    filename: text({
      required: true,
      searchIndex: { name: "search_filename", filterFields: ["alt"] },
    }),
    alt: text({ required: true }),
    mimeType: text({ required: true }),
    size: number({ required: true }),
    storageId: text({ required: true }),
    deleted: checkbox({ defaultValue: false, index: "by_deleted" }),
    // Convex-specific fields
    src: text({ required: true }),
    width: number(),
    height: number(),
    // User-provided fields last so they override label/description on the base fields above
    ...userFields,
  };

  // `TFieldSlug` is deliberately NOT forwarded here. `defineCollection`'s
  // parameter is a conditional type on it (the reserved-key guard), and a
  // conditional over an unresolved generic cannot be checked at this call
  // site. `string` is the truthful argument anyway: `fields` above is a
  // widened `Record<string, ...>`, exactly like the auth adapter's call. The
  // outer signature keeps `TFieldSlug` because that describes the caller's own
  // user fields, which is what the returned config must stay typed by.
  const resolved = defineCollection<TFieldMeta, TCollectionMeta, TCollectionSlug, string, TComponent>({
    ...config,
    fields,
    meta: {
      ...config.meta,
      storageAdapter: "convex",
    } as TCollectionMeta,
    admin: {
      useAsTitle: "filename",
      ...config.admin,
    },
  });

  // Through `unknown`: `defineCollection` stamps `collectionSlug` into
  // `TFieldMeta` and resolves `TFieldSlug` to `string`, so the two generic
  // instantiations do not overlap structurally even though the runtime value
  // is exactly what the declared return type describes.
  return resolved as unknown as MediaCollectionConfig<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent
  >;
}
