"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import {
  getCollectionInputSchema,
  LIVE_PREVIEW_COOKIE,
  LIVE_PREVIEW_ID_PARAM,
  LIVE_PREVIEW_QUERY_PARAM,
  type CollectionConfig,
  type CollectionSlug,
  type DocumentByCollectionSlug,
} from "@vexcms/core";
import { LivePreviewIndicator } from "../components/livePreview/LivePreviewIndicator";
import {
  LIVE_PREVIEW_MESSAGE_SOURCE,
  isLivePreviewMessage,
  openLivePreviewBroadcastChannel,
  livePreviewKeyFor,
  type LivePreviewHandshakeMessage,
} from "./livePreviewProtocol";

/**
 * Live-preview overlay state — an `id → unsaved values` map.
 * `null` is the default so `useLivePreview` can tell "no provider mounted, or
 * preview mode disabled" from "provider mounted, nothing unsaved yet".
 */
const LivePreviewContext = createContext<Map<string, Record<string, unknown>> | null>(null);

/**
 * Decides whether preview mode is active for this page load.
 *
 * Requires BOTH signals, and reads them after mount rather than during render:
 * - `?vexLivePreview=1` — the editor's explicit request, carried by the link.
 * - `vex-live-preview` — the marker cookie the project's middleware sets only
 *   after verifying the request carried a valid admin session.
 *
 * Reading them in an effect (rather than during render) is what keeps the
 * host page statically prerenderable: no `next/headers` call, and no
 * server/client divergence on the first render pass. The only thing that
 * appears post-hydration is the fixed-position indicator, which is out of
 * document flow and so shifts nothing.
 *
 * @returns `true` once both signals are confirmed present in the browser.
 */
function useLivePreviewEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const previewRequested =
      new URLSearchParams(window.location.search).get(LIVE_PREVIEW_QUERY_PARAM) === "1";
    const sessionVerified = document.cookie
      .split("; ")
      .some((cookie) => cookie === `${LIVE_PREVIEW_COOKIE}=1`);
    setEnabled(previewRequested && sessionVerified);
  }, []);

  return enabled;
}

/**
 * Mounts the live-preview listener (both `postMessage` and `BroadcastChannel`)
 * for the subtree it wraps, and renders the floating `LivePreviewIndicator`
 * alongside `children` — but only once {@link useLivePreviewEnabled} confirms
 * both the query param and the session-verified marker cookie are present.
 * Otherwise it renders `children` untouched, at zero cost.
 *
 * Always mounted by the caller (`NextLivePreviewProvider` in `@vexcms/next`);
 * no project writes the gating logic itself.
 *
 * @param props.allowedOrigins - Explicitly configured origins permitted to
 *   post `postMessage` control frames (`config.livePreview.allowedOrigins`).
 *   Irrelevant to `BroadcastChannel`, which cannot cross origins at all.
 * @param props.collections - The resolved `collections` array, needed to
 *   validate an incoming message's `values` against the target collection's
 *   generated Zod schema before it ever reaches a render.
 * @param props.children - The subtree that may call `useLivePreview`.
 * @returns `children`, wrapped in the overlay context when preview mode is on.
 */
export function LivePreviewProvider(props: {
  allowedOrigins: string[];
  collections: CollectionConfig[];
  children: ReactNode;
}) {
  const enabled = useLivePreviewEnabled();
  const [valuesById, setValuesById] = useState<Map<string, Record<string, unknown>>>(
    () => new Map(),
  );

  // Chrome's scroll anchoring follows the element it anchored to. Reordering
  // blocks moves that element, so the viewport jumps to wherever the block
  // went — measured as a 1200px → 184px jump with the document height
  // unchanged, i.e. not a remount or a reload. Preview is the one context
  // where the editor's viewport must stay put while content underneath it
  // rearranges, so anchoring is off for exactly as long as preview is on.
  useEffect(() => {
    if (!enabled) return;
    // Both elements: suppression applies to the subtree it is set on, and
    // setting it on `<html>` alone leaves `<body>`'s children anchorable —
    // verified, the jump still happened with only the root styled.
    const anchoredElements = [document.documentElement, document.body];
    const previousOverflowAnchors = anchoredElements.map((element) => element.style.overflowAnchor);
    anchoredElements.forEach((element) => {
      element.style.overflowAnchor = "none";
    });
    return () => {
      anchoredElements.forEach((element, index) => {
        element.style.overflowAnchor = previousOverflowAnchors[index] ?? "";
      });
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    function applyIncomingValues(data: unknown) {
      if (!isLivePreviewMessage(data)) return;
      if (data.type !== "vex-live-preview-update") return;

      const targetCollection = props.collections.find(
        (collection) => collection.slug === data.collectionSlug,
      );
      if (!targetCollection) return;

      const parsedValues = getCollectionInputSchema({
        collection: targetCollection,
        partial: true,
      }).safeParse(data.values);
      if (!parsedValues.success) {
        // Silently dropping a rejected payload looks identical to "the
        // transport never arrived", which is the hardest live-preview failure
        // to diagnose. Say so in development.
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[vexcms] live preview dropped an update for "${data.collectionSlug}": payload failed the collection's schema`,
            parsedValues.error.issues,
          );
        }
        return;
      }

      const previewKey = livePreviewKeyFor(data);
      if (!previewKey) return;

      // Overlay ONLY the keys the sender actually sent. `.partial()` makes every
      // key optional but still applies each field's `.default()`, so parsing an
      // update that carried just `title` yields `{ title, blocks: [], … }` —
      // spreading that over the fetched document would blank every field the
      // editor never touched.
      const sentKeys = new Set(Object.keys(data.values));
      const overlayValues: Record<string, unknown> = {};
      for (const [fieldKey, value] of Object.entries(parsedValues.data)) {
        if (sentKeys.has(fieldKey)) overlayValues[fieldKey] = value;
      }

      setValuesById((previousValuesById) => {
        const nextValuesById = new Map(previousValuesById);
        nextValuesById.set(previewKey, overlayValues);
        return nextValuesById;
      });
    }

    function handleWindowMessage(event: MessageEvent) {
      if (!props.allowedOrigins.includes(event.origin)) return;
      applyIncomingValues(event.data);
    }

    function handleBroadcastMessage(event: MessageEvent) {
      // BroadcastChannel is same-origin by browser construction — no origin
      // check applies (there is nothing to check against).
      applyIncomingValues(event.data);
    }

    window.addEventListener("message", handleWindowMessage);
    const channel = openLivePreviewBroadcastChannel();
    channel?.addEventListener("message", handleBroadcastMessage);

    return () => {
      window.removeEventListener("message", handleWindowMessage);
      channel?.close();
    };
  }, [enabled, props.allowedOrigins, props.collections]);

  if (!enabled) return <>{props.children}</>;

  return (
    <LivePreviewContext.Provider value={valuesById}>
      {props.children}
      <LivePreviewIndicator />
    </LivePreviewContext.Provider>
  );
}

/**
 * Announces one render site to the admin panel on mount and whenever the
 * document identity it previews changes, over both transports. Internal to
 * `useLivePreview` — not exported.
 */
function useLivePreviewHandshake(props: {
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
}): void {
  useEffect(() => {
    const handshakeMessage: LivePreviewHandshakeMessage = {
      source: LIVE_PREVIEW_MESSAGE_SOURCE,
      type: "vex-live-preview-handshake",
      collectionSlug: props.collectionSlug,
      documentId: props.documentId,
      tempId: props.tempId,
    };

    const previewParentWindow = window.parent !== window ? window.parent : window.opener;
    previewParentWindow?.postMessage(handshakeMessage, "*");

    const channel = openLivePreviewBroadcastChannel();
    channel?.postMessage(handshakeMessage);
    return () => channel?.close();
  }, [props.collectionSlug, props.documentId, props.tempId]);
}

/**
 * Reads one query-string parameter from the current URL.
 *
 * @param paramName - The parameter to read.
 * @returns Its value, or `null` when absent or when rendering on the server.
 */
function useLivePreviewSearchParam(paramName: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(paramName);
}

/**
 * Overlays unsaved editor values onto a document a consumer already fetched,
 * and announces this render site to the admin panel via the mount handshake.
 *
 * `collectionSlug` is a required second argument, not inferred from `doc` —
 * mirrors `useCollectionForm`'s `collection` argument, and is what types
 * `doc`/the return value to the exact generated document interface for that
 * collection. It also supplies the handshake/update messages' `collectionSlug`,
 * which has no other source once `doc` is `null`.
 *
 * @param doc - The document as fetched by the consumer's own query, or
 *   `null`/`undefined` while loading or for a not-yet-saved document.
 * @param collectionSlug - The collection `doc` belongs to.
 * @returns `doc` overlaid with unsaved values matching its `_id`, or — when
 *   `doc` is absent and the current URL carries a `vexLivePreviewId` matching an
 *   entry in the map — a document synthesized from the unsaved values alone.
 */
export function useLivePreview<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  doc: DocumentByCollectionSlug<TCollectionSlug> | null | undefined,
  collectionSlug: TCollectionSlug,
): DocumentByCollectionSlug<TCollectionSlug> | null | undefined {
  const valuesById = useContext(LivePreviewContext);
  const previewId = useLivePreviewSearchParam(LIVE_PREVIEW_ID_PARAM);
  const savedDocId = (doc as { _id?: string } | null | undefined)?._id;

  useLivePreviewHandshake({
    collectionSlug,
    documentId: savedDocId,
    tempId: savedDocId ? undefined : (previewId ?? undefined),
  });

  return useMemo(() => {
    if (!valuesById) return doc;

    if (savedDocId) {
      const unsavedValues = valuesById.get(savedDocId);
      return unsavedValues
        ? ({ ...doc, ...unsavedValues } as DocumentByCollectionSlug<TCollectionSlug>)
        : doc;
    }

    if (!previewId) return doc;
    const unsavedValues = valuesById.get(previewId);
    if (!unsavedValues) return doc;

    return {
      _id: previewId,
      _creationTime: Date.now(),
      ...unsavedValues,
    } as DocumentByCollectionSlug<TCollectionSlug>;
  }, [doc, savedDocId, valuesById, previewId]);
}

/**
 * `useLivePreviewQuery`'s result — a `useQuery` result whose `data` is the single
 * overlaid document rather than the query's own array.
 */
export type LivePreviewQueryResult<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  Omit<UseQueryResult<DocumentByCollectionSlug<TCollectionSlug>[]>, "data"> & {
    data: DocumentByCollectionSlug<TCollectionSlug> | undefined;
  };

/**
 * Sugar composing `useQuery` with `useLivePreview` — shaped around a
 * `getBySlug`-style query that resolves to an array, narrowed to its first
 * element the same way `PageContent.tsx` already does by hand.
 *
 * @example
 * ```tsx
 * const { data: page } = useLivePreviewQuery(
 *   { ...convexQuery(api.pages.getBySlug, { slug }), initialData },
 *   "pages",
 * );
 * ```
 *
 * @param queryOptions - The `useQuery` options for a query resolving to an array.
 * @param collectionSlug - The collection those documents belong to.
 * @returns The query result with `data` narrowed to the single overlaid document.
 */
export function useLivePreviewQuery<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>(
  queryOptions: UseQueryOptions<
    DocumentByCollectionSlug<TCollectionSlug>[],
    Error,
    DocumentByCollectionSlug<TCollectionSlug>[],
    TQueryKey
  >,
  collectionSlug: TCollectionSlug,
): LivePreviewQueryResult<TCollectionSlug> {
  const queryResult = useQuery(queryOptions);
  const previewedDoc = useLivePreview(queryResult.data?.[0], collectionSlug);
  return { ...queryResult, data: previewedDoc ?? undefined };
}

/**
 * `useLivePreviewDocumentQuery`'s result — the underlying single-document query
 * result, with `null` collapsed into `undefined` so consumers have one
 * "nothing to render" case instead of two.
 */
export type LivePreviewDocumentQueryResult<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> = Omit<UseQueryResult<DocumentByCollectionSlug<TCollectionSlug> | null>, "data"> & {
  data: DocumentByCollectionSlug<TCollectionSlug> | undefined;
};

/**
 * Sugar composing `useQuery` with `useLivePreview` for a query that already
 * resolves to a SINGLE document — a `getFirst`-style singleton read, or any
 * lookup by id — rather than the array `useLivePreviewQuery` narrows.
 *
 * Exists because the overlay only reaches documents a consumer hands it: a
 * component fetching an editable document through a plain `useQuery` is
 * invisible to live preview, which is why editing a `headers` document while
 * previewing the home page changed nothing.
 *
 * @param queryOptions - The `useQuery` options for a query resolving to one document.
 * @param collectionSlug - The collection that document belongs to.
 * @returns The query result with `data` overlaid by any unsaved editor values.
 *
 * @example
 * ```tsx
 * const { data: header } = useLivePreviewDocumentQuery(
 *   { ...convexQuery(api.headers.getFirst, {}), initialData },
 *   "headers",
 * );
 * ```
 */
export function useLivePreviewDocumentQuery<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  // Inferred from the query itself: a `getFirst`-style read is typed
  // `Doc | null`, a lookup by id often just `Doc`, and pinning the parameter to
  // one of those makes the other fail to assign.
  TData extends DocumentByCollectionSlug<TCollectionSlug> | null =
    DocumentByCollectionSlug<TCollectionSlug> | null,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>(
  queryOptions: UseQueryOptions<TData, Error, TData, TQueryKey>,
  collectionSlug: TCollectionSlug,
): LivePreviewDocumentQueryResult<TCollectionSlug> {
  const queryResult = useQuery(queryOptions);
  const previewedDoc = useLivePreview(queryResult.data, collectionSlug);
  return {
    ...queryResult,
    data: previewedDoc ?? undefined,
  } as LivePreviewDocumentQueryResult<TCollectionSlug>;
}
