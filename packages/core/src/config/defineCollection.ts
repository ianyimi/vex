import type {
  AuthTableFieldKeys,
  CollectionConfig,
  InferFieldsType,
  VexAuthAdapter,
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
 * // With auth field autocomplete:
 * const users = defineCollection('user', {
 *   auth,  // pass your auth adapter
 *   fields: { name: text(), role: select({ ... }) },
 *   admin: {
 *     defaultColumns: ['name', 'email'],  // 'email' autocompletes from auth
 *   },
 * });
 */
export function defineCollection<
  TSlug extends string,
  TFields extends Record<string, VexField<any, any>>,
  TAuth extends VexAuthAdapter<any> | undefined = undefined,
>(
  slug: TSlug,
  config: CollectionConfig<
    TFields,
    TAuth extends VexAuthAdapter<any> ? AuthTableFieldKeys<TAuth, TSlug> : never
  > & { auth?: TAuth },
): VexCollection<
  TFields,
  TAuth extends VexAuthAdapter<any> ? AuthTableFieldKeys<TAuth, TSlug> : never
> {
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
