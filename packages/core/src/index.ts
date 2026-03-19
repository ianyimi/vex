export { defineConfig } from "./config/defineConfig";
export { defineCollection, defineMediaCollection } from "./config/defineCollection";
export { defineAccess } from "./access/defineAccess";
export { hasPermission } from "./access/hasPermission";
export { sanitizeConfigForClient, extractLivePreviewConfigs } from "./config/sanitizeConfig";
export { isMediaCollection } from "./config/isMediaCollection";
export { findCollectionBySlug, getAllCollections } from "./config/findCollectionBySlug";
export { generateVexSchema } from "./valueTypes/generate";
export { extendTable } from "./schema/extendTable";
export { generateColumns } from "./columns";
export { mergeAuthCollectionWithUserCollection } from "./valueTypes/merge";
export { toTitleCase } from "./utils";
export { generateFormSchema, fieldMetaToZod } from "./formSchema/generateFormSchema";
export { generateFormDefaultValues } from "./formSchema/generateFormDefaultValues";

// Field helpers
export { text } from "./fields/text";
export { number } from "./fields/number";
export { checkbox } from "./fields/checkbox";
export { select } from "./fields/select";
export { date } from "./fields/date";
export { imageUrl } from "./fields/imageUrl";
export { relationship } from "./fields/relationship";
export { upload } from "./fields/media";
export { json } from "./fields/json";
export { array } from "./fields/array";
export { richtext } from "./fields/richtext";
export { ui } from "./fields/ui";
export { blocks } from "./fields/blocks";

// Block helpers
export { defineBlock } from "./blocks/defineBlock";

// Type generation
export { generateVexTypes } from "./typeGen/generateVexTypes";
export { slugToInterfaceName } from "./typeGen/slugToInterfaceName";

export * from "./versioning";

// Live Preview
export { resolvePreviewURL, shouldReloadURL, DEFAULT_BREAKPOINTS, PREVIEW_SNAPSHOT_DEBOUNCE_MS } from "./livePreview";
export {
  upsertPreviewSnapshot,
  deletePreviewSnapshot,
  getPreviewSnapshot,
} from "./convex/previewSnapshot";
export { vexQuery, type VexQueryCtx, type VexDraftsMode } from "./convex/vexQuery";

// Convex model functions — used by generated per-collection query files
export {
  getDocument,
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
} from "./convex/model/collections";

// Collection query codegen
export {
  generateCollectionQueries,
  generateIndexFile,
  GENERATED_HEADER,
  type CollectionQueryImports,
  type GeneratedFiles,
} from "./valueTypes/generateCollectionQueries";

export * from "./errors";

// Migrations
export {
  diffSchema,
  makeFieldsOptional,
  addRemovedFieldsAsOptional,
  planMigration,
} from "./migrations";

// Types
export type {
  // Field types
  VexField,
  TextFieldDef,
  NumberFieldDef,
  CheckboxFieldDef,
  SelectFieldDef,
  SelectOption,
  DateFieldDef,
  ImageUrlFieldDef,
  RelationshipFieldDef,
  UploadFieldDef,
  JsonFieldDef,
  ArrayFieldDef,
  RichTextFieldDef,
  BlockDef,
  BlockAdminConfig,
  BlocksFieldDef,
  InferBlockUnion,
  InferFieldType,
  InferFieldsType,
  // Field admin config
  FieldAdminConfig,
  FieldComponentProps,
  CellComponentProps,
  UIFieldDef,
  DistributiveOmit,
  // Collection types
  VexCollection,
  AnyVexCollection,
  CollectionAdminConfig,
  IndexConfig,
  SearchIndexConfig,
  VersionsConfig,
  VersioningFieldKeys,
  // Global types
  VexGlobal,
  GlobalAdminConfig,
  // auth types
  VexAuthAdapter,
  AuthCollectionFieldKeys,
  AuthTableFieldKeys,
  ResolvedIndex,
  ResolvedSearchIndex,
  // Config types
  VexConfig,
  ClientVexConfig,
  AdminConfig,
  // Config input types
  VexConfigInput,
  AdminConfigInput,
  AdminMetaInput,
  AdminSidebarInput,
  // Editor adapter types
  VexEditorAdapter,
  VexEditorComponentProps,
  VexRenderComponentProps,
  RichTextDocument,
  RichTextElement,
  RichTextText,
  // Live preview types
  LivePreviewConfig,
  LivePreviewBreakpoint,
  AdminLivePreviewConfig,
  // Media types
  VexMediaCollection,
  FileStorageAdapter,
  MediaConfig,
  ClientMediaConfig,
  MediaConfigInput,
  LockedMediaField,
  OverridableMediaField,
  DefaultMediaFieldKeys,
} from "./types";

export type {
  VexAccessConfig,
  VexAccessInput,
  VexAccessInputBase,
  VexAccessInputWithOrg,
  AccessAction,
  FieldPermissionResult,
  PermissionCheck,
  PermissionCallbackProps,
  RolesWithPermissions,
  ResourcePermissions,
  ExtractSlug,
  ExtractFieldKeys,
  ExtractDocType,
  LookupBySlug,
  ExtractSlugs,
} from "./access/types";

export type { ResolvedFieldPermissions } from "./access/hasPermission";

export { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "./types/media";

export type { MergedCollectionResult } from "./valueTypes/merge";

export type {
  CollectionKind,
  ResolvedCollectionMatch,
} from "./config/findCollectionBySlug";

export type {
  SchemaFieldInfo,
  RemovedFieldInfo,
  SchemaDiff,
  MigrationOp,
} from "./migrations";
