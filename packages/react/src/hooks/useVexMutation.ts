"use client";

import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  VEX_REVALIDATE_BATCH_SIZE,
  type VexMutationOperation,
  type VexRevalidateChange,
} from "@vexcms/core";
import type { DefaultFunctionArgs, FunctionReference } from "convex/server";

import { useVexRevalidateConfig } from "../context/VexRevalidateContext";

/**
 * Props for {@link useVexMutation}.
 *
 * @typeParam TArgs - The Convex mutation's argument type.
 * @typeParam TResult - The Convex mutation's return type.
 */
export interface UseVexMutationProps<TArgs extends DefaultFunctionArgs, TResult> {
  /** Collection or global slug the mutation writes to — echoed to the endpoint. */
  collection: string;
  /**
   * Derives the before/after document snapshots to purge from the mutation's
   * variables and its settled result — one entry per affected document, so a
   * bulk delete returns one change per row. Omitted means `changes: []`, which
   * the route treats as nothing to purge rather than an error.
   */
  getChanges?: (props: { args: TArgs; result: TResult }) => VexRevalidateChange[];
  /** The Convex mutation function reference to call, e.g. `vexConvexApi.update`. */
  mutationFn: FunctionReference<"mutation", "public", TArgs, TResult>;
  /** Which write this is — echoed to the endpoint alongside `collection`. */
  operation: VexMutationOperation;
}

/**
 * Splits `changes` into consecutive chunks of at most `size` entries.
 *
 * An empty input still yields one empty chunk, so a write always purges exactly
 * once even when there is nothing to purge.
 *
 * @param changes - The changes to chunk.
 * @param size - Maximum entries per chunk.
 * @returns Consecutive chunks, in order.
 */
function chunkChanges(changes: VexRevalidateChange[], size: number): VexRevalidateChange[][] {
  if (changes.length === 0) {
    return [[]];
  }
  const chunks: VexRevalidateChange[][] = [];
  for (let index = 0; index < changes.length; index += size) {
    chunks.push(changes.slice(index, index + size));
  }
  return chunks;
}

/**
 * Wraps a Convex mutation with a fire-and-forget cache purge.
 *
 * On success, POSTs `{ collection, operation, changes }` to the revalidation
 * endpoint (`createVexRevalidateRoute` from `@vexcms/next`) — chunked into
 * requests of at most `VEX_REVALIDATE_BATCH_SIZE` changes each, issued
 * sequentially, so a "select all" bulk delete never sends one oversized body.
 *
 * The purge NEVER fails, delays, or rejects the caller's mutation — a failed
 * purge is a stale page, a failed save is lost work — so the promise
 * `mutateAsync` returns settles on the Convex mutation alone.
 *
 * With no `VexRevalidateProvider` in scope it POSTs to
 * `DEFAULT_VEX_REVALIDATE_ENDPOINT`, a relative path, since the admin panel is
 * same-origin with the public site and the request rides the admin's own
 * session cookie.
 *
 * @param props - Input props.
 * @returns The same `UseMutationResult` `useMutation` would return, so an
 *   existing call site swaps in this hook without changing how its result is
 *   consumed.
 */
export function useVexMutation<TArgs extends DefaultFunctionArgs, TResult>(
  props: UseVexMutationProps<TArgs, TResult>,
): UseMutationResult<TResult, Error, TArgs> {
  const revalidateConfig = useVexRevalidateConfig();
  const convexMutationFn = useConvexMutation(props.mutationFn);

  // `ReactMutation` is callable as `(args) => Promise<result>`, but it is a
  // branded interface TanStack's `mutationFn` slot cannot structurally unify
  // with a plain function signature.
  const mutationFn = convexMutationFn as unknown as (args: TArgs) => Promise<TResult>;

  return useMutation<TResult, Error, TArgs>({
    mutationFn,
    // Synchronous on purpose: returning the purge promise would make TanStack
    // Query wait on it before resolving `mutateAsync`.
    onSuccess: (result, args) => {
      if (revalidateConfig.disabled) {
        return;
      }

      const changes = props.getChanges?.({ args, result }) ?? [];
      const chunks = chunkChanges(changes, VEX_REVALIDATE_BATCH_SIZE);

      void (async () => {
        for (const chunk of chunks) {
          try {
            await fetch(revalidateConfig.endpoint, {
              body: JSON.stringify({
                changes: chunk,
                collection: props.collection,
                operation: props.operation,
              }),
              headers: { "Content-Type": "application/json" },
              method: "POST",
            });
          } catch {
            // A failed chunk must not stop the chunks after it, and must never
            // surface as an unhandled rejection or a mutation error.
          }
        }
      })();
    },
  });
}
