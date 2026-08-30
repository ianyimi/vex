import { VexDocument } from "../api/convex";

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
 * Custom query/mutation actions per subject slug, as declared in the project's
 * `defineAccess({ customActions })` and emitted by `vex generate`.
 *
 * - **Before `vex generate`:** resolves to `{}` — no slug has declared custom
 *   actions, and {@link QueryCallActionFor} falls back to accepting any string.
 * - **After `vex generate`:** e.g.
 *   `{ articles: { query: "listFeatured"; mutation: "publish" } }`. A missing
 *   list emits `never`, so single-list declarations stay exact.
 */
export type CustomActionsBySlug = GeneratedVexTypes extends {
  CustomActionsBySlug: infer C extends Record<string, { query: string; mutation: string }>;
}
  ? C
  : {};

/**
 * Maps each collection slug to its declared Convex indexes, each as a
 * `readonly` tuple of field names in declaration order (`.index(name,
 * [...])` — search indexes excluded, since `withIndex` never targets
 * those). Field order is exactly what `ConstraintBuilder`
 * (`access/constraintTypes.ts`) narrows against, so this registry is the
 * sole source of truth both the constraint builder and `IndexNameFor`
 * resolve through — no parallel name-union map (supersedes the old
 * `IndexesBySlug`).
 *
 * - **Before `vex generate`:** resolves to
 *   `Record<string, Record<string, readonly string[]>>`.
 * - **After `vex generate`:** e.g.
 *   `{ pages: { by_author_category: readonly ["authorId", "categoryId"] } }`.
 *   A collection with NO indexed fields maps to `{}`, never `never` — see
 *   {@link IndexNameFor}.
 */
export type IndexFieldsBySlug = GeneratedVexTypes extends {
  IndexFieldsBySlug: infer I extends Record<string, Record<string, readonly string[]>>;
}
  ? I
  : Record<string, Record<string, readonly string[]>>;

/**
 * Index-name union for one slug — the keys of its {@link IndexFieldsBySlug}
 * entry. Widens to `string` pre-generation. An index-less slug's entry is
 * `{}`, and `keyof {}` is `never`, so this still correctly yields `never`
 * for that slug post-generation — the same result the old name-union form
 * gave by emitting `never` directly, reached here through an empty object
 * instead (an empty object stays a well-typed `keyof` target; a bare
 * `never` union would not, if `IndexFieldsFor` ever needed to index into
 * it).
 *
 * @internal
 */
export type IndexNameFor<S extends string> = S extends keyof IndexFieldsBySlug
  ? keyof IndexFieldsBySlug[S]
  : string;

/**
 * The field tuple for one slug + index name, in declaration order — what
 * `ConstraintBuilder<TFields, TDoc>` (`access/constraintTypes.ts`) is
 * instantiated with.
 *
 * @typeParam S - Collection slug.
 * @typeParam N - Index name declared on `S` (a member of `IndexNameFor<S>`).
 * @see {@link IndexFieldsBySlug}
 */
export type IndexFieldsFor<
  S extends keyof IndexFieldsBySlug,
  N extends keyof IndexFieldsBySlug[S],
> = IndexFieldsBySlug[S][N] extends readonly string[] ? IndexFieldsBySlug[S][N] : never;

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
 * @example Generated content after running vex generate
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

/**
 * Union of all global slugs registered in this project's VexCMS config.
 *
 * - **Before `vex generate`:** resolves to `string`.
 * - **After `vex generate`:** resolves to e.g. `"siteSettings" | "navigationConfig"`.
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 */
export type GlobalSlug = GeneratedVexTypes extends { GlobalSlug: infer S extends string }
  ? S
  : string;

/**
 * Maps each global slug to its generated flat document interface.
 *
 * Each value type extends `VexDocumentGlobal<TSlug>` (which extends `VexDocument`)
 * and adds user fields at root level — identical ergonomics to `DocumentBySlug`.
 *
 * - **Before `vex generate`:** resolves to `Record<string, unknown>`.
 * - **After:** e.g. `{ siteSettings: SiteSettingsGlobal; nav: NavigationConfigGlobal }`.
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 */
export type GlobalDocumentBySlug = GeneratedVexTypes extends {
  GlobalDocumentBySlug: infer D extends Record<string, unknown>;
}
  ? D
  : Record<string, unknown>;

/**
 * Per-global field-type map. Augmented by `vex generate`. Powers
 * `GlobalRelationshipKeysOf<TGlobalSlug>` for populate type narrowing.
 *
 * Structure: `{ globalSlug: { fieldType: "fieldKey1" | "fieldKey2" } }`.
 */
export type GlobalsFieldTypeMap = GeneratedVexTypes extends {
  GlobalsFieldTypeMap: infer M extends Record<string, Record<string, string>>;
}
  ? M
  : Record<string, Record<string, never>>;

/**
 * Flat global document returned by `globals.get` and `globals.find`.
 *
 * Extends `VexDocument` (inheriting `_id: string` and `_creationTime: number`)
 * and adds `_slug: TSlug` as the discriminator field. The generated per-global
 * interfaces (e.g. `SiteSettingsGlobal`) extend this type and add user fields.
 *
 * When called with a typed `TSlug`, `globals.get` returns
 * `GlobalDocumentBySlug[TSlug]` (the concrete generated interface), not this
 * base type. This type is the fallback for unnarrowed contexts (e.g. the return
 * of `findGlobals`).
 *
 * @typeParam TSlug - The global slug. Defaults to `GlobalSlug` (all slugs).
 *
 * @example
 * ```ts
 * const doc: VexDocumentGlobal<"siteSettings"> = ...;
 * doc._slug;         // "siteSettings"
 * doc._id;           // string (from VexDocument)
 * doc._creationTime; // number (from VexDocument)
 * // user fields are accessible via the index signature: doc["siteName"]
 * ```
 *
 * @see {@link VexDocument} for the base type
 */
export interface VexDocumentGlobal<TSlug extends GlobalSlug = GlobalSlug> extends VexDocument {
  /**
   * The global slug — uniquely identifies which global this document is.
   * Renamed from `slug` (the DB column name) at the API layer to avoid
   * collisions with user-defined field keys.
   */
  _slug: TSlug;
}

/**
 * Relationship field keys on `TGlobalSlug`. Reads `GlobalsFieldTypeMap`.
 * Used to narrow the `populate` arg of `globals.get` / `globals.find`.
 *
 * @typeParam TGlobalSlug - The global slug.
 */
export type GlobalRelationshipKeysOf<TGlobalSlug extends GlobalSlug> =
  TGlobalSlug extends keyof GlobalsFieldTypeMap
    ? "relationship" extends keyof GlobalsFieldTypeMap[TGlobalSlug]
      ? GlobalsFieldTypeMap[TGlobalSlug]["relationship"] & string
      : never
    : never;

/**
 * Populate options for a global — keys restricted to relationship fields via
 * `GlobalRelationshipKeysOf<TGlobalSlug>`. Mirrors `PopulateShape` for
 * collections; nested populate resolves to collection populate shapes since
 * globals relate to collections, not to other globals.
 *
 * @typeParam TGlobalSlug - The global slug.
 */
export type GlobalPopulateShape<TGlobalSlug extends GlobalSlug = GlobalSlug> = {
  [K in GlobalRelationshipKeysOf<TGlobalSlug>]?: true | { populate: Record<string, unknown> };
};

/**
 * Return type of `globals.get` when `populate` is provided. Maps over
 * `GlobalDocumentBySlug[TGlobalSlug]` replacing each populated relationship
 * field's `string` type with `Doc<TargetSlug>[]`.
 *
 * Mirrors `Populated<TCollectionSlug, TPopulate>` from the collection API;
 * operates on `GlobalDocumentBySlug` instead of `DocumentBySlug`.
 *
 * @typeParam TGlobalSlug - The global slug.
 * @typeParam TPopulate - The populate options object.
 */
export type GlobalPopulated<
  TGlobalSlug extends GlobalSlug,
  TPopulate extends GlobalPopulateShape<TGlobalSlug>,
> = TGlobalSlug extends keyof GlobalDocumentBySlug
  ? {
      [K in keyof GlobalDocumentBySlug[TGlobalSlug]]: K extends keyof TPopulate
        ? K extends string
          ? GlobalDocumentBySlug[TGlobalSlug][K] extends string | undefined
            ? // Relationship field: replace ID string with resolved doc array
              TPopulate[K] extends { populate: infer _NestedPopulate }
              ? Record<string, unknown>[] // nested populate — widened for now (see Out of Scope)
              : Record<string, unknown>[]
            : GlobalDocumentBySlug[TGlobalSlug][K]
          : GlobalDocumentBySlug[TGlobalSlug][K]
        : GlobalDocumentBySlug[TGlobalSlug][K];
    }
  : never;

/**
 * The collection slugs `defineAccess` was configured with, as emitted by
 * `vex generate` from `vex.config.ts`.
 *
 * - **Before `vex generate`:** both resolve to `never`.
 * - **After:** e.g. `{ user: "user"; organization: "organization" }`.
 *
 * This exists so core can resolve the project's user and organization DOCUMENT types
 * without a project passing them in. It is what lets `AccessCheck<S>` take one type
 * parameter instead of three, so a project's composable access checks need no local
 * type aliases at all.
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 */
export type AuthSlugs = GeneratedVexTypes extends {
  AuthSlugs: infer A extends { organization: string; user: string };
}
  ? A
  : { organization: never; user: never };

/**
 * Document type for slug `S`, or `TFallback` when `S` is not a registered collection.
 *
 * `S` is a naked type parameter on purpose: TypeScript narrows a conditional's checked
 * type only when it is a bare parameter, so writing the lookup inline as
 * `AuthSlugs["user"] extends keyof DocumentBySlug ? DocumentBySlug[AuthSlugs["user"]]`
 * fails with "Type 'never' cannot be used as an index type".
 *
 * @typeParam S - Collection slug to resolve.
 * @typeParam TFallback - Resolved type when `S` is not registered.
 */
type DocumentForSlug<S, TFallback> = S extends keyof DocumentBySlug ? DocumentBySlug[S] : TFallback;

/**
 * The project's user document type, resolved through {@link AuthSlugs}.
 *
 * Falls back to the wide `Record<string, unknown>` when the registry is unaugmented or
 * no user collection is configured — the same widening every other pre-generation
 * lookup uses, so a check stays writable before `vex generate` has run.
 */
export type AuthUserDocument = [AuthSlugs["user"]] extends [never]
  ? Record<string, unknown>
  : DocumentForSlug<AuthSlugs["user"], Record<string, unknown>>;

/**
 * The project's organization document type, resolved through {@link AuthSlugs}.
 *
 * Resolves to `never` when no organization collection is configured, which is how
 * `ConstraintsCallbackProps` already signals "no `organization` key on the props".
 */
export type AuthOrgDocument = [AuthSlugs["organization"]] extends [never]
  ? never
  : DocumentForSlug<AuthSlugs["organization"], never>;
