export { defineConfig } from "./config/defineConfig";
export { defineCollection } from "./config/defineCollection";
export { generateVexSchema } from "./valueTypes/generate";
export { extendTable } from "./schema/extendTable";

// Fields
export { text } from "./fields/text";
export { number } from "./fields/number";
export { checkbox } from "./fields/checkbox";
export { select } from "./fields/select";
export * from "./errors";

// Types
export type {
  // Field types
  VexField,
  BaseFieldMeta,
  TextFieldMeta,
  NumberFieldMeta,
  CheckboxFieldMeta,
  SelectFieldMeta,
  SelectOption,
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
  AuthTableDefinition,
  AuthFieldDefinition,
  ResolvedIndex as AuthIndexDefinition,
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
} from "./types";
