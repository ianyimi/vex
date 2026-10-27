"use client";

import type { ReactNode } from "react";
import { formatDateFieldValue } from "../fields/date/utils";

/** `time` precision `DocumentTimestamps` renders its "Created at" value at — matches the injected `updatedAt` field (Interview Decision 3). */
const CREATED_AT_TIME = {
  hidden: false,
  use12HourFormat: true,
  timePicker: { hour: true, minute: true, second: true },
} as const;

/**
 * Read-only "Created at" shown in an edit view's sidebar for an existing
 * document — the counterpart to the regular, `admin.readOnly` `updatedAt`
 * field injected onto every collection/global (Interview Decision 3), but
 * sourced from `_creationTime` instead of a stored field.
 *
 * @param props.creationTime - The document's `_creationTime`, or `undefined`
 *   before the document exists (a global's first save, a brand-new row).
 * @returns The timestamp block, or `null` when `creationTime` is `undefined`.
 */
export function DocumentTimestamps(props: {
  creationTime: number | undefined;
}): ReactNode {
  if (props.creationTime === undefined) return null;
  return (
    <div className="space-y-1 rounded-sm border-2 border-border p-3 text-sm">
      <span className="text-muted-foreground">Created at</span>
      <p>
        {formatDateFieldValue({
          value: props.creationTime,
          time: CREATED_AT_TIME,
        })}
      </p>
    </div>
  );
}
