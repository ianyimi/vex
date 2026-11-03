"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, VexDocument, VexGetArgs } from "@vexcms/core";
import type { FunctionReference } from "convex/server";

/**
 * Props for {@link useVexDocQuery}.
 *
 * @typeParam TDocument - The document shape returned for `collection`.
 * @typeParam TCollectionSlug - Collection slug type.
 */
export interface UseVexDocQueryProps<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** The collection slug the document belongs to. */
  collection: TCollectionSlug;
  /** The document's `_id`. `undefined` behaves like `skip: true`. */
  id: TDocument["_id"] | undefined;
  /**
   * Include the document's draft row alongside its published row, gated
   * server-side on `readDrafts`. Ignored for a non-versioned collection.
   */
  drafts?: boolean;
  /** When `true`, the query is not issued at all — a conditional fetch without violating the Rules of Hooks. */
  skip?: boolean;
  /**
   * Seed data the hook renders immediately, before its own query resolves.
   * Two callers use this: an SSR-prefetched document (`CollectionEditView`),
   * and the Inspect peek (Step 13), which passes the row it already has from
   * `useVexListQuery`'s `results` so the panel opens instantly and this
   * hook's own subscription only takes over once it resolves (Design
   * Decision 27). `null` means "confirmed not found"; `undefined` means
   * "not loaded yet, use the live query".
   */
  initialData?: TDocument | null;
}

/** Return value of {@link useVexDocQuery}. */
export interface UseVexDocQueryReturn<TDocument extends VexDocument = VexDocument> {
  /** The document, `null` when none matches `id`, `undefined` before the first load (or while skipped). */
  document: TDocument | null | undefined;
  /** Whether the query is still in flight with no cached/initial data yet. */
  isPending: boolean;
  /**
   * The query's own error, if its last attempt failed — most commonly a `VexAccessError`
   * (unreadable document: `get` throws rather than returning `null`, which is reserved for
   * genuine not-found). `undefined` while pending/successful. Plain `useQuery` never
   * rethrows on render (polish fixes, Decision 1/2) — the caller (`ListViewPeek`, the
   * collection/global/media edit views) is responsible for checking this and rendering its
   * own inline error state with Retry; `document` stays `undefined` alongside a set `error`,
   * so a caller that only checks `document` degrades to a blank/not-found-looking view
   * instead of silently showing nothing with no explanation — check `error` first.
   */
  error: Error | undefined;
  /** Re-issues the query — wire directly to an error state's Retry button. */
  refetch: () => void;
}

/**
 * Fetches a single document by id and collection — the data source every
 * edit view (and the Inspect peek) reads through (Design Decision 19), live
 * via a Convex subscription.
 *
 * Queries the generic `vexConvexApi.get` endpoint directly rather than the
 * per-slug `get()` client wrapper (`collections/api/get/client.ts`): this
 * hook is generic over `TCollectionSlug`, known only at runtime, so the
 * literal-slug narrowing that wrapper provides from a compile-time slug
 * does not apply here — the caller asserts the returned shape via
 * `TDocument` instead, the same way `CollectionEditView`'s two direct
 * `vexConvexApi.get` calls did before this hook existed.
 *
 * @typeParam TDocument - The document shape returned for `collection`.
 * @typeParam TCollectionSlug - Collection slug type.
 * @param props - Hook configuration.
 * @returns The document, its loading state, its error (if the last attempt failed — check
 *   this before treating a missing `document` as "not found", since an unreadable document
 *   also leaves `document` `undefined`), and a `refetch` to wire to a Retry button.
 *
 * @example
 * ```tsx
 * const { document, error, isPending, refetch } = useVexDocQuery({
 *   collection: "posts",
 *   id: documentId,
 *   drafts: true,
 *   initialData: props.initialData,
 * });
 * if (error) return <InlineQueryError error={error} subject="this document" onRetry={refetch} />;
 * ```
 */
export function useVexDocQuery<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: UseVexDocQueryProps<TDocument, TCollectionSlug>): UseVexDocQueryReturn<TDocument> {
  const funcRef = vexConvexApi.get as FunctionReference<
    "query",
    "public",
    VexGetArgs,
    TDocument | null
  >;
  const skip = props.skip === true || props.id === undefined;
  const { data, isPending, error, refetch } = useQuery({
    ...convexQuery(
      funcRef,
      skip
        ? "skip"
        : { id: props.id as string, collection: props.collection, drafts: props.drafts },
    ),
    ...(props.initialData !== undefined ? { initialData: props.initialData } : {}),
  });
  return { document: data, isPending, error: error ?? undefined, refetch: () => void refetch() };
}

/** Props for {@link useSuspenseVexDocQuery} — `id` is REQUIRED (unlike {@link useVexDocQuery}'s `skip`-able `id`), since a suspended component has no "skip" state: the caller decides whether to mount it at all. */
export interface UseSuspenseVexDocQueryProps<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** The collection slug the document belongs to. */
  collection: TCollectionSlug;
  /** The document's `_id`. */
  id: TDocument["_id"];
  /** Include the document's draft row alongside its published row, gated server-side on `readDrafts`. Ignored for a non-versioned collection. */
  drafts?: boolean;
  /**
   * Seed data a server prefetch already dehydrated (or a direct, non-streamed caller already
   * has) — resolves synchronously with no suspension when present, the same `initialData`
   * contract {@link useVexDocQuery} has, just via `useSuspenseQuery`'s own `initialData`
   * option instead of `useQuery`'s.
   */
  initialData?: TDocument | null;
}

/**
 * The `<Suspense>`-driven sibling of {@link useVexDocQuery} — same `convexQuery(vexConvexApi.get,
 * ...)` key shape (a server prefetch+dehydrate for this exact `id`/`collection`/`drafts`
 * combination is picked up automatically, no `initialData` prop needed from that caller), but
 * via `useSuspenseQuery`, so the component mounting this one SUSPENDS (and the nearest
 * `<Suspense>` boundary's fallback shows) until the document resolves, INCLUDING during the
 * server's own SSR render pass — unlike a plain `useQuery`, which commits "pending" to the SSR'd
 * HTML permanently if the server's prefetch hasn't settled yet by render time (confirmed live,
 * `SavedListViewTabs`'s own hydration-mismatch investigation: a plain `useQuery` doesn't integrate
 * with React's SSR streaming/Suspense resumption at all). Only call this from a component that's
 * ALREADY conditionally mounted on "there is a real `id` to fetch" — unlike `useVexDocQuery`,
 * there is no `skip`/`id: undefined` escape hatch here (Suspense has no "skipped" state).
 *
 * An UNREADABLE document (permission denied) does NOT resolve to `null` — `get` throws a
 * `VexAccessError` server-side for that case (`null` is reserved for genuine not-found), and
 * `useSuspenseQuery` rethrows a dehydrated/live error during render (polish fixes, Decision
 * 1/2, corrected from this doc comment's own earlier, wrong claim that it resolved to
 * `null`). The caller MUST wrap this in an error boundary (e.g. `QueryErrorBoundary`) to
 * degrade gracefully instead of crashing the whole page — see `ListViewPeek.tsx`'s own usage.
 *
 * @typeParam TDocument - The document shape returned for `collection`.
 * @typeParam TCollectionSlug - Collection slug type.
 * @param props - {@link UseSuspenseVexDocQueryProps}.
 * @returns The resolved document — `null` only for genuine not-found, never `undefined`
 *   (suspension itself stands in for "not yet resolved"). Throws (does not return) for an
 *   unreadable document — catch it with an error boundary, don't check for `null`.
 */
export function useSuspenseVexDocQuery<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: UseSuspenseVexDocQueryProps<TDocument, TCollectionSlug>): TDocument | null {
  const funcRef = vexConvexApi.get as FunctionReference<
    "query",
    "public",
    VexGetArgs,
    TDocument | null
  >;
  const { data } = useSuspenseQuery({
    ...convexQuery(funcRef, { id: props.id as string, collection: props.collection, drafts: props.drafts }),
    ...(props.initialData !== undefined ? { initialData: props.initialData } : {}),
  });
  return data;
}
