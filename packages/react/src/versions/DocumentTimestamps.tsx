"use client";

import { useId, type ReactNode } from "react";
import { formatDateFieldValue } from "../fields/date/utils";

/** `time` precision `DocumentTimestamps` renders its "Created at" value at — matches the injected `updatedAt` field. */
const CREATED_AT_TIME = {
  hidden: false,
  use12HourFormat: true,
  timePicker: { hour: true, minute: true, second: true },
} as const;

/**
 * Read-only "Created at" shown in an edit view's sidebar for an existing
 * document — the counterpart to the regular, `admin.readOnly` `updatedAt`
 * field injected onto every collection/global, but
 * sourced from `_creationTime` instead of a stored field.
 *
 * @param props.creationTime - The document's `_creationTime`, or `undefined`
 *   before the document exists (a global's first save, a brand-new row).
 * @returns The timestamp block, or `null` when `creationTime` is `undefined`.
 */
export function DocumentTimestamps(props: {
  creationTime: number | undefined;
}): ReactNode {
  const labelId = useId();
  if (props.creationTime === undefined) return null;
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-disabled="true"
      data-disabled="true"
      className="group/field space-y-1 rounded-sm border-2 border-border p-3 text-sm"
    >
      <span
        id={labelId}
        className="text-muted-foreground group-data-[disabled=true]/field:opacity-50"
      >
        Created at
      </span>
      <p className="group-data-[disabled=true]/field:opacity-50">
        {formatDateFieldValue({
          value: props.creationTime,
          time: CREATED_AT_TIME,
        })}
      </p>
    </div>
  );
}
