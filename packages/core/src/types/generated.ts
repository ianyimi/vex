/**
 * Empty interface augmented by the generated `vex.types.ts` file.
 *
 * When `vex generate` has been run, this interface gains two properties:
 * - `CollectionSlug` — the specific union of collection slugs in the project
 * - `DocumentBySlug` — a map of slug → document interface
 *
 * When empty (before generation), all derived types fall back to their widest
 * safe variants (`string`, `Record<string, unknown>`).
 *
 * @description
 * Do not populate this interface manually. It is populated by the
 * `declare module '@vexcms/core'` block emitted at the bottom of
 * the generated `vex.types.ts` file.
 *
 * @example
 * ```ts
 * // After running `vex generate`, this interface is augmented to:
 * interface GeneratedVexTypes {
 *   CollectionSlug: "posts" | "authors"
 *   DocumentBySlug: { posts: PostsDocument; authors: AuthorsDocument }
 * }
 * ```
 */
export interface GeneratedVexTypes {}

/**
 * Union of all collection slugs registered in this project's VexCMS config.
 *
 * - **Before `vex generate`:** resolves to `string` — any string is accepted.
 * - **After `vex generate`:** resolves to a specific union, e.g. `"posts" | "authors"`.
 *
 * Used by `RelationshipFieldInput.collection` so that invalid slugs are caught
 * at compile time without the user passing explicit generic parameters.
 *
 * @example
 * ```ts
 * // After generation — type is "posts" | "authors" | "tags"
 * import type { CollectionSlug } from "@vexcms/core"
 *
 * relationship({ collection: "nonexistent" }) // ✗ Type error after generation
 * relationship({ collection: "posts" })       // ✓
 * ```
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 * @see {@link RelationshipFieldInput} for the primary consumer of this type
 */
export type CollectionSlug = GeneratedVexTypes extends {
  CollectionSlug: infer S extends string;
}
  ? S
  : string;

/**
 * Maps each collection slug to its generated document interface.
 *
 * - **Before `vex generate`:** resolves to `Record<string, unknown>`.
 * - **After `vex generate`:** resolves to a typed map, e.g.
 *   `{ posts: PostsDocument; authors: AuthorsDocument }`.
 *
 * Used by `useCollectionForm` to type the `document` prop per collection.
 *
 * @example
 * ```ts
 * // After generation:
 * import type { DocumentBySlug } from "@vexcms/core"
 * type Post = DocumentBySlug["posts"]     // → PostsDocument
 * type Author = DocumentBySlug["authors"] // → AuthorsDocument
 * ```
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 */
export type DocumentBySlug = GeneratedVexTypes extends {
  DocumentBySlug: infer D extends Record<string, unknown>;
}
  ? D
  : Record<string, unknown>;
