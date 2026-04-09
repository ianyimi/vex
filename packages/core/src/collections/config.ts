import { toTitleCase, plural } from "../utils";
import { CollectionConfigInput, CollectionConfig } from "./types";

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
 * // → { slug: "posts", labels: { singular: "Post", plural: "Posts" }, fields: { ... } }
 * ```
 *
 * @see {@link CollectionConfigInput} for the user-facing input type
 * @see {@link CollectionConfig} for the resolved return type
 */
export function defineCollection(
  config: CollectionConfigInput,
): CollectionConfig {
  return {
    ...config,
    admin: {
      useAsTitle: "_id",
      ...config.admin,
    },
    labels: {
      singular: config.labels?.singular ?? toTitleCase(config.slug),
      plural: config.labels?.plural ?? plural(toTitleCase(config.slug)),
    },
  };
}
