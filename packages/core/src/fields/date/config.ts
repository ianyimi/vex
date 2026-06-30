import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import type { DateFieldInput, DateField } from "./types";

/**
 * Creates a date field with all defaults applied.
 *
 * Date fields store a Unix timestamp in milliseconds.
 * Common uses: published dates, expiry dates, event times, timestamps.
 *
 * Accepts {@link DateFieldInput} (all optional) and returns {@link DateField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `time.hidden` — `false` (time picker is visible)
 * - `time.use12HourFormat` — `true` (AM/PM format)
 * - `time.timePicker.hour` — `true`
 * - `time.timePicker.minute` — `true`
 * - `time.timePicker.second` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Date field configuration. All properties are optional.
 * @returns Resolved date field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { date, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Published At")
 *     publishedAt: date(),
 *
 *     // Required event date with a database index
 *     eventDate: date({ required: true, index: "by_event_date" }),
 *
 *     // Date-only picker (hide the time UI)
 *     expiresOn: date({ time: { hidden: true } }),
 *
 *     // Appointment in 24-hour format, shown in the sidebar
 *     appointmentAt: date({
 *       required: true,
 *       time: { use12HourFormat: false },
 *       admin: { position: "sidebar", width: "half" },
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link DateFieldInput} for the full input type
 * @see {@link DateField} for the resolved output type
 */
export function date<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>(
  options?: DateFieldInput<TFieldMeta>,
): DateField<TFieldMeta> {
  return {
    type: ADMIN_FIELDS.date.type,
    interfaceType: ADMIN_FIELDS.date.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.date.defaultValue,
    ...options,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },

    time: {
      hidden: false,
      use12HourFormat: true,
      ...options?.time,
      timePicker: {
        hour: true,
        minute: true,
        second: false,
        ...options?.time?.timePicker,
      },
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
