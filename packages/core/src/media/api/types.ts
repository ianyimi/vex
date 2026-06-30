import type { GenericDataModel } from "convex/server";

import type {
  GenericMutationClientParams,
  GenericMutationServerParams,
  GenericQueryClientParams,
  GenericQueryServerParams,
} from "../../api/types";
import type { VexConfig } from "../../config";

// ── Generic media args base types ──────────────────────────────────────────
//
// Every public media API function's args interface extends one of these four
// types. They factor out the `ctx` discriminator and `config` so per-function
// args interfaces only carry their unique fields.

/**
 * Base shape for server-side args of a media mutation function.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface GenericMediaMutationServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
> extends GenericMutationServerParams<DataModel> {
  /** The resolved `VexConfig` — required for adapter lookup. */
  config: VexConfig;
}

/**
 * Base shape for client-side args of a media mutation function.
 *
 * @example Inheritance pattern
 * ```ts
 * // createMediaDocument — adds collectionSlug, storageId, filename, mimeType, size
 * interface CreateMediaDocumentClientArgs
 *   extends GenericMediaMutationClientParams {
 *   adapter: string;
 *   collectionSlug: string;
 *   storageId: string;
 *   filename: string;
 *   mimeType: string;
 *   size: number;
 *   alt?: string;
 *   adapterFields?: Record<string, unknown>;
 * }
 */
export interface GenericMediaMutationClientParams extends GenericMutationClientParams {}

/**
 * Base shape for server-side args of a media query function.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface GenericMediaQueryServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
> extends GenericQueryServerParams<DataModel> {
  /** The resolved `VexConfig` — required for adapter lookup. */
  config: VexConfig;
}

/**
 * Base shape for client-side args of a media query function.
 *
 * @example Inheritance pattern
 * ```ts
 * // getUrl — adds adapter + mediaId
 * interface GetUrlClientArgs extends GenericMediaQueryClientParams {
 *   adapter: string;
 *   mediaId: string;
 * }
 */
export interface GenericMediaQueryClientParams extends GenericQueryClientParams {}

// ── Per-function server args ───────────────────────────────────────────────

/** Server-side args for `generateUploadUrl`. */
export interface GenerateUploadUrlServerArgs<
  TDataModel extends GenericDataModel = GenericDataModel,
> extends GenericMediaMutationServerParams<TDataModel> {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
}

/** Server-side args for `createMediaDocument`. */
export interface CreateMediaDocumentServerArgs<
  TDataModel extends GenericDataModel = GenericDataModel,
> extends GenericMediaMutationServerParams<TDataModel> {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug where the document is stored. */
  collectionSlug: string;
  /** Adapter-specific storage ID (e.g., Cloudinary public_id, S3 key). */
  storageId: string;
  /** Original filename of the uploaded file. */
  filename: string;
  /** MIME type of the uploaded file (e.g., "image/png"). */
  mimeType: string;
  /** File size in bytes. */
  size: number;
  /** Alt text for accessibility — defaults to `filename` if omitted. */
  alt?: string;
  /** Adapter-specific fields (e.g., Cloudinary transformation params). */
  adapterFields?: Record<string, unknown>;
}

/** Server-side args for `deleteMedia`. */
export interface DeleteMediaServerArgs<
  TDataModel extends GenericDataModel = GenericDataModel,
> extends GenericMediaMutationServerParams<TDataModel> {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media document ID to delete. */
  mediaId: string;
  /** When `true`, sets `deleted: true` instead of physical deletion. */
  softDelete?: boolean;
}

// ── Per-function query server args ─────────────────────────────────────────

/** Server-side args for `getUrl`. */
export interface GetUrlServerArgs<
  TDataModel extends GenericDataModel = GenericDataModel,
> extends GenericMediaQueryServerParams<TDataModel> {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media document ID to get the URL for. */
  mediaId: string;
}

/** Server-side args for `listMedia`. */
export interface ListMediaServerArgs<
  TDataModel extends GenericDataModel = GenericDataModel,
> extends GenericMediaQueryServerParams<TDataModel> {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug to list from. */
  collectionSlug: string;
  /** Maximum number of documents to return. Defaults to 100. */
  limit?: number;
  /** Offset for pagination. Defaults to 0. */
  offset?: number;
}

/** Server-side args for `searchMedia`. */
export interface SearchMediaServerArgs<
  TDataModel extends GenericDataModel = GenericDataModel,
> extends GenericMediaQueryServerParams<TDataModel> {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug to search in. */
  collectionSlug: string;
  /** Search query string — matches against `filename` and `alt` fields. */
  query: string;
}

// ── Per-function client args ───────────────────────────────────────────────

/** Client-side args for `generateUploadUrl`. */
export interface GenerateUploadUrlClientArgs extends GenericMediaMutationClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
}

/** Client-side args for `createMediaDocument`. */
export interface CreateMediaDocumentClientArgs extends GenericMediaMutationClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug where the document is stored. */
  collectionSlug: string;
  /** Adapter-specific storage ID (e.g., Cloudinary public_id, S3 key). */
  storageId: string;
  /** Original filename of the uploaded file. */
  filename: string;
  /** MIME type of the uploaded file (e.g., "image/png"). */
  mimeType: string;
  /** File size in bytes. */
  size: number;
  /** Alt text for accessibility — defaults to `filename` if omitted. */
  alt?: string;
  /** Adapter-specific fields (e.g., Cloudinary transformation params). */
  adapterFields?: Record<string, unknown>;
}

/** Client-side args for `deleteMedia`. */
export interface DeleteMediaClientArgs extends GenericMediaMutationClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media document ID to delete. */
  mediaId: string;
  /** When `true`, sets `deleted: true` instead of physical deletion. */
  softDelete?: boolean;
}

/** Client-side args for `getUrl`. */
export interface GetUrlClientArgs extends GenericMediaQueryClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media document ID to get the URL for. */
  mediaId: string;
}

/** Client-side args for `listMedia`. */
export interface ListMediaClientArgs extends GenericMediaQueryClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug to list from. */
  collectionSlug: string;
  /** Maximum number of documents to return. Defaults to 100. */
  limit?: number;
  /** Offset for pagination. Defaults to 0. */
  offset?: number;
}

/** Client-side args for `searchMedia`. */
export interface SearchMediaClientArgs extends GenericMediaQueryClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug to search in. */
  collectionSlug: string;
  /** Search query string — matches against `filename` and `alt` fields. */
  query: string;
}
