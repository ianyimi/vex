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
 *   CollectionSlug: "posts" | "authors";
 *   DocumentBySlug: { posts: PostsDocument; authors: AuthorsDocument };
 *   CollectionsFieldTypeMap: {
 *     posts: {
 *       text: "title" | "slug" | "body";
 *       relationship: "author" | "category";
 *       select: "status";
 *       date: "publishedAt";
 *     };
 *     authors: {
 *       text: "name" | "email";
 *     };
 *   };
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

/**
 * Union of all media collection slugs registered by storage adapters.
 *
 * - **Before `vex generate`:** resolves to `string` — any string is accepted.
 * - **After `vex generate`:** resolves to a specific union, e.g. `"images" | "videos"`.
 *
 * Used by `upload({ to: ... })` so that invalid media collection slugs are
 * caught at compile time after generation.
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 */
export type MediaCollectionSlug = GeneratedVexTypes extends {
  MediaCollectionSlug: infer S extends string;
}
  ? S
  : string;

/**
 * Union of all storage adapter names registered in this project's VexCMS config.
 *
 * - **Before `vex generate`:** resolves to `string` — any string is accepted.
 * - **After `vex generate`:** resolves to a specific union, e.g. `"convex"`.
 *
 * Only adapters whose `type` is `"presigned-url"` (i.e. those implementing
 * `StorageAdapterPresignedUrlInterface`) are included. Adapters using other
 * protocols (e.g. `"direct-upload"`, `"streaming"`) are excluded because
 * they require different client-side upload logic.
 *
 * Used by `VexConfig.storage.clientUploads` and `StorageAdapterMap` so that
 * only adapters actually registered in `defineConfig({ storage: { adapters: [...] } })`
 * can be referenced. Invalid adapter names are caught at compile time after
 * generation.
 *
 * @example
 * ```ts
 * // After generation — type is "convex"
 * import type { StorageAdapterSlug } from "@vexcms/core"
 *
 * const registry: StorageAdapterMap = {
 *   convex: { uploadFile: convexUploadFile },  // ✓
 *   s3: { uploadFile: s3UploadFile },          // ✗ Type error — "s3" not registered
 *   fake: { uploadFile: fakeUploadFile },     // ✗ Type error — not a registered adapter
 * };
 * ```
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 * @see {@link StorageAdapterPresignedUrlInterface} for the protocol requirement
 * @see {@link VexConfig} for the `storage.clientUploads` consumer
 */
export type StorageAdapterSlug = GeneratedVexTypes extends {
  StorageAdapterSlug: infer S extends string;
}
  ? S
  : string;

/**
 * Per-collection field-type map. Augmented by `vex generate` from the user's
 * collection configs. Powers all per-field-type helper types (`RelationshipKeysOf`,
 * `TextKeysOf`, `SortableKeysOf`, etc.).
 *
 * Keyed: collection slug → field type → union of field keys with that type.
 *
 * Empty by default; the user's `vex.types.ts` augments it via `declare module
 * "@vexcms/core"`. Helper types in `packages/core/src/api/types.ts` resolve to
 * `never` until augmentation runs, which is the intended behaviour for fresh
 * projects (no collections registered yet).
 *
 * @example Generated content (after `vex generate` runs):
 * ```ts
 * declare module "@vexcms/core" {
 *   interface GeneratedVexTypes {
 *     CollectionSlug: "posts" | "authors";
 *     DocumentBySlug: { posts: PostsDocument; authors: AuthorsDocument };
 *     CollectionsFieldTypeMap: {
 *       posts: {
 *         text: "title" | "slug" | "body";
 *         relationship: "author" | "category";
 *         select: "status";
 *         date: "publishedAt";
 *       };
 *       authors: {
 *         text: "name" | "email";
 *       };
 *     };
 *   }
 * }
 * ```
 */
export type CollectionsFieldTypeMap = GeneratedVexTypes extends {
  CollectionsFieldTypeMap: infer M extends Record<string, Record<string, string>>;
}
  ? M
  : Record<string, Record<string, never>>;
