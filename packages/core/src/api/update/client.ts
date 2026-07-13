import type { GenericId } from "convex/values";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link update}.
 *
 * @example
 * ```tsx
 * import { update, type UpdateClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * // Inside a React component:
 * const { mutateAsync } = useMutation({ mutationFn: update() });
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
 * Wraps `useConvexMutation(vexConvexApi.update)`. Call at the top level of
 * a React component (obeys the Rules of Hooks); pass the return value as
 * `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `update` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link UpdateClientArgs} for the typed args shape.
 * @example
 * ```tsx
 * import { update } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function EditTitleButton({ id }: { id: Id<"posts"> }) {
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: update() });
 *   return (
 *     <button onClick={() => mutateAsync({ id, data: { title: "New title" } })}>
 *       {isPending ? "Saving…" : "Save"}
 *     </button>
 *   );
 * }
 * ```
 */
export function update() {
  return useConvexMutation(vexConvexApi.update);
}
