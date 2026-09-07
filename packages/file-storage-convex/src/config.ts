import {
  text,
  number,
  checkbox,
  defineCollection,
  type MediaCollectionSlug,
  type MediaCollectionConfigInput,
  type MediaCollectionConfig,
  type ComponentHKT,
  type AdminField,
  BaseFieldMeta,
} from "@vexcms/core";
import { type MediaCollectionMeta } from "@vexcms/core";
import { ConvexStorageAdapter } from "./adapter";

type MediaCollectionFieldName = string &
  Omit<string, "filename" | "mimeType" | "size" | "deleted" | "src" | "width" | "height">;

/**
 * Resolves a raw collection config input into a fully-populated `CollectionConfig`.
 *
 * Fills in any missing `labels` by deriving them from the `slug` — converting it
 * to title case for `singular` and further pluralising it for `plural`.
 *
 * @param config - The raw collection configuration supplied by the caller.
 * @returns The resolved `CollectionConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: {
 *     title: text({ required: true }),
 *   },
 * });
 * // → { slug: "posts", admin: { useAsTitle: "_id" }, labels: { singular: "Post", plural: "Posts" }, fields: { ... } }
 * ```
 *
 * @see {@link core/src!CollectionConfigInput} for the user-facing input type
 * @see {@link core/src!CollectionConfig} for the resolved return type
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

/**
 * Options for the convex-file-storage package
 */
export interface ConvexFileStorageOptions {
  /** Media collections to register. Required — no default collection is created. */
  mediaCollections: MediaCollectionConfig[];
  /** Admin panel config options for @vexcms/file-storage-convex */
  admin?: {
    /** When true, delete operations mark media as deleted instead of physically removing files. */
    softDelete?: boolean;
  };
  /** Convex site URL for generating file URLs. Auto-detected from env if omitted. */
  convexUrl?: string;
}

/**
 * Creates a Convex file storage adapter for VexCMS.
 *
 * Processes media collections (adds required fields, validates), configures
 * Convex file storage backend, and returns a `VexStorageAdapter`. Every
 * collection is tagged with `meta.storageAdapterName: "convex"`.
 *
 * @param options — Adapter configuration. `mediaCollections` is required.
 * @returns A `VexStorageAdapter` ready for `defineConfig({ storageAdapters: [ ... ] })`.
 *
 * @example
 * ```ts
 * import { convexFileStorage, defineMediaCollection } from "@vexcms/file-storage-convex";
 *
 * const images = defineMediaCollection({
 *   slug: "images",
 *   fields: { alt: text({ required: true }) },
 * });
 *
 * export default defineConfig({
 *   storageAdapters: [convexFileStorage({ mediaCollections: [images] })],
 *   collections: [posts],
 * });
 */
export function convexFileStorage(options: ConvexFileStorageOptions): ConvexStorageAdapter {
  return new ConvexStorageAdapter(options);
}
