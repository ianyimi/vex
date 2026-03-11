// =============================================================================
// FIELD TYPES
// =============================================================================

/** Content alignment for data table cells. */
export type Alignment = "left" | "right" | "center";

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
  /**
   * Content alignment in data table cells. 'left' | 'right' | 'center'
   */
  cellAlignment?: Alignment;
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
  /**
   * Create a database index on this field.
   * The string value becomes the index name in Convex.
   *
   * @example
   * ```ts
   * slug: text({ index: "by_slug", required: true })
   * // Generates: .index("by_slug", ["slug"])
   * ```
   */
  index?: string;
  /**
   * Create a full-text search index on this field.
   * The field this is defined on becomes the `searchField`.
   *
   * @example
   * ```ts
   * title: text({
   *   searchIndex: { name: "search_title", filterFields: ["status", "author"] },
   * })
   * // Generates: .searchIndex("search_title", { searchField: "title", filterFields: ["status", "author"] })
   * ```
   */
  searchIndex?: {
    /** Search index name (must be unique within the collection). */
    name: string;
    /**
     * Fields to filter search results by.
     * String array — validated at runtime against collection field names.
     */
    filterFields: string[];
  };
}

/**
 * Base options shared by all field builders.
 * Each specific field options interface extends this.
 */
export interface BaseFieldOptions {
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
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfig;
  /**
   * Create a database index on this field.
   * The string value becomes the index name in Convex.
   *
   * @example
   * ```ts
   * slug: text({ index: "by_slug", required: true })
   * // Generates: .index("by_slug", ["slug"])
   * ```
   */
  index?: string;
  /**
   * Create a full-text search index on this field.
   * The field this is defined on becomes the `searchField`.
   *
   * @example
   * ```ts
   * title: text({
   *   searchIndex: { name: "search_title", filterFields: ["status", "author"] },
   * })
   * // Generates: .searchIndex("search_title", { searchField: "title", filterFields: ["status", "author"] })
   * ```
   */
  searchIndex?: {
    /** Search index name (must be unique within the collection). */
    name: string;
    /**
     * Fields to filter search results by.
     * String array — validated at runtime against collection field names.
     */
    filterFields: string[];
  };
}

/** Text field metadata. */
export interface TextFieldMeta extends BaseFieldMeta {
  readonly type: "text";
  /** Default value for new documents. */
  defaultValue?: string;
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: string;
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
export interface TextFieldOptions extends BaseFieldOptions {
  /** Default value for new documents. */
  defaultValue?: string;
  /** Minimum character length. */
  minLength?: number;
  /** Maximum character length. */
  maxLength?: number;
}

/** Number field metadata. */
export interface NumberFieldMeta extends BaseFieldMeta {
  readonly type: "number";
  /** Default value for new documents. */
  defaultValue?: number;
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: number;
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
export interface NumberFieldOptions extends BaseFieldOptions {
  /** Default value for new documents. */
  defaultValue?: number;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  /** Step increment for the input. */
  step?: number;
}

/** Checkbox field metadata. */
export interface CheckboxFieldMeta extends BaseFieldMeta {
  readonly type: "checkbox";
  /** Default value for new documents. */
  defaultValue?: boolean;
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: boolean;
}

/**
 * Options for the `checkbox()` field builder.
 *
 * @example
 * ```
 * checkbox({ label: "Published", defaultValue: false })
 * ```
 */
export interface CheckboxFieldOptions extends BaseFieldOptions {
  /**
   * Default value for new documents.
   *
   * Default: `false`
   */
  defaultValue?: boolean;
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
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: T | T[];
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
export interface SelectFieldOptions<T extends string> extends BaseFieldOptions {
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
}

/** Date field metadata. Stores epoch milliseconds. */
export interface DateFieldMeta extends BaseFieldMeta {
  readonly type: "date";
  /** Default value for new documents (epoch ms). */
  defaultValue?: number;
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: number;
}

/**
 * Options for the `date()` field builder.
 *
 * @example
 * ```
 * date({ label: "Created At", required: true, defaultValue: 0 })
 * ```
 */
export interface DateFieldOptions extends BaseFieldOptions {
  /** Default value for new documents (epoch ms). */
  defaultValue?: number;
}

/** Image URL field metadata. Stores a URL string, renders as thumbnail. */
export interface ImageUrlFieldMeta extends BaseFieldMeta {
  readonly type: "imageUrl";
  /** Default value for new documents. */
  defaultValue?: string;
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: string;
  /** Width (px) of the image */
  width?: number;
  /** Height (px) of the image */
  height?: number;
}

/**
 * Options for the `imageUrl()` field builder.
 *
 * @example
 * ```
 * imageUrl({ label: "Avatar" })
 * ```
 */
export interface ImageUrlFieldOptions extends BaseFieldOptions {
  /** Default value for new documents. */
  defaultValue?: string;
  /** Width (px) of the image */
  width?: number;
  /** Height (px) of the image */
  height?: number;
}

/** Relationship field metadata. References another table via `v.id()`. */
export interface RelationshipFieldMeta extends BaseFieldMeta {
  readonly type: "relationship";
  /** Target table name. */
  to: string;
  /**
   * Allow multiple references.
   *
   * Default: `false`
   */
  hasMany?: boolean;
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: string | string[];
}

/**
 * Options for the `relationship()` field builder.
 *
 * @example
 * ```
 * relationship({ to: "users", required: true })
 * relationship({ to: "tags", hasMany: true })
 * ```
 */
export interface RelationshipFieldOptions extends BaseFieldOptions {
  /** Target table name. */
  to: string;
  /**
   * Allow multiple references.
   *
   * Default: `false`
   */
  hasMany?: boolean;
}

/** JSON field metadata. Stores arbitrary data via `v.any()`. */
export interface JsonFieldMeta extends BaseFieldMeta {
  readonly type: "json";
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: Record<string, unknown>;
}

/**
 * Options for the `json()` field builder.
 *
 * @example
 * ```
 * json({ label: "Metadata" })
 * ```
 */
export interface JsonFieldOptions extends BaseFieldOptions {}

/** Array field metadata. Wraps an inner field in `v.array()`. */
export interface ArrayFieldMeta extends BaseFieldMeta {
  readonly type: "array";
  /** The inner field type for array elements. */
  field: VexField;
  /** Minimum number of items. */
  min?: number;
  /** Maximum number of items. */
  max?: number;
  /** Zero-value used as the initial form value when creating a new document. */
  formDefaultValue: unknown[];
}

/**
 * Options for the `array()` field builder.
 *
 * @example
 * ```
 * array({ field: text(), min: 1, max: 10 })
 * ```
 */
export interface ArrayFieldOptions extends BaseFieldOptions {
  /** The inner field type for array elements. */
  field: VexField;
  /** Minimum number of items. */
  min?: number;
  /** Maximum number of items. */
  max?: number;
}

/** Union of all field metadata types. Discriminated on `type`. */
export type FieldMeta =
  | TextFieldMeta
  | NumberFieldMeta
  | CheckboxFieldMeta
  | SelectFieldMeta<string>
  | DateFieldMeta
  | ImageUrlFieldMeta
  | RelationshipFieldMeta
  | JsonFieldMeta
  | ArrayFieldMeta;

/**
 * Generic field definition interface. Combines metadata with type information.
 * The generic `T` represents the TypeScript type this field resolves to.
 *
 * Used by field builders to return specifically-typed fields,
 * and as the constraint for generic type parameters.
 *
 * For consuming code that switches on `_meta.type`, use `VexField` instead
 * (the discriminated union) which provides automatic type narrowing.
 */
export interface GenericVexField<
  T = unknown,
  TMeta extends BaseFieldMeta = BaseFieldMeta,
> {
  readonly _type: T;
  readonly _meta: TMeta;
}

/**
 * Discriminated union of all concrete field variants.
 * Switch on `field._meta.type` to narrow the meta type automatically.
 *
 * @example
 * ```ts
 * function handle(field: VexField) {
 *   switch (field._meta.type) {
 *     case "text":
 *       field._meta.maxLength; // TextFieldMeta ✓
 *       break;
 *     case "select":
 *       field._meta.options;   // SelectFieldMeta ✓
 *       break;
 *   }
 * }
 * ```
 */
export type VexField =
  | GenericVexField<string, TextFieldMeta>
  | GenericVexField<number, NumberFieldMeta>
  | GenericVexField<boolean, CheckboxFieldMeta>
  | GenericVexField<string, SelectFieldMeta<string>>
  | GenericVexField<string[], SelectFieldMeta<string>>
  | GenericVexField<number, DateFieldMeta>
  | GenericVexField<string, ImageUrlFieldMeta>
  | GenericVexField<string, RelationshipFieldMeta>
  | GenericVexField<unknown, JsonFieldMeta>
  | GenericVexField<unknown[], ArrayFieldMeta>;

/** Extract the TypeScript type from a GenericVexField. */
export type InferFieldType<F> =
  F extends GenericVexField<infer T, any> ? T : never;

/** Extract types from a record of fields into a document shape. */
export type InferFieldsType<F extends Record<string, VexField>> = {
  [K in keyof F]: InferFieldType<F[K]>;
};
