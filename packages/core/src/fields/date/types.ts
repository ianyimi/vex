import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig } from "../baseTypes";

/**
 * Configuration input for a `date()` field.
 *
 * Date fields store a Unix timestamp in milliseconds — event dates, publish
 * dates, expiry times, etc. All properties are optional; unset properties fall
 * back to the defaults listed below.
 *
 * **Defaults applied by `date()`:**
 * ```ts
 * {
 *   type:     "date",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   time:     false,    // date-only picker; set true to show a time-of-day picker
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Published At")
 * publishedAt: date()
 *
 * // Required event date with a database index
 * eventDate: date({ required: true, index: "by_event_date" })
 *
 * // Appointment with time-of-day picker enabled
 * appointmentAt: date({ required: true, time: true })
 *
 * // Pre-filled default (Unix ms timestamp for 2025-01-01T00:00:00Z)
 * startsAt: date({ defaultValue: 1735689600000 })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface DateFieldInput extends BaseFieldInput {
  /**
   * Pre-filled Unix timestamp (milliseconds) shown in the admin form when creating a new document.
   * Does not apply to existing database values.
   */
  defaultValue?: number | undefined;
  /** Whether the time-of-day picker is shown alongside the calendar. */
  time?: boolean;
}

/**
 * Resolved configuration for a `date()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<DateField>` and `CellComponentProps<DateField>`
 * is this type.
 *
 * @see {@link DateFieldInput} for the user-facing input type
 * @see {@link date} for the config function that produces this type
 */
export interface DateField extends BaseField {
  readonly type: typeof ADMIN_FIELDS.date.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Pre-filled Unix timestamp (milliseconds) shown in the admin form when creating a new document. */
  defaultValue: number | undefined;
  /** Whether the time-of-day picker is shown alongside the calendar in the admin form. */
  time: boolean;
}
