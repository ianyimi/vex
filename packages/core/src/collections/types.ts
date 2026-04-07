import { AdminField } from "../fields";

/**
 * Configuration input for a `defineCollection()` call.
 *
 * A collection maps to a Convex database table. `slug` becomes the table name,
 * `fields` defines its shape, and `labels` controls how the collection appears
 * in the admin panel. Omitted labels are inferred from the slug.
 *
 * **Defaults applied by `defineCollection()`:**
 * ```ts
 * {
 *   labels: {
 *     singular: "Post",   // title-cased from slug ("posts" → "Post")
 *     plural:   "Posts",  // title-cased + pluralised from slug
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: {
 *     title: text({ required: true }),
 *     body:  richtext(),
 *   },
 * })
 * ```
 *
 * @see {@link CollectionConfig} for the resolved type after defaults are applied
 * @see {@link defineCollection} for the config function
 */
export interface CollectionConfigInput<
  TSlug extends string = string,
  TFields extends string = string,
> {
  /** Convex table name — used as the database table identifier and URL slug in the admin panel. */
  slug: TSlug;
  /**
   * Display names shown in the admin panel navigation and list views.
   * Both are inferred from `slug` if omitted.
   */
  labels?: {
    /** Singular display name (e.g. `"Post"`). Inferred from slug if omitted. */
    singular?: string;
    /** Plural display name (e.g. `"Posts"`). Inferred from slug if omitted. */
    plural?: string;
  };
  /** Field definitions that make up this collection's document shape. */
  fields: Record<TFields, AdminField>;
}

/**
 * Resolved collection configuration after defaults are applied by `defineCollection()`.
 *
 * @see {@link CollectionConfigInput} for the user-facing input type
 * @see {@link defineCollection} for the config function
 */
export interface CollectionConfig<
  TSlug extends string = string,
  TFields extends string = string,
> {
  /** Convex table name for this collection. */
  slug: TSlug;
  /** Display names shown in the admin panel — always present after defaults are applied. */
  labels: {
    /** Singular display name (e.g. `"Post"`). */
    singular: string;
    /** Plural display name (e.g. `"Posts"`). */
    plural: string;
  };
  /** Resolved field definitions for this collection. */
  fields: Record<TFields, AdminField>;
}
