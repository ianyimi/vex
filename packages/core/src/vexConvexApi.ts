import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { PaginationResult } from "./db/types";
import { VexDocumentGlobal } from "./types";
import type { VexDocument } from "./documents/types";
import type { VersionSummary } from "./versions/types";
import type { VersionSnapshotResult } from "./versions/api/getVersionSnapshot/server";
import type {
  VexFindArgs,
  VexFindPaginatedArgs,
  VexGetArgs,
  VexSearchArgs,
  VexCreateArgs,
  VexUpdateArgs,
  VexRemoveArgs,
} from "./collections/api/types";
import type {
  VexMediaGenerateUploadUrlArgs,
  VexMediaGenerateUploadUrlReturn,
  VexMediaCreateMediaDocumentArgs,
  VexMediaCreateMediaDocumentReturn,
  VexMediaDeleteMediaArgs,
  VexMediaDeleteMediaReturn,
  VexMediaGetUrlArgs,
  VexMediaGetUrlReturn,
} from "./media/api/types";
import type { VexGlobalsGetArgs, VexGlobalsFindArgs, VexGlobalsUpdateArgs } from "./globals/api/types";
import type {
  VexSaveDraftArgs,
  VexPublishArgs,
  VexUnpublishArgs,
  VexListVersionsArgs,
  VexGetVersionSnapshotArgs,
  VexDeleteVersionArgs,
} from "./versions/api/types";

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
   * Resolves a `{ server }` live-preview URL with a real Convex `ctx`.
   * Called by `useLivePreviewServerUrl` in `@vexcms/react`, and only for that
   * `url` form — string and client resolvers never reach the server.
   */
  livePreviewUrl: anyApi.vex.livePreviewUrl as FunctionReference<
    "query",
    "public",
    {
      collection: string;
      kind?: "collection" | "global";
      documentId?: string;
      values?: Record<string, unknown>;
    },
    string | null
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

  versions: {
    saveDraft: anyApi.vex.versions.saveDraft as FunctionReference<
      "mutation",
      "public",
      VexSaveDraftArgs,
      string
    >,
    publish: anyApi.vex.versions.publish as FunctionReference<
      "mutation",
      "public",
      VexPublishArgs,
      string
    >,
    unpublish: anyApi.vex.versions.unpublish as FunctionReference<
      "mutation",
      "public",
      VexUnpublishArgs,
      string
    >,
    listVersions: anyApi.vex.versions.listVersions as FunctionReference<
      "query",
      "public",
      VexListVersionsArgs,
      VersionSummary[]
    >,
    getVersionSnapshot: anyApi.vex.versions.getVersionSnapshot as FunctionReference<
      "query",
      "public",
      VexGetVersionSnapshotArgs,
      VersionSnapshotResult
    >,
    deleteVersion: anyApi.vex.versions.deleteVersion as FunctionReference<
      "mutation",
      "public",
      VexDeleteVersionArgs,
      void
    >,
  },
} as const;
