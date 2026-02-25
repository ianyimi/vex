import type {
  CollectionConfig,
  InferFieldsType,
  VexCollection,
  VexField,
} from "../types";

/**
 * Define a collection with typed fields.
 *
 * @param slug - The collection identifier (used in URLs and database)
 * @param config - Collection configuration including fields and admin options
 * @returns A VexCollection with inferred document type
 *
 * @example
 * const posts = defineCollection('posts', {
 *   labels: { singular: 'Post', plural: 'Posts' },
 *   fields: {
 *     title: text({ label: 'Title', required: true }),
 *     status: select({ options: [...] }),
 *   },
 * });
 *
 * // Type inference works:
 * type Post = typeof posts._docType;
 * // Post = { title: string; status: "draft" | "published" }
 */
export function defineCollection<
  TFields extends Record<string, VexField<any, any>>,
>(slug: string, config: CollectionConfig<TFields>): VexCollection<TFields> {
  if (process.env.NODE_ENV !== "production") {
    if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      console.warn(
        `[vex] Collection slug "${slug}" should be lowercase alphanumeric with underscores, starting with a letter`,
      );
    }

    if (slug.startsWith("vex_")) {
      console.warn(
        `[vex] Collection slug "${slug}" uses reserved prefix "vex_"`,
      );
    }

    if (Object.keys(config.fields).length === 0) {
      console.warn(`[vex] Collection "${slug}" has no fields defined`);
    }
  }

  return {
    slug,
    config,
    _docType: {} as InferFieldsType<TFields>,
  };
}
