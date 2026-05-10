import type { GenericId } from "convex/values";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for `update`.
 *
 * @example
 * ```tsx
 * import { update } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * // Inside a React component:
 * const { mutateAsync } = useMutation({ mutationFn: update() });
 * await mutateAsync({ id: postId, data: { title: "Updated title" } });
 * ```
 */
export interface UpdateClientArgs extends GenericMutationClientParams {
  /** The document ID to update. */
  id: GenericId<CollectionSlug>;
  /** Partial field values to merge into the document. */
  data: Record<string, unknown>;
}

/**
 * Returns a `mutationFn` for updating a document in a VexCMS collection.
 *
 * Wraps `useConvexMutation(vexConvexApi.update)` — must be called at the
 * top level of a React component (obeys the Rules of Hooks).
 *
 * @returns A mutation function accepting {@link UpdateClientArgs}.
 * @see {@link UpdateClientArgs} for the typed args shape.
 */
export function update() {
  return useConvexMutation(vexConvexApi.update);
}
