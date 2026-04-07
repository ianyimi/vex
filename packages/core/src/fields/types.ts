import { TextField } from "./text/types";

/**
 * Discriminated union of all field types in VexCMS.
 *
 * Switch on `field.type` to narrow to a specific field type and access
 * its type-specific properties.
 *
 * Currently includes:
 * - `TextField` — single-line text input
 *
 * More field types will be added as they're implemented.
 *
 * @example
 * ```ts
 * function handleField(field: AdminField) {
 *   switch (field.type) {
 *     case "text":
 *       // field is TextField
 *       break;
 *   }
 * }
 * ```
 */
export type AdminField = TextField;

/**
 * Props passed to custom field input components in the edit form.
 */
export interface InputComponentProps<TField extends AdminField = AdminField> {
  /** The field key name (e.g., `"title"`) */
  name: string;
  /** The resolved field definition for this field */
  fieldDef: TField;
  /** Whether the field is read-only from permissions or config */
  readOnly: boolean;
}

/**
 * Props passed to custom cell components in the data table list view.
 */
export interface CellComponentProps<TField extends AdminField = AdminField> {
  /** The raw value from the document */
  value: TField["defaultValue"];
  /** The full document row */
  row: Record<string, unknown>;
  /** The resolved field definition for this column */
  fieldDef: TField;
}
