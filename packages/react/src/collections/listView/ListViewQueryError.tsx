"use client";

import { extractVexErrorData } from "@vexcms/core";
import type { ReactNode } from "react";
import { Button } from "../../ui/button";

/** Props for {@link ListViewQueryError}. */
export interface ListViewQueryErrorProps {
  /**
   * The thrown/returned error — a `VexError`/`ConvexError` recovered via core's
   * `extractVexErrorData` (handles both a structured `.data` object and a local Convex dev
   * server's own diagnostic-string wrapping) with `code: "UNINDEXED_SORT"` (the
   * `resolveQueryIndex` validation) switching to that variant; a plain `{ code?, message? }` object
   * (never an `Error` instance — `CollectionListView`'s `initialQueryError` prop, the
   * zero-shift server prerender of this same state) is treated
   * identically; anything else (a plain `Error`, a `VexError`/`ConvexError` whose data
   * doesn't match either shape, or a different `.code`) renders the generic message.
   */
  error: unknown;
  /** Lowercase plural label, used in the generic message ("Couldn't load {plural}"). */
  collectionLabelPlural: string;
  onRetry: () => void;
  /** The field label a stale `sort` link was pointing at — shown in the `UNINDEXED_SORT` message. Omitted falls back to the raw field key from the error. */
  sortFieldLabel?: string;
  /** Clears the offending `sort` — only relevant (and only rendered) for the `UNINDEXED_SORT` variant. */
  onRemoveSort?: () => void;
}

/**
 * Reads a `{ code?, message? }` structured payload off `error` — a real `VexError`/
 * `ConvexError` (via core's `extractVexErrorData`, shared with `NextAdminPage.tsx`'s own
 * server-side extraction so the two can't drift) or a plain serializable object of that
 * same shape (the server's own `initialQueryError` prop, which can never carry a real
 * `Error`/`ConvexError` instance across the RSC boundary) — the one place
 * {@link ListViewQueryError} needs to tell either apart from an ordinary `Error`/unknown
 * thrown value.
 *
 * @param error - The value to inspect.
 * @returns The structured payload, or `undefined` for anything else (an `Error` instance included).
 */
function extractErrorData(error: unknown): { code?: string; message?: string } | undefined {
  const vexData = extractVexErrorData(error);
  if (vexData !== undefined) return vexData;
  if (!(error instanceof Error) && typeof error === "object" && error !== null && ("code" in error || "message" in error)) {
    return error as { code?: string; message?: string };
  }
  return undefined;
}

/**
 * The collection list's query-error states (DESIGN-NOTES.md §5): a generic
 * "Couldn't load {plural}" for any runtime failure, and a specific
 * "Can't sort by {Field} yet" for a stale link hitting the
 * `UNINDEXED_SORT` (config-time validation should make this rare, not
 * impossible — DEV-AGENT-BRIEF.md §5). Rendered by `DataTable` in place of
 * the table body.
 *
 * @param props - Component props. See {@link ListViewQueryErrorProps}.
 * @returns An `Alert`-based error block with a details disclosure.
 */
export function ListViewQueryError(props: ListViewQueryErrorProps): ReactNode {
  const data = extractErrorData(props.error);
  const isStructured = data !== undefined;
  const isUnindexedSort = data?.code === "UNINDEXED_SORT";
  const details = data?.message ?? String(props.error);

  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center"
    >
      {isUnindexedSort ? (
        <>
          <h3 className="font-medium">Can&apos;t sort by {props.sortFieldLabel ?? "this field"} yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Sorting on this column needs a database index that doesn&apos;t exist. Remove the sort
            to keep browsing, or ask a developer to add the index.
          </p>
          {props.onRemoveSort && <Button onClick={props.onRemoveSort}>Remove sort</Button>}
        </>
      ) : (
        <>
          <h3 className="font-medium">Couldn&apos;t load {props.collectionLabelPlural}</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Something went wrong running this query.
          </p>
          <Button onClick={props.onRetry}>Try again</Button>
        </>
      )}
      <details className="mt-2 max-w-sm text-left text-xs text-muted-foreground">
        <summary className="cursor-pointer">Developer details</summary>
        <p className="mt-1 break-words">
          {details}
          {isStructured && data?.code ? ` (${data.code})` : ""}
        </p>
      </details>
    </div>
  );
}
