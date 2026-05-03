import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";

/**
 * Base type for all VexCMS documents as returned from Convex queries.
 *
 * All documents include the Convex system fields `_id` and `_creationTime`,
 * plus whatever field values are defined in the collection's schema.
 *
 * Framework adapters use this as the `initialData` type in view component
 * props — the actual field values are accessed via string keys.
 *
 * @example
 * ```ts
 * const title = typeof doc.title === "string" ? doc.title : "";
 * ```
 *
 * @see {@link vexConvexApi} for the query functions that return this type
 */
export interface VexDocument {
  /** Convex document ID string. */
  _id: string;
  /** Unix timestamp (milliseconds) when the document was created. */
  _creationTime: number;
  /** Field values defined by the collection schema. */
  [key: string]: unknown;
}

/**
 * Alias for `VexDocument` that also satisfies `Record<string, unknown>`.
 *
 * Use this type when a generic `Record` index signature is required alongside
 * the Convex system fields — for example, as the `data` type in TanStack Table
 * or as the form `defaultValues` record.
 *
 * @see {@link VexDocument} for the base type
 */
export type TDocument = Record<string, unknown> & VexDocument;

/**
 * Typed `anyApi` references to the VexCMS generic Convex collection functions.
 *
 * These point to functions that users copy into `convex/vex/collections.ts`
 * in their project. All paths are fixed under `vex.collections.*`.
 *
 * **Required:** copy `convex/vex/collections.ts` from the VexCMS template
 * into your project before these references will resolve at runtime.
 *
 * Used internally by view components in `@vexcms/react`. Framework adapter
 * authors do not need to import this directly unless building custom views.
 *
 * @example
 * ```ts
 * import { convexQuery } from "@convex-dev/react-query";
 * import { useQuery } from "@tanstack/react-query";
 * import { vexConvexApi } from "@vexcms/core";
 *
 * const { data } = useQuery({
 *   ...convexQuery(vexConvexApi.list, { collection: "posts" }),
 * });
 * ```
 */
export const vexConvexApi = {
  /**
   * Lists documents in a collection.
   * Called by {@link CollectionListView} in `@vexcms/react`.
   */
  list: anyApi.vex.collections.list as FunctionReference<
    "query",
    "public",
    { collection: string; limit?: number },
    VexDocument[]
  >,

  /**
   * Fetches a single document by ID.
   * Called by {@link CollectionEditView} in `@vexcms/react` when editing.
   */
  get: anyApi.vex.collections.get as FunctionReference<
    "query",
    "public",
    { id: string },
    VexDocument | null
  >,

  /**
   * Creates a new document. Returns the new document's ID as a string.
   */
  create: anyApi.vex.collections.create as FunctionReference<
    "mutation",
    "public",
    { collection: string; data: Record<string, unknown> },
    string
  >,

  /**
   * Searches documents in a collection by a search index.
   *
   * Used by `RelationshipFieldInput` in `@vexcms/react` to populate the
   * relationship picker combobox. The `searchIndexName` must match the
   * `.searchIndex()` name in the Convex schema — VexCMS auto-generates
   * `search_<useAsTitle>` when another collection has a relationship here.
   * Pass `query: ""` to list recent documents when no search term is entered.
   *
   * @see {@link https://docs.convex.dev/text-search} for Convex search docs
   */
  search: anyApi.vex.collections.search as FunctionReference<
    "query",
    "public",
    {
      collection: string;
      searchIndexName: string;
      searchField: string;
      query: string;
      limit?: number;
    },
    VexDocument[]
  >,

  /**
   * Patches an existing document — unspecified fields are left unchanged.
   */
  update: anyApi.vex.collections.update as FunctionReference<
    "mutation",
    "public",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { id: string; data: any },
    void
  >,

  /**
   * Permanently deletes a document.
   */
  remove: anyApi.vex.collections.remove as FunctionReference<
    "mutation",
    "public",
    { collection: string; id: string },
    void
  >,
} as const;
