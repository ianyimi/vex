// ============================================================================
// HOOKS
// ============================================================================

export * from "./hooks";

// ============================================================================
// COLLECTIONS
// ============================================================================

export * from "./collections";

// ============================================================================
// GLOBALS
// ============================================================================

export * from "./globals";

// ============================================================================
// FIELD TYPES
// ============================================================================

export * from "./fields";

// ============================================================================
// COMPONENTS / EXTENSION POINTS
// ============================================================================

export * from "./components";

// ============================================================================
// EDITOR
// ============================================================================

export * from "./editor";

// ============================================================================
// VERSIONING
// ============================================================================

export * from "./versions";

// ============================================================================
// UTILITIES
// ============================================================================

export * from "./utils";
export * from "./framework";
export * from "./errors";
export type { VexWhere, VexWhereNode } from "./db/queryArgs";
export { validateWhereNode, whereToNode } from "./db/queryArgs";
export * from "./documents/types";
export * from "./collections/api/types";
export * from "./globals/api/types";
export * from "./versions/api/types";
export * from "./db/types";
export { vexConvexApi } from "./vexConvexApi";
export type { GetGlobalReturn } from "./globals/api";
export type { VersionSnapshotResult } from "./versions/api";

// ============================================================================
// CONFIG BUILDERS
// ============================================================================

export * from "./config";

export * from "./access";

// ============================================================================
// REVALIDATION
// ============================================================================

export * from "./revalidate";
export * from "./routes";

// ============================================================================
// LIVE PREVIEW
// ============================================================================

export * from "./livePreview";

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

export * from "./schema";
export * from "./types";

// ============================================================================
// AUTH
// ============================================================================

export {
  type VexAuthAdapter,
  type AuthCollectionConfig,
  type AuthFieldMeta,
  VexAuthConfigError,
} from "./auth/types";
export { mergeAuthCollections } from "./auth/mergeCollections";

// ============================================================================
// MEDIA / STORAGE ADAPTER
// ============================================================================

export {
  type VexStorageAdapter,
  type StorageAdapterPresignedUrlInterface,
  type StorageAdapterBaseInterface,
  type StorageAdapterProtocol,
  type MediaCollectionConfig,
  type MediaCollectionMeta,
  type MediaCollectionConfigInput,
  type GetUrlReturn,
  type GenerateUploadUrlReturn,
  type UploadFileReturn,
  STORAGE_ADAPTER_PROTOCOLS,
  StorageAdapterPresignedUrl,
  VexStorageConfigError,
  validateAndMergeStorageConfig,
  mediaApi,
  formatBytes,
  formatMimeType,
  createMediaDocumentArgs,
  createMediaDocumentReturn,
  deleteMediaArgs,
  deleteMediaReturn,
  getUrlArgs,
  getUrlReturn,
} from "./media";
