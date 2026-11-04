"use client";

import { Component, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

/** Props {@link QueryErrorBoundary}'s `fallbackRender` receives. */
export interface QueryErrorFallbackProps {
  /** The error the wrapped subtree threw during render. */
  error: unknown;
  /** Clears both the caught error AND the offending query's own cached error state (via `QueryErrorResetBoundary`), then re-renders the wrapped subtree — a retry, not a full remount. */
  resetErrorBoundary: () => void;
}

interface QueryErrorBoundaryInnerProps {
  children: ReactNode;
  onReset: () => void;
  fallbackRender: (props: QueryErrorFallbackProps) => ReactNode;
}

interface QueryErrorBoundaryInnerState {
  error: { value: unknown } | undefined;
}

/**
 * React has no hook equivalent for catching a render-time throw — this is the one place a
 * class component is still required. Not exported: always used through
 * {@link QueryErrorBoundary}, which pairs it with `QueryErrorResetBoundary` (below).
 */
class QueryErrorBoundaryInner extends Component<QueryErrorBoundaryInnerProps, QueryErrorBoundaryInnerState> {
  state: QueryErrorBoundaryInnerState = { error: undefined };

  static getDerivedStateFromError(error: unknown): QueryErrorBoundaryInnerState {
    return { error: { value: error } };
  }

  // Wrapped in `{ value: error }` rather than storing `error` directly (which could itself be
  // `undefined` — e.g. a thrown `undefined` — making the "is there a caught error" check
  // ambiguous against the reset state).
  resetErrorBoundary = (): void => {
    this.props.onReset();
    this.setState({ error: undefined });
  };

  render(): ReactNode {
    if (this.state.error !== undefined) {
      return this.props.fallbackRender({
        error: this.state.error.value,
        resetErrorBoundary: this.resetErrorBoundary,
      });
    }
    return this.props.children;
  }
}

/** Props for {@link QueryErrorBoundary}. */
export interface QueryErrorBoundaryProps {
  children: ReactNode;
  /**
   * Renders the region's own fallback UI for a caught error — e.g. the table's
   * `ListViewQueryError`, the peek panel's "Can't show this document", or a shared-view tab
   * slot's "Couldn't load shared views · Retry". Reserve the SAME frame (height/width) the
   * settled content would occupy — zero layout shift, same discipline the Suspense fallback
   * for the same region already follows.
   */
  fallbackRender: (props: QueryErrorFallbackProps) => ReactNode;
}

/**
 * Shared error boundary for the admin panel's streamed query regions — a region whose
 * `useSuspenseQuery` throws (a dehydrated `"error"`-status
 * query, e.g. a stale `?sort=` link's `UNINDEXED_SORT`, or an unreadable `?peek=`/shared-view
 * id) renders `fallbackRender`'s own region-specific UI instead of crashing the whole page.
 *
 * Wraps TanStack Query's own `QueryErrorResetBoundary` (forgets the offending query's cached
 * error state, so the next render attempt genuinely refetches instead of synchronously
 * rethrowing the same stale error again) around a class-based error boundary — React ships
 * no hook equivalent for catching a render-time throw. Place this immediately around the
 * `<Suspense>` boundary whose content might throw (NOT around unrelated siblings — e.g. the
 * table's own toolbar, or the tab strip's non-shared tabs, must stay OUTSIDE this boundary so
 * a failure in one region never takes them down too).
 *
 * @param props - {@link QueryErrorBoundaryProps}.
 * @returns `children`, or `fallbackRender`'s own UI once `children` has thrown.
 *
 * @example
 * ```tsx
 * <QueryErrorBoundary
 *   fallbackRender={({ error, resetErrorBoundary }) => (
 *     <DataTable data={[]} columns={columnsWithActions} queryError={
 *       <ListViewQueryError error={error} collectionLabelPlural="posts" onRetry={resetErrorBoundary} />
 *     } />
 *   )}
 * >
 *   <Suspense fallback={<DataTable data={[]} columns={columnsWithActions} isPending />}>
 *     <CollectionListViewData {...props} />
 *   </Suspense>
 * </QueryErrorBoundary>
 * ```
 */
export function QueryErrorBoundary(props: QueryErrorBoundaryProps): ReactNode {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <QueryErrorBoundaryInner onReset={reset} fallbackRender={props.fallbackRender}>
          {props.children}
        </QueryErrorBoundaryInner>
      )}
    </QueryErrorResetBoundary>
  );
}
