import { formatDistanceToNow } from "date-fns";
import { formatDateFieldValue } from "../date/utils";
import type { CommitTsFieldAdminFormat } from "@vexcms/core";

/**
 * Formats a `commitTs` field's ms value for display, per `admin.format`.
 *
 * @param props.value - Unix timestamp in milliseconds (already converted
 *   from Convex's resolved ns `bigint` by `find`/`get`/`search`).
 * @param props.format - The field's resolved `admin.format`.
 * @returns The formatted string.
 */
export function formatCommitTsFieldValue(props: { value: number; format: CommitTsFieldAdminFormat }): string {
  const date = new Date(props.value);
  if (props.format === "relative") return formatDistanceToNow(date, { addSuffix: true });
  if (props.format === "date") return formatDateFieldValue({ value: props.value, time: { hidden: true, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } } });
  return formatDateFieldValue({ value: props.value, time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } } });
}

/**
 * Formats a timestamp for the tooltip — always the full `"datetime"`-formatted
 * string with seconds, regardless of the field's configured `format`.
 *
 * @param value - Unix timestamp in milliseconds.
 * @returns The full datetime-formatted string.
 */
export function commitTsTooltipValue(value: number): string {
  return formatDateFieldValue({ value, time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: true } } });
}
