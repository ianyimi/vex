import type { GenericId } from "convex/values";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for `remove`.
 *
 * @example
 * ```tsx
 * import { remove } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * // Inside a React component:
 * const { mutateAsync } = useMutation({ mutationFn: remove() });
 * await mutateAsync({ id: postId });
 * ```
 */
export interface RemoveClientArgs extends GenericMutationClientParams {
  /** The document ID to delete. */
  id: GenericId<CollectionSlug>;
}

/**
 * Returns a `mutationFn` for deleting a document from a VexCMS collection.
 *
 * Wraps `useConvexMutation(vexConvexApi.remove)` — must be called at the
 * top level of a React component (obeys the Rules of Hooks).
 *
 * @returns A mutation function accepting {@link RemoveClientArgs}.
 * @see {@link RemoveClientArgs} for the typed args shape.
 */
export function remove() {
  return useConvexMutation(vexConvexApi.remove);
}
