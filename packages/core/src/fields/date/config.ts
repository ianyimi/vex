import { ADMIN_FIELDS } from "../constants";
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
 * - `time` — `false` (date-only picker; set `true` to show a time-of-day picker)
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
 *     // Appointment with time-of-day picker enabled
 *     appointmentAt: date({
 *       required: true,
 *       time: true,
 *       admin: { width: "half" },
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link DateFieldInput} for the full input type
 * @see {@link DateField} for the resolved output type
 */
export function date(options?: DateFieldInput): DateField {
  return {
    type: ADMIN_FIELDS.date.type,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.date.defaultValue,
    time: false,
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
      description: "",
      ...options?.admin,
    },

    // Optional field properties (no defaults)
    description: options?.description,
    index: options?.index,
    searchIndex: options?.searchIndex,
  };
}
