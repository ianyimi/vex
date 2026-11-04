import type { GenericId } from "convex/values";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug } from "@vexcms/core";
import type { GenericMutationClientParams } from "@vexcms/core";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link useRemove}.
 *
 * @example
 * ```tsx
 * import { useRemove, type RemoveClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * // Inside a React component:
 * const removeMutationFn = useRemove();
 * const { mutateAsync } = useMutation({ mutationFn: removeMutationFn });
 * await mutateAsync({ id: postId });
 * ```
 */
export interface RemoveClientArgs<
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationClientParams {
  /**
   * Document ID(s) to delete.
   * Pass a single ID in an array for one document, or multiple IDs for bulk delete.
   */
  ids: GenericId<TCollectionSlug>[];
  /**
   * Optional soft delete field name.
   * If provided, sets this field to `true` instead of permanently deleting.
   * @example "deleted" — sets { deleted: true } on the document(s)
   */
  softDelete?: string;
}

/**
 * Returns a `mutationFn` for permanently deleting a document from a VexCMS collection.
 *
 * Wraps `useConvexMutation(vexConvexApi.remove)`. A React hook (the `use`
 * prefix is REQUIRED, not just convention — a non-`use`-prefixed wrapper
 * around a hook call can be treated as a pure, memoizable function by the
 * React Compiler, silently dropping the internal hook call on a later
 * render and causing a hook-order mismatch crash; confirmed live on the
 * sibling `saveView`/`removeView` helpers). Call at
 * the top level of a React component, as its own statement, BEFORE
 * `useMutation` (not inlined as `useMutation`'s own `mutationFn` argument).
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `remove` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link RemoveClientArgs} for the typed args shape.
 * @example
 * ```tsx
 * import { useRemove } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function DeleteButton({ id }: { id: Id<"posts"> }) {
 *   const removeMutationFn = useRemove();
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: removeMutationFn });
 *   return (
 *     <button onClick={() => mutateAsync({ id })}>
 *       {isPending ? "Deleting…" : "Delete"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useRemove() {
  return useConvexMutation(vexConvexApi.remove);
}
