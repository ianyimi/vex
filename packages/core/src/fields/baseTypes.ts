/**
 * Content alignment for data table cells.
 */
export type Alignment = "left" | "right" | "center";

/**
 * Labels for items saved in numbers, collections, blocks, etc
 */
export type Labels = {
  singular: string;
  plural: string;
};

/**
 * Higher-kinded type interface for framework-specific component constructors.
 *
 * Frameworks implement this to map a props type to their component type.
 *
 * @example
 * ```ts
 * interface ReactHKT extends ComponentHKT {
 *   component: React.ComponentType<this['_props']>;
 * }
 * ```
 */
export interface ComponentHKT {
  readonly _props: unknown;
  readonly _extra: Record<string, unknown>;
  readonly component: unknown;
}

/**
 * Applies a ComponentHKT to specific props, resolving to the framework's component type.
 */
export type ApplyComponent<
  F extends ComponentHKT,
  P,
  E extends Record<string, unknown> = Record<string, never>,
> = (F & { readonly _props: P; readonly _extra: E })["component"];

/**
 * Opaque runtime shape stored in the field config for a custom component.
 * Created via a framework-specific factory (e.g. `fieldComponent()` in `@vex/react`).
 */
export type ComponentEntry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
  component: (props: any) => unknown;
  props: Record<string, unknown>;
};

/**
 * Configuration input for a field's admin panel behavior.
 *
 * Controls how the field appears and behaves in the admin UI — visibility,
 * layout, input styling, and data table presentation. All properties are
 * optional; unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by field config functions** (e.g., `text()`, `number()`):
 * ```ts
 * {
 *   hidden:        false,   // field is visible in the admin form
 *   readOnly:      false,   // field is editable by default
 *   position:      "main",  // placed in the main content column, not the sidebar
 *   width:         "full",  // spans the full form width, not half
 *   cellAlignment: "left",  // text aligned left in data table cells
 * }
 * ```
 *
 * @example
 * ```ts
 * // Basic usage — all defaults applied
 * title: text({ admin: { width: "half" } })
 *
 * // Sidebar metadata field
 * publishedAt: date({
 *   admin: {
 *     position: "sidebar",
 *     description: "Scheduled publish time"
 *   }
 * })
 *
 * // Read-only computed field
 * createdAt: date({
 *   required: true,
 *   admin: { readOnly: true, hidden: false }
 * })
 *
 * // Right-aligned number column in table
 * price: number({
 *   admin: {
 *     cellAlignment: "right",
 *     placeholder: "0.00"
 *   }
 * })
 * ```
 *
 * @see {@link FieldAdminConfig} for the resolved type after defaults are applied
 */
export interface FieldAdminConfigInput {
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

/**
 * Resolved admin configuration for a field, returned after defaults are applied.
 *
 * Properties with defaults (`hidden`, `readOnly`, `position`, `width`, `cellAlignment`)
 * are always present. Properties that are meaningless when absent (`placeholder`,
 * `description`) remain optional — `undefined` means the user did not configure them.
 *
 * @see {@link FieldAdminConfigInput} for the user-facing input type
 */
export interface FieldAdminConfig {
  /** Whether the field is hidden from the admin form. */
  hidden: boolean;
  /** Whether the field is read-only in the admin form. */
  readOnly: boolean;
  /** Position of the field in the form layout — `"main"` or `"sidebar"`. */
  position: "main" | "sidebar";
  /** Width of the field within its row — `"full"` or `"half"`. */
  width: "full" | "half";
  /** Text alignment for this field's column in the data table. */
  cellAlignment: Alignment;
  /** Placeholder text shown in the input when empty. */
  placeholder?: string;
  /** Helper text displayed below the field input. */
  description?: string;
}

/**
 * Properties shared by all field types.
 *
 * Every field type (text, number, checkbox, etc.) extends this interface
 * with its own `type` discriminant and type-specific options. These base
 * properties control labeling, validation, admin UI behavior, and database
 * indexing.
 *
 * **Defaults applied by field config functions:**
 * ```ts
 * {
 *   label:    "",     // inferred from the field key by defineCollection
 *   required: false,  // field is optional in the database schema
 *   admin:    { ... } // see FieldAdminConfigInput for admin defaults
 * }
 * ```
 *
 * @see {@link BaseField} for the resolved type after defaults are applied
 */
export interface BaseFieldInput {
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
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   */
  defaultValue?: unknown;
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfigInput;
  /**
   * Create a database index on this field.
   * The string value becomes the index name in Convex.
   *
   * @example
   * ```ts
   * slug: { type: "text", index: "by_slug", required: true }
   * // Generates: .index("by_slug", ["slug"])
   * ```
   */
  index?: string;
}

/**
 * Resolved base field definition, after defaults are applied by the field config function.
 *
 * Properties with defaults are always present. Properties that are meaningless
 * when absent (`description`, `index`, `searchIndex`) remain optional.
 *
 * @see {@link BaseFieldInput} for the user-facing input type
 */
export interface BaseField {
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   */
  defaultValue: unknown;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Description shown below the field in the admin form. */
  description?: string;
  /** Convex index name for this field. */
  index?: string;
  /** TypeScript type string written to generated document interfaces (e.g. `"string"`, `"number"`, `"string[]"`). */
  interfaceType: string;
}
