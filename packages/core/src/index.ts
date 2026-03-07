export { defineConfig } from "./config/defineConfig";
export { defineCollection } from "./config/defineCollection";
export { generateVexSchema } from "./valueTypes/generate";
export { extendTable } from "./schema/extendTable";
export { generateColumns } from "./columns";
export { toTitleCase } from "./utils";

// Fields
export { text } from "./fields/text";
export { number } from "./fields/number";
export { checkbox } from "./fields/checkbox";
export { select } from "./fields/select";
export { date } from "./fields/date";
export { imageUrl } from "./fields/imageUrl";
export { relationship } from "./fields/relationship";
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
  JsonFieldMeta,
  ArrayFieldMeta,
  InferFieldType,
  InferFieldsType,
  // Collection types
  VexCollection,
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
  // Indexes
  SearchIndexConfig,
  ResolvedSearchIndex,
} from "./types";

export type {
  SchemaFieldInfo,
  RemovedFieldInfo,
  SchemaDiff,
  MigrationOp,
} from "./migrations";
