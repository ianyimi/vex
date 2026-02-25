export { defineConfig } from "./config/defineConfig";
export { defineCollection } from "./config/defineCollection";

// Fields
export { text } from "./fields/text";
export { number } from "./fields/number";
export { checkbox } from "./fields/checkbox";
export { select } from "./fields/select";

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
  // Config types
  VexConfig,
  AdminConfig,
  // Field options
  TextFieldOptions,
  NumberFieldOptions,
  CheckboxFieldOptions,
  SelectFieldOptions,
} from "./types";
