// =============================================================================
// FIELD TYPES
// =============================================================================

/**
 * Admin panel configuration for individual fields.
 * Controls visibility, layout, and input behavior in the admin UI.
 */
export interface FieldAdminConfig {
  /**
   * Hide this field from the admin form.
   * Hidden fields are still stored in the database.
   *
   * Default: `false`
   */
  hidden?: boolean;
  /**
   * Make this field read-only in the admin form.
   * The value is displayed but cannot be edited.
   *
   * Default: `false`
   */
  readOnly?: boolean;
  /**
   * Position of the field in the form layout.
   *
   * - `"main"` — placed in the main content area
   * - `"sidebar"` — placed in the sidebar panel
   *
   * Default: `"main"`
   */
  position?: "main" | "sidebar";
  /**
   * Width of the field within its row.
   *
   * - `"full"` — spans the full width
   * - `"half"` — spans half the width (two fields per row)
   *
   * Default: `"full"`
   */
  width?: "full" | "half";
  /**
   * Placeholder text shown in the input when empty.
   */
  placeholder?: string;
  /**
   * Helper text displayed below the field input.
   * Use for additional context or formatting hints.
   */
  description?: string;
}

/** Base metadata shared by all field types. */
export interface BaseFieldMeta {
  /** The field type identifier. */
  readonly type: string;
  /** Display label for the field in the admin form. */
  label?: string;
  /** Description text shown below the field. */
  description?: string;
  /**
   * Whether this field is required.
   *
   * Default: `false`
   */
  required?: boolean;
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfig;
}

/** Text field metadata. */
export interface TextFieldMeta extends BaseFieldMeta {
  readonly type: "text";
  /** Default value for new documents. */
  defaultValue?: string;
  /** Minimum character length. */
  minLength?: number;
  /** Maximum character length. */
  maxLength?: number;
}

/**
 * Options for the `text()` field builder.
 *
 * @example
 * ```
 * text({ label: "Title", required: true, maxLength: 200 })
 * ```
 */
export interface TextFieldOptions {
  /** Display label for the field. */
  label?: string;
  /** Description text shown below the field. */
  description?: string;
  /**
   * Whether this field is required.
   *
   * Default: `false`
   */
  required?: boolean;
  /** Default value for new documents. */
  defaultValue?: string;
  /** Minimum character length. */
  minLength?: number;
  /** Maximum character length. */
  maxLength?: number;
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfig;
}

/** Number field metadata. */
export interface NumberFieldMeta extends BaseFieldMeta {
  readonly type: "number";
  /** Default value for new documents. */
  defaultValue?: number;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  /** Step increment for the input. */
  step?: number;
}

/**
 * Options for the `number()` field builder.
 *
 * @example
 * ```
 * number({ label: "Price", min: 0, step: 0.01 })
 * ```
 */
export interface NumberFieldOptions {
  /** Display label for the field. */
  label?: string;
  /** Description text shown below the field. */
  description?: string;
  /**
   * Whether this field is required.
   *
   * Default: `false`
   */
  required?: boolean;
  /** Default value for new documents. */
  defaultValue?: number;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  /** Step increment for the input. */
  step?: number;
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfig;
}

/** Checkbox field metadata. */
export interface CheckboxFieldMeta extends BaseFieldMeta {
  readonly type: "checkbox";
  /** Default value for new documents. */
  defaultValue?: boolean;
}

/**
 * Options for the `checkbox()` field builder.
 *
 * @example
 * ```
 * checkbox({ label: "Published", defaultValue: false })
 * ```
 */
export interface CheckboxFieldOptions {
  /** Display label for the field. */
  label?: string;
  /** Description text shown below the field. */
  description?: string;
  /**
   * Default value for new documents.
   *
   * Default: `false`
   */
  defaultValue?: boolean;
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfig;
}

/**
 * A single option in a select field.
 */
export interface SelectOption<T extends string = string> {
  /** The stored value. */
  readonly value: T;
  /** The display label shown in the dropdown. */
  readonly label: string;
}

/** Select field metadata with typed options. */
export interface SelectFieldMeta<
  T extends string = string,
> extends BaseFieldMeta {
  readonly type: "select";
  /** The available options for this select field. */
  options: readonly SelectOption<T>[];
  /** Default value for new documents. */
  defaultValue?: T;
  /**
   * Allow selecting multiple values.
   *
   * Default: `false`
   */
  hasMany?: boolean;
}

/**
 * Options for the `select()` field builder.
 *
 * @example
 * ```
 * select({
 *   label: "Status",
 *   options: [
 *     { label: "Draft", value: "draft" },
 *     { label: "Published", value: "published" },
 *   ],
 *   defaultValue: "draft",
 * })
 * ```
 */
export interface SelectFieldOptions<T extends string> {
  /** Display label for the field. */
  label?: string;
  /** Description text shown below the field. */
  description?: string;
  /**
   * Whether this field is required.
   *
   * Default: `false`
   */
  required?: boolean;
  /** The available options for this select field. */
  options: readonly SelectOption<T>[];
  /** Default value for new documents. Must match one of the option values. */
  defaultValue?: T;
  /**
   * Allow selecting multiple values.
   *
   * Default: `false`
   */
  hasMany?: boolean;
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfig;
}

/** Union of all field metadata types. */
export type FieldMeta =
  | TextFieldMeta
  | NumberFieldMeta
  | CheckboxFieldMeta
  | SelectFieldMeta<string>;

/**
 * A VexField combines metadata with type information.
 * The generic `T` represents the TypeScript type this field resolves to.
 */
export interface VexField<
  T = unknown,
  TMeta extends BaseFieldMeta = BaseFieldMeta,
> {
  readonly _type: T;
  readonly _meta: TMeta;
}

/** Extract the TypeScript type from a VexField. */
export type InferFieldType<F> = F extends VexField<infer T, any> ? T : never;

/** Extract types from a record of fields into a document shape. */
export type InferFieldsType<F extends Record<string, VexField<any, any>>> = {
  [K in keyof F]: InferFieldType<F[K]>;
};
