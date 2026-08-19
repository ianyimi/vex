import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { PaginationOptions, PaginationResult, VexApiAuth } from "./types";
import { CollectionSlug, VexDocumentGlobal } from "../types";

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
export type TDocument<TShape = {}> = Record<string, unknown> & TShape & VexDocument;

/**
 * Type for media documents returned from Convex queries.
 *
 * Extends `VexDocument` with all required media fields: alt, filename,
 * mimeType, size, storageId, deleted, src (the file URL), and optional
 * width/height. Use this instead of `TDocument` in media collection views to
 * avoid casting fields like `row.original.src as string`.
 *
 * @example
 * ```ts
 * const src = doc.src; // string | undefined, no cast needed
 * const alt = doc.alt ?? "";
 * ```
 *
 * @see {@link TDocument} for the base document type with custom shape support
 */
export interface VexMediaDocument extends VexDocument {
  /** Alt text for accessibility and SEO. */
  alt: string;
  /** Original filename of the uploaded file. */
  filename: string;
  /** MIME type (e.g., "image/jpeg", "application/pdf"). */
  mimeType: string;
  /** File size in bytes. */
  size: number;
  /** Storage adapter ID for the uploaded file. */
  storageId: string;
  /** Whether this media item has been soft-deleted. */
  deleted: boolean;
  /** URL to the file. */
  src: string;
  /** Image width in pixels (if applicable). */
  width?: number;
  /** Image height in pixels (if applicable). */
  height?: number;
}

// ── Collection API types ───────────────────────────────────────
//
// Extracted arg/return shapes for the generic Vex API collection endpoints.
// Used by `vexConvexApi` below and re-exported for user-side `vex.ts` casts
// to avoid TS2589 from the deep conditional types in `queryApi()`.

/** Args for `api.vex.find`. */
export interface VexFindArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: CollectionSlug;
  populate?: unknown;
  depth?: number;
  limit?: number;
  paginationOpts?: PaginationOptions;
}

/** Args for `api.vex.find`. */
export interface VexFindPaginatedArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: CollectionSlug;
  populate?: unknown;
  depth?: number;
  limit?: number;
  paginationOpts: PaginationOptions;
}

/** Args for `api.vex.get`. */
export interface VexGetArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  populate?: unknown;
  depth?: number;
}

/** Args for `api.vex.search`. */
export interface VexSearchArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  searchIndexName: string;
  searchField: string;
  query: string;
  limit?: number;
  populate?: unknown;
  depth?: number;
  paginationOpts?: PaginationOptions;
}

/** Args for `api.vex.create`. */
export interface VexCreateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  data: Record<string, unknown>;
}

/** Args for `api.vex.update`. */
export interface VexUpdateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  data: Record<string, unknown>;
}

/** Args for `api.vex.remove`. */
export interface VexRemoveArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  ids: string[];
  softDelete?: string;
}

// ── Media API shallow types ──────────────────────────────────────────────
//
// Arg and return shapes for the generic media endpoints. These mirror the
// `VexStorageAdapter` method signatures so the types stay in one place.

/** Args for `api.vex.media.generateUploadUrl`. */
export interface VexMediaGenerateUploadUrlArgs {
  [key: string]: unknown;
  adapter: string;
}

/** Return for `api.vex.media.generateUploadUrl`. */
export interface VexMediaGenerateUploadUrlReturn {
  [key: string]: unknown;
  url: string;
}

/** Args for `api.vex.media.createMediaDocument`. */
export interface VexMediaCreateMediaDocumentArgs {
  [key: string]: unknown;
  adapter: string;
  collectionSlug: string;
  storageId: string;
  filename: string;
  mimeType: string;
  size: number;
  alt?: string;
  adapterFields?: Record<string, unknown>;
}

/** Return for `api.vex.media.createMediaDocument`. */
export type VexMediaCreateMediaDocumentReturn = string;

/** Args for `api.vex.media.deleteMedia`. */
export interface VexMediaDeleteMediaArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  adapter: string;
  mediaId: string;
  softDelete?: boolean;
}

/** Return for `api.vex.media.deleteMedia`. */
export type VexMediaDeleteMediaReturn = boolean;

/** Args for `api.vex.media.getUrl`. */
export interface VexMediaGetUrlArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  adapter: string;
  mediaId: string;
}

/** Return for `api.vex.media.getUrl`. */
export interface VexMediaGetUrlReturn {
  [key: string]: unknown;
  url?: string;
  error?: string;
}

// ── Media API shallow types ──────────────────────────────────────────────

/** Args for `api.vex.globals.get`. */
export interface VexGlobalsGetArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  slug: string;
  populate?: Record<string, unknown>;
}

/** Args for `api.vex.globals.find`. */
export interface VexGlobalsFindArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
}

/** Args for `api.vex.globals.update`. */
export interface VexGlobalsUpdateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  slug: string;
  data: Record<string, unknown>;
}

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
   * Called by {@link react/src!CollectionListView} in `@vexcms/react`.
   */
  find: anyApi.vex.find as FunctionReference<
    "query",
    "public",
    VexFindArgs,
    VexDocument[] | PaginationResult<VexDocument>
  >,
  /**
   * Finds documents in a collection with cursor pagination.
   * Called by {@link react/src!CollectionListView} in `@vexcms/react`.
   */
  findPaginated: anyApi.vex.find as FunctionReference<
    "query",
    "public",
    VexFindPaginatedArgs,
    PaginationResult<VexDocument>
  >,

  /**
   * Fetches a single document by ID.
   * Called by {@link react/src!CollectionEditView} in `@vexcms/react` when editing.
   */
  get: anyApi.vex.get as FunctionReference<"query", "public", VexGetArgs, VexDocument | null>,

  /**
   * Creates a new document. Returns the new document's ID as a string.
   */
  create: anyApi.vex.create as FunctionReference<"mutation", "public", VexCreateArgs, string>,

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
  search: anyApi.vex.search as FunctionReference<
    "query",
    "public",
    VexSearchArgs,
    VexDocument[] | PaginationResult<VexDocument>
  >,

  /**
   * Patches an existing document — unspecified fields are left unchanged.
   */
  update: anyApi.vex.update as FunctionReference<"mutation", "public", VexUpdateArgs, void>,

  /**
   * Permanently deletes a document.
   */
  remove: anyApi.vex.remove as FunctionReference<"mutation", "public", VexRemoveArgs, void>,

  media: {
    /**
     * Generates a URL to upload a file to.
     * Called by `MediaUploadDropzone` in `@vexcms/react`.
     */
    generateUploadUrl: anyApi.vex.media.generateUploadUrl as FunctionReference<
      "mutation",
      "public",
      VexMediaGenerateUploadUrlArgs,
      VexMediaGenerateUploadUrlReturn
    >,

    /**
     * Creates a media document in Convex after the file is uploaded.
     * Called by `MediaUploadDropzone` in `@vexcms/react`.
     */
    createMediaDocument: anyApi.vex.media.createMediaDocument as FunctionReference<
      "mutation",
      "public",
      VexMediaCreateMediaDocumentArgs,
      VexMediaCreateMediaDocumentReturn
    >,

    /**
     * Deletes a media document and its file from storage.
     * Called by `MediaLibrary` in `@vexcms/react`.
     */
    deleteMedia: anyApi.vex.media.deleteMedia as FunctionReference<
      "mutation",
      "public",
      VexMediaDeleteMediaArgs,
      VexMediaDeleteMediaReturn
    >,

    /**
     * Returns a URL for a media file.
     * Called by `UploadFieldCell` in `@vexcms/react`.
     */
    getUrl: anyApi.vex.media.getUrl as FunctionReference<
      "query",
      "public",
      VexMediaGetUrlArgs,
      VexMediaGetUrlReturn
    >,
  },

  globals: {
    get: anyApi.vex.globals.get as FunctionReference<
      "query",
      "public",
      VexGlobalsGetArgs,
      VexDocumentGlobal | null
    >,
    find: anyApi.vex.globals.find as FunctionReference<
      "query",
      "public",
      VexGlobalsFindArgs,
      VexDocumentGlobal[]
    >,
    upsert: anyApi.vex.globals.upsert as FunctionReference<
      "mutation",
      "public",
      VexGlobalsUpdateArgs,
      string
    >,
  },
} as const;
