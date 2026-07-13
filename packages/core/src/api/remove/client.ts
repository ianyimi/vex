import type { GenericId } from "convex/values";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link remove}.
 *
 * @example
 * ```tsx
 * import { remove, type RemoveClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * // Inside a React component:
 * const { mutateAsync } = useMutation({ mutationFn: remove() });
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
 * Wraps `useConvexMutation(vexConvexApi.remove)`. Call at the top level of
 * a React component (obeys the Rules of Hooks); pass the return value as
 * `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `remove` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link RemoveClientArgs} for the typed args shape.
 * @example
 * ```tsx
 * import { remove } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function DeleteButton({ id }: { id: Id<"posts"> }) {
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: remove() });
 *   return (
 *     <button onClick={() => mutateAsync({ id })}>
 *       {isPending ? "Deleting…" : "Delete"}
 *     </button>
 *   );
 * }
 * ```
 */
export function remove() {
  return useConvexMutation(vexConvexApi.remove);
}
