import { useConvexMutation } from "@convex-dev/react-query";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, GenericMutationClientParams } from "@vexcms/core";

/**
 * Client-side args for {@link useRemoveView}.
 *
 * @example
 * ```tsx
 * import { useRemoveView, type RemoveViewClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const removeViewMutationFn = useRemoveView();
 * const { mutateAsync } = useMutation({ mutationFn: removeViewMutationFn });
 * await mutateAsync({ collection: "posts", viewId: "v1" });
 * ```
 */
export interface RemoveViewClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug>
  extends GenericMutationClientParams {
  /** The collection slug the view belongs to. */
  collection: TCollectionSlug;
  /** The `viewId` of the shared view to delete. */
  viewId: string;
}

/**
 * Returns a `mutationFn` for permanently deleting a shared view. Requires
 * `deleteView` on `collection` — throws `VexAccessError` server-side
 * otherwise.
 *
 * Wraps `useConvexMutation(vexConvexApi.removeView)`. A React hook (the
 * `use` prefix is REQUIRED, not just convention — developer-reported crash:
 * named `removeView()` without it, `apps/test`'s `reactCompiler: true`
 * treated the call as a pure, memoizable function rather than a hook, so a
 * later render could skip re-invoking it and silently drop its internal
 * `useConvexMutation` call — a hook-order mismatch crash ("change in the
 * order of Hooks"), confirmed live). Call at the top level of a React
 * component, as its own statement, BEFORE `useMutation` (not inlined as
 * `useMutation`'s own `mutationFn` argument) — pass the returned function
 * on as `mutationFn`.
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `removeView` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link RemoveViewClientArgs} for the typed args shape.
 */
export function useRemoveView() {
  return useConvexMutation(vexConvexApi.removeView);
}
