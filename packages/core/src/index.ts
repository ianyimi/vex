export { defineConfig } from "./config/defineConfig";
export { sanitizeConfigForClient } from "./config/sanitizeConfig";
export { isMediaCollection } from "./config/isMediaCollection";
export { defineCollection } from "./config/defineCollection";
export { defineMediaCollection } from "./config/defineMediaCollection";
export { generateVexSchema } from "./valueTypes/generate";
export { extendTable } from "./schema/extendTable";
export { generateColumns } from "./columns";
export { mergeAuthCollectionWithUserCollection } from "./valueTypes/merge";
export { toTitleCase } from "./utils";
export { generateFormSchema, fieldMetaToZod } from "./formSchema/generateFormSchema";
export { generateFormDefaultValues } from "./formSchema/generateFormDefaultValues";

// Fields
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
  GenericVexField,
  VexField,
  BaseFieldMeta,
  TextFieldMeta,
  NumberFieldMeta,
  CheckboxFieldMeta,
  SelectFieldMeta,
  SelectOption,
  DateFieldMeta,
  ImageUrlFieldMeta,
  RelationshipFieldMeta,
  UploadFieldMeta,
  UploadFieldOptions,
  JsonFieldMeta,
  ArrayFieldMeta,
  InferFieldType,
  InferFieldsType,
  // Field admin config
  FieldAdminConfig,
  // Collection types
  VexCollection,
  AnyVexCollection,
  CollectionConfig,
  CollectionAdminConfig,
  // Global types
  VexGlobal,
  GlobalConfig,
  GlobalAdminConfig,
  // auth types
  VexAuthAdapter,
  AuthCollectionFieldKeys,
  AuthTableFieldKeys,
  ResolvedIndex,
  // Config types
  VexConfig,
  ClientVexConfig,
  AdminConfig,
  // Config input types
  VexConfigInput,
  AdminConfigInput,
  AdminMetaInput,
  AdminSidebarInput,
  // Field options
  TextFieldOptions,
  NumberFieldOptions,
  CheckboxFieldOptions,
  SelectFieldOptions,
  DateFieldOptions,
  ImageUrlFieldOptions,
  RelationshipFieldOptions,
  JsonFieldOptions,
  ArrayFieldOptions,
  // Media types
  FileStorageAdapter,
  MediaCollectionConfig,
  MediaConfig,
  ClientMediaConfig,
  MediaConfigInput,
  LockedMediaField,
  OverridableMediaField,
  DefaultMediaFieldKeys,
  // Indexes
  SearchIndexConfig,
  ResolvedSearchIndex,
} from "./types";

export { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "./types/media";

export type { MergedCollectionResult } from "./valueTypes/merge";

export type {
  SchemaFieldInfo,
  RemovedFieldInfo,
  SchemaDiff,
  MigrationOp,
} from "./migrations";
