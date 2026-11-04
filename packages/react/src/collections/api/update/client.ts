import type { GenericId } from "convex/values";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug } from "@vexcms/core";
import type { GenericMutationClientParams } from "@vexcms/core";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link useUpdate}.
 *
 * @example
 * ```tsx
 * import { useUpdate, type UpdateClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * // Inside a React component:
 * const updateMutationFn = useUpdate();
 * const { mutateAsync } = useMutation({ mutationFn: updateMutationFn });
 * await mutateAsync({ id: postId, data: { title: "Updated title" } });
 * ```
 */
export interface UpdateClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericMutationClientParams {
  /** The collection slug to patch metadata. */
  collection: TCollectionSlug;
  /** The document ID to update. */
  id: GenericId<TCollectionSlug>;
  /** Partial field values to merge into the document. */
  data: Record<string, unknown>;
}

/**
 * Returns a `mutationFn` for patching an existing document in a VexCMS collection.
 *
 * Wraps `useConvexMutation(vexConvexApi.update)`. A React hook (the `use`
 * prefix is REQUIRED, not just convention — a non-`use`-prefixed wrapper
 * around a hook call can be treated as a pure, memoizable function by the
 * React Compiler, silently dropping the internal hook call on a later
 * render and causing a hook-order mismatch crash; confirmed live on the
 * sibling `saveView`/`removeView` helpers). Call at
 * the top level of a React component, as its own statement, BEFORE
 * `useMutation` (not inlined as `useMutation`'s own `mutationFn` argument).
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `update` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link UpdateClientArgs} for the typed args shape.
 * @example
 * ```tsx
 * import { useUpdate } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function EditTitleButton({ id }: { id: Id<"posts"> }) {
 *   const updateMutationFn = useUpdate();
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: updateMutationFn });
 *   return (
 *     <button onClick={() => mutateAsync({ id, data: { title: "New title" } })}>
 *       {isPending ? "Saving…" : "Save"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useUpdate() {
  return useConvexMutation(vexConvexApi.update);
}
