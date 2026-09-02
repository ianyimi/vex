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
// UTILITIES
// ============================================================================

export * from "./utils";
export * from "./framework";
export * from "./api/convex";
export * from "./api/types";

// ============================================================================
// CONFIG BUILDERS
// ============================================================================

export * from "./config";

export * from "./access";

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
