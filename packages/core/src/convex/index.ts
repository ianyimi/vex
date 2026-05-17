import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import { CollectionSlug } from "../types";

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

// ── Shallow FunctionReference types ───────────────────────────────────────
//
// Extracted arg/return shapes for the generic Vex API endpoints.
// Used by `vexConvexApi` below and re-exported for user-side `vex.ts` casts
// to avoid TS2589 from the deep conditional types in `queryApi()`.

/** Args for `api.vex.find`. */
export interface VexFindArgs {
  [key: string]: unknown;
  collection: CollectionSlug;
  populate?: unknown;
  depth?: number;
  limit?: number;
}

/** Args for `api.vex.get`. */
export interface VexGetArgs {
  [key: string]: unknown;
  id: string;
  populate?: unknown;
  depth?: number;
}

/** Args for `api.vex.search`. */
export interface VexSearchArgs {
  [key: string]: unknown;
  collection: string;
  searchIndexName: string;
  searchField: string;
  query: string;
  limit?: number;
  populate?: unknown;
  depth?: number;
}

/** Args for `api.vex.create`. */
export interface VexCreateArgs {
  [key: string]: unknown;
  collection: string;
  data: Record<string, unknown>;
}

/** Args for `api.vex.update`. */
export interface VexUpdateArgs {
  [key: string]: unknown;
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

/** Args for `api.vex.remove`. */
export interface VexRemoveArgs {
  [key: string]: unknown;
  collection: string;
  id: string;
}

/** Shallow FunctionReference for `api.vex.find`. */
export type VexFindRef = FunctionReference<"query", "public", VexFindArgs, VexDocument[]>;

/** Shallow FunctionReference for `api.vex.get`. */
export type VexGetRef = FunctionReference<"query", "public", VexGetArgs, VexDocument | null>;

/** Shallow FunctionReference for `api.vex.search`. */
export type VexSearchRef = FunctionReference<"query", "public", VexSearchArgs, VexDocument[]>;

/** Shallow FunctionReference for `api.vex.create`. */
export type VexCreateRef = FunctionReference<"mutation", "public", VexCreateArgs, string>;

/** Shallow FunctionReference for `api.vex.update`. */
export type VexUpdateRef = FunctionReference<"mutation", "public", VexUpdateArgs, void>;

/** Shallow FunctionReference for `api.vex.remove`. */
export type VexRemoveRef = FunctionReference<"mutation", "public", VexRemoveArgs, void>;

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
   * Finds documents in a collection.
   * Called by {@link CollectionListView} in `@vexcms/react`.
   */
  find: anyApi.vex.find as VexFindRef,

  /**
   * Fetches a single document by ID.
   * Called by {@link CollectionEditView} in `@vexcms/react` when editing.
   */
  get: anyApi.vex.get as VexGetRef,

  /**
   * Creates a new document. Returns the new document's ID as a string.
   */
  create: anyApi.vex.create as VexCreateRef,

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
  search: anyApi.vex.search as VexSearchRef,

  /**
   * Patches an existing document — unspecified fields are left unchanged.
   */
  update: anyApi.vex.update as VexUpdateRef,

  /**
   * Permanently deletes a document.
   */
  remove: anyApi.vex.remove as VexRemoveRef,
} as const;
