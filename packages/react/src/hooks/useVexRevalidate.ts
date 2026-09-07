"use client";

import { useMutation } from "@tanstack/react-query";
import type {
  CollectionSlug,
  VexRevalidateRequest,
  VexRevalidateResponse,
  VexDocument,
} from "@vexcms/core";

import { useVexRevalidateConfig } from "../context/VexRevalidateContext";

/** Return shape of {@link useVexRevalidate}. */
export interface UseVexRevalidateResult {
  /** The most recent purge request's failure, or `null` once one succeeds. */
  error: Error | null;
  /** `true` while a purge request is in flight. */
  isPending: boolean;
  /** Purges every path configured for the given collection. */
  purgeCollection: (props: { collection: CollectionSlug }) => Promise<VexRevalidateResponse>;
  /** Purges the given document's currently-resolved paths. */
  purgeDocument: (props: {
    collection: CollectionSlug;
    doc: Partial<VexDocument>;
  }) => Promise<VexRevalidateResponse>;
}

/**
 * Data layer for the admin panel's manual "Revalidate" control
 * ({@link RevalidateButton}). Posts to the same route `useVexMutation`'s
 * fire-and-forget purge posts to, resolved the same way from
 * `VexRevalidateContext` — one purge route, two callers.
 *
 * Unlike `useVexMutation`'s purge, this one is user-initiated: the caller
 * clicked a button expecting a real outcome, so a failed request surfaces as
 * `error` and a rejected promise rather than resolving silently.
 *
 * @returns `purgeDocument`/`purgeCollection` request functions plus
 *   `isPending`/`error` for the calling button to render.
 * @throws Never itself; `purgeDocument`/`purgeCollection` reject on a network
 *   failure or non-2xx response, and that same failure populates `error` for
 *   the non-throwing render path.
 */
export function useVexRevalidate(): UseVexRevalidateResult {
  const revalidateConfig = useVexRevalidateConfig();

  const mutation = useMutation({
    mutationFn: async (body: VexRevalidateRequest): Promise<VexRevalidateResponse> => {
      // There is no route configured to call, so fail before the network
      // rather than POSTing into a 404 and reporting it as a purge failure.
      if (revalidateConfig.disabled) {
        throw new Error("Revalidation is disabled");
      }

      const response = await fetch(revalidateConfig.endpoint, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      // 401 signed out, 403 no write permission on `body.collection`, 413 an
      // over-sized batch. None of them are a purge the caller can retry into
      // success, so name the status rather than swallowing it.
      if (!response.ok) {
        throw new Error(`Revalidate request failed: ${response.status}`);
      }

      return (await response.json()) as VexRevalidateResponse;
    },
  });

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    purgeCollection: ({ collection }) => mutation.mutateAsync({ all: true, collection }),
    // `"update"` always: a manual purge re-resolves the document's current
    // paths, it does not model a create or delete.
    purgeDocument: ({ collection, doc }) =>
      mutation.mutateAsync({ changes: [{ after: doc }], collection, operation: "update" }),
  };
}
