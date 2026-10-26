import { format } from "date-fns";
import type { DateField } from "@vexcms/core";

/**
 * Formats a date field's Unix-ms value for display — used by the data-table
 * cell and anywhere else a `DateField` value needs a human-readable string.
 *
 * Date-only when `time.hidden`. Otherwise date+time, 12-hour (`h:mm a`) or
 * 24-hour (`HH:mm`) per `time.use12HourFormat`, with `:ss` appended —
 * before the AM/PM marker in 12-hour format — when `time.timePicker.second`.
 *
 * @param props.value - Unix timestamp in milliseconds.
 * @param props.time - The field's resolved `time` config (`DateField["time"]`).
 * @returns The formatted date string.
 *
 * @example
 * ```ts
 * formatDateFieldValue({
 *   value: Date.UTC(2025, 5, 15, 14, 30),
 *   time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } },
 * });
 * // → "Jun 15, 2025 2:30 PM"
 * ```
 */
export function formatDateFieldValue(props: { value: number; time: DateField["time"] }): string {
  const date = new Date(props.value);
  if (props.time.hidden) {
    return format(date, "MMM d, yyyy");
  }
  const timeFormat = props.time.use12HourFormat
    ? props.time.timePicker.second
      ? "h:mm:ss a"
      : "h:mm a"
    : props.time.timePicker.second
      ? "HH:mm:ss"
      : "HH:mm";
  return format(date, `MMM d, yyyy ${timeFormat}`);
}
