"use client";

import { extractVexErrorData } from "@vexcms/core";
import type { ReactNode } from "react";
import { Button } from "./button";

/** Props for {@link InlineQueryError}. */
export interface InlineQueryErrorProps {
  /**
   * The thrown/returned error — a `VexError`/`ConvexError` (read via core's
   * `extractVexErrorData`, same helper `ListViewQueryError` uses) or any other thrown/returned
   * value.
   */
  error: unknown;
  /** The generic message's subject, e.g. "this document", "shared views" — rendered as "Couldn't load {subject}." */
  subject: string;
  onRetry: () => void;
}

/**
 * Small, generic "Couldn't load X" + Retry block — the
 * collection/global/media edit views' own inline error state for a failed primary-document
 * fetch (permission denial, network failure — `useVexDocQuery`'s own `error` field; plain
 * `useQuery` never throws during render, so no error boundary is needed for this case, just
 * a conditional render), and the shared-view tab slot's "Couldn't load shared views" state
 * (rendered from a `QueryErrorBoundary` fallback instead, since `useSuspenseQuery` DOES
 * throw there).
 *
 * Deliberately simpler than `ListViewQueryError` (`collections/listView/ListViewQueryError.tsx`): no
 * `UNINDEXED_SORT`-specific copy or collection-plural wording, no `h-full` centered frame
 * (the caller decides its own wrapping/sizing) — reused wherever a query failure needs a
 * small, consistent "couldn't load, try again" block rather than the list table's own
 * larger, sort-aware one.
 *
 * @param props - {@link InlineQueryErrorProps}.
 * @returns An `alert`-role error block with a Retry button and a details disclosure.
 */
export function InlineQueryError(props: InlineQueryErrorProps): ReactNode {
  const data = extractVexErrorData(props.error);
  const details = data?.message ?? String(props.error);
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 p-6 text-center">
      <h3 className="font-medium">Couldn&apos;t load {props.subject}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">Something went wrong running this query.</p>
      <Button onClick={props.onRetry}>Try again</Button>
      <details className="mt-2 max-w-sm text-left text-xs text-muted-foreground">
        <summary className="cursor-pointer">Developer details</summary>
        <p className="mt-1 break-words">
          {details}
          {data?.code ? ` (${data.code})` : ""}
        </p>
      </details>
    </div>
  );
}
