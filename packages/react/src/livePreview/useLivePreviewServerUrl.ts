"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import {
  appendLivePreviewParams,
  DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
  vexConvexApi,
} from "@vexcms/core";
import type { LivePreviewUrl } from "@vexcms/core";

/**
 * Resolves the preview URL for a `{ server }` resolver, which the browser
 * cannot evaluate itself because it reads the database.
 *
 * Only the `{ server }` form issues a query. A string or client resolver was
 * already resolved synchronously by `resolveLivePreviewUrl`, so this returns
 * that URL untouched and Convex is never called — the round trip is opt-in by
 * the shape of the config, not a cost every project pays.
 *
 * Values are debounced on the same cadence as `useLivePreviewSync`: the URL is
 * a function of unsaved form state, so it would otherwise re-query on every
 * keystroke.
 *
 * @param props.url - The configured `url` in any of its three forms.
 * @param props.clientUrl - What `resolveLivePreviewUrl` produced, if anything.
 * @param props.initialUrl - The URL `NextAdminPage` resolved server-side, used
 *   until the first query answers so the iframe's first paint needs no round trip.
 * @param props.kind - Whether `slug` names a collection or a global.
 * @param props.slug - The collection or global being previewed.
 * @param props.documentId - The saved document id, absent while it is being created.
 * @param props.tempId - The client-generated temp id for an unsaved document.
 * @param props.formValues - The form's current values.
 * @param props.debounceMs - Resolved sync debounce.
 * @returns The preview URL to load, or `undefined` while nothing can be resolved.
 */
export function useLivePreviewServerUrl(props: {
  url: LivePreviewUrl | undefined;
  clientUrl: string | undefined;
  initialUrl?: string;
  kind: "collection" | "global";
  slug: string;
  documentId?: string;
  tempId?: string;
  formValues: Record<string, unknown>;
  debounceMs?: number;
}): string | undefined {
  const isServerResolved = typeof props.url === "object" && props.url !== null;
  const debouncedValues = useDebouncedValues({
    values: props.formValues,
    delayMs: props.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
    enabled: isServerResolved,
  });

  const { data } = useQuery({
    ...convexQuery(
      vexConvexApi.livePreviewUrl,
      isServerResolved
        ? {
            collection: props.slug,
            kind: props.kind,
            documentId: props.documentId,
            values: debouncedValues,
          }
        : "skip",
    ),
    enabled: isServerResolved,
    // The values are part of the query key, so every edit starts a NEW query
    // whose `data` is `undefined` until it answers. Without this the hook fell
    // back to `initialUrl` in that gap, changing the iframe's `src` and forcing
    // a full reload — which repainted the SAVED state for a beat between edits.
    // Holding the previous URL keeps the iframe on one document.
    placeholderData: keepPreviousData,
  });

  if (!isServerResolved) return props.clientUrl;

  // `initialUrl` applies only before anything has resolved: once a URL exists,
  // `keepPreviousData` keeps serving it rather than reverting.
  const resolved = typeof data === "string" ? data : undefined;
  if (!resolved) return props.initialUrl;

  return appendLivePreviewParams({
    url: resolved,
    collectionSlug: props.slug,
    tempId: props.documentId ? undefined : props.tempId,
  });
}

/**
 * Trailing-edge debounce over the form's values.
 *
 * @param props.values - The current form values.
 * @param props.delayMs - Quiet period before the values are published.
 * @param props.enabled - `false` keeps the hook inert for the non-server forms.
 * @returns The last values that stayed unchanged for `delayMs`.
 */
function useDebouncedValues(props: {
  values: Record<string, unknown>;
  delayMs: number;
  enabled: boolean;
}): Record<string, unknown> {
  const [debounced, setDebounced] = useState(props.values);

  useEffect(() => {
    if (!props.enabled) return;
    const timeoutId = setTimeout(() => setDebounced(props.values), props.delayMs);
    return () => clearTimeout(timeoutId);
  }, [props.values, props.delayMs, props.enabled]);

  return debounced;
}
