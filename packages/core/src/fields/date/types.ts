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
 *   time: {
 *     hidden:         false, // time picker is visible alongside the calendar
 *     use12HourFormat: true, // AM/PM format (set false for 24-hour)
 *     timePicker: {
 *       hour:   true,  // hour selector shown
 *       minute: true,  // minute selector shown
 *       second: false, // seconds hidden
 *     },
 *   },
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
 * // Appointment with 24-hour format and seconds hidden (overrides defaults)
 * appointmentAt: date({
 *   required: true,
 *   time: { use12HourFormat: false },
 * })
 *
 * // Date-only picker (hide the time UI entirely)
 * expiresOn: date({ time: { hidden: true } })
 *
 * // Pre-filled default (Unix ms timestamp for 2025-01-01T00:00:00Z)
 * startsAt: date({ defaultValue: 1735689600000 })
 * ```
 *
 * @see {@link DateField} for the resolved type after defaults are applied
 * @see {@link date} for the config function that applies defaults
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`)
 */
export interface DateFieldInput<
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TFieldMeta> {
  /**
   * Pre-filled Unix timestamp (milliseconds) shown in the admin form when creating a new document.
   * Does not apply to existing database values.
   */
  defaultValue?: number | undefined;
  /** Minimum allowed Unix timestamp (milliseconds). Validated in the input schema. */
  min?: number;
  /** Maximum allowed Unix timestamp (milliseconds). Validated in the input schema. */
  max?: number;
  /**
   * Date/time picker display configuration. Each key is optional — omitted keys
   * fall back to the defaults applied by `date()`. The `time` object is always
   * fully resolved on `DateField` after defaults are merged.
   */
  time?: {
    /**
     * Hide the time-of-day picker, showing only the calendar date selector.
     *
     * Default: `false` (time picker is visible)
     */
    hidden?: boolean;
    /**
     * Display time in 12-hour AM/PM format instead of 24-hour.
     *
     * Default: `true`
     */
    use12HourFormat?: boolean;
    /**
     * Control which time units are shown in the time picker.
     * Each unit defaults to `true` for `hour` and `minute`, `false` for `second`.
     */
    timePicker?: {
      /** Show the hour selector. Default: `true`. */
      hour: boolean;
      /** Show the minute selector. Default: `true`. */
      minute: boolean;
      /** Show the seconds selector. Default: `false`. */
      second: boolean;
    };
  };
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
export interface DateField<TFieldMeta extends {} = {}> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.date.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Pre-filled Unix timestamp (milliseconds) shown in the admin form when creating a new document. */
  defaultValue: number | undefined;
  /** Minimum allowed Unix timestamp (milliseconds). */
  min?: number;
  /** Maximum allowed Unix timestamp (milliseconds). */
  max?: number;
  /**
   * Resolved date/time picker display configuration — all keys always present after defaults are applied.
   *
   * @see {@link DateFieldInput} for the user-facing input type where each key is optional
   */
  time: {
    /** Whether the time-of-day picker is hidden, leaving only the calendar date selector. */
    hidden: boolean;
    /** Whether time is displayed in 12-hour AM/PM format (`true`) or 24-hour format (`false`). */
    use12HourFormat: boolean;
    /** Which time unit selectors are shown in the time picker. */
    timePicker: {
      /** Whether the hour selector is shown. */
      hour: boolean;
      /** Whether the minute selector is shown. */
      minute: boolean;
      /** Whether the seconds selector is shown. */
      second: boolean;
    };
  };
}
