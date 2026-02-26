export interface CollectionField {
  name: string;
  type: "text" | "number" | "checkbox" | "select" | "richText" | "relationship";
  label?: string;
  required?: boolean;
  options?: { label: string; value: string }[]; // for select type
  relationTo?: string; // for relationship type
}

// =============================================================================
// FIELD TYPES
// =============================================================================

/**
 * Base metadata shared by all field types
 */
export interface BaseFieldMeta {
  readonly type: string;
  label?: string;
  description?: string;
  required?: boolean;
  admin?: FieldAdminConfig;
}

/**
 * Admin panel configuration for fields
 */
export interface FieldAdminConfig {
  /** Hide this field in the admin UI */
  hidden?: boolean;
  /** Make this field read-only */
  readOnly?: boolean;
  /** Position in the form: main content area or sidebar */
  position?: "main" | "sidebar";
  /** Field width: full, half, or third of container */
  width?: "full" | "half";
  /** Placeholder text for input fields */
  placeholder?: string;
  /** Helper text shown below the field */
  description?: string;
}

/**
 * Text field metadata
 */
export interface TextFieldMeta extends BaseFieldMeta {
  readonly type: "text";
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}

/**
 * Number field metadata
 */
export interface NumberFieldMeta extends BaseFieldMeta {
  readonly type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Checkbox field metadata
 */
export interface CheckboxFieldMeta extends BaseFieldMeta {
  readonly type: "checkbox";
  defaultValue?: boolean;
}

/**
 * Select option type
 */
export interface SelectOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

/**
 * Select field metadata with typed options
 */
export interface SelectFieldMeta<
  T extends string = string,
> extends BaseFieldMeta {
  readonly type: "select";
  options: readonly SelectOption<T>[];
  defaultValue?: T;
  hasMany?: boolean;
}

/**
 * Union of all field metadata types
 */
export type FieldMeta =
  | TextFieldMeta
  | NumberFieldMeta
  | CheckboxFieldMeta
  | SelectFieldMeta<string>;

/**
 * A VexField combines metadata with type information
 * The generic T represents the TypeScript type this field resolves to
 */
export interface VexField<
  T = unknown,
  TMeta extends BaseFieldMeta = BaseFieldMeta,
> {
  readonly _type: T;
  readonly _meta: TMeta;
}

/**
 * Extract the TypeScript type from a VexField
 */
export type InferFieldType<F> = F extends VexField<infer T, any> ? T : never;

/**
 * Extract types from a record of fields
 */
export type InferFieldsType<F extends Record<string, VexField<any, any>>> = {
  [K in keyof F]: InferFieldType<F[K]>;
};

// =============================================================================
// COLLECTION TYPES
// =============================================================================

/**
 * Collection admin configuration
 */
export interface CollectionAdminConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  /** Group collections in sidebar under this heading */
  group?: string;
  /** Icon name or component for sidebar */
  icon?: string;
  /** Field to use as document title in lists */
  useAsTitle?: keyof TFields;
  /** Default columns shown in list view */
  defaultColumns?: (keyof TFields)[];
  /** Disable create button */
  disableCreate?: boolean;
  /** Disable delete button */
  disableDelete?: boolean;
}

/**
 * Collection configuration
 */
export interface CollectionConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  /** Collection fields */
  fields: TFields;
  /** Display labels */
  labels?: {
    singular?: string;
    plural?: string;
  };
  /** Admin UI configuration */
  admin?: CollectionAdminConfig<TFields>;
}

/**
 * A defined collection with inferred document type
 */
export interface VexCollection<
  TFields extends Record<string, VexField<any, any>>,
> {
  readonly slug: string;
  readonly config: CollectionConfig<TFields>;
  /** Type helper - use `typeof collection._docType` to get document shape */
  readonly _docType: InferFieldsType<TFields>;
}

// =============================================================================
// CONFIG TYPES
// =============================================================================

/**
 * Admin panel configuration
 */
export interface AdminConfig {
  /** Collection slug to use for user authentication */
  user?: string;
  /** Page metadata */
  meta?: {
    titleSuffix?: string;
    favicon?: string;
  };
}

/**
 * Top-level Vex CMS configuration
 */
export interface VexConfig {
  basePath: string;
  /** Array of collection definitions */
  collections: VexCollection<any>[];
  /** Admin panel configuration */
  admin?: AdminConfig;
}

// =============================================================================
// FIELD OPTION TYPES (for builder function parameters)
// =============================================================================

/**
 * Options for text() field builder
 */
export interface TextFieldOptions {
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  admin?: FieldAdminConfig;
}

/**
 * Options for number() field builder
 */
export interface NumberFieldOptions {
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  admin?: FieldAdminConfig;
}

/**
 * Options for checkbox() field builder
 */
export interface CheckboxFieldOptions {
  label?: string;
  description?: string;
  defaultValue?: boolean;
  admin?: FieldAdminConfig;
}

/**
 * Options for select() field builder
 */
export interface SelectFieldOptions<T extends string> {
  label?: string;
  description?: string;
  required?: boolean;
  options: readonly SelectOption<T>[];
  defaultValue?: T;
  hasMany?: boolean;
  admin?: FieldAdminConfig;
}
