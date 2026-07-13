import { ComponentHKT } from "../fields";
import { CollectionSlug } from "../types";
import { toTitleCase, plural } from "../utils";
import { CollectionConfigInput, CollectionConfig } from "./types";
import { slugToPascalCase } from "./utils";

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
 * @see {@link CollectionConfigInput} for the user-facing input type
 * @see {@link CollectionConfig} for the resolved return type
 */
export function defineCollection<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  config: CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent
  >,
): CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent> {
  return {
    interfaceName: slugToPascalCase({ slug: config.slug }) + "Document",
    ...config,
    admin: {
      useAsTitle: "_id",
      components: {},
      ...config.admin,
      table: {
        defaultPageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        defaultColumns: [],
        ...config.admin?.table,
        bulkActions: {
          delete: true,
          ...config.admin?.table?.bulkActions,
        },
        defaultSort: {
          field: "_createdAt",
          order: "desc",
          ...config.admin?.table?.defaultSort,
        },
      },
    },
    labels: {
      singular: toTitleCase(config.slug),
      plural: plural(toTitleCase(config.slug)),
      ...config.labels,
    },
    meta: {
      ...config.meta,
    } as TCollectionMeta,
  };
}
