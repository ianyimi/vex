import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";

/**
 * Returns a `useConvexMutation` hook bound to the `deleteVersion` Convex
 * mutation. Call the returned function as `mutationFn` inside `useMutation`.
 *
 * The mutation accepts `{ collection, id, version } | { global, version }`
 * and throws for a caller lacking `deleteVersions` — `VersionHistoryDropdown`
 * (Step 18) hides its delete affordance under the same action so the throw
 * path is rarely hit.
 *
 * Import from `@vexcms/react/client`.
 *
 * @returns A `useConvexMutation`-compatible mutation function.
 * @example
 * ```tsx
 * import { deleteVersion } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: deleteVersion() });
 * await mutateAsync({ collection: "posts", id: postId, version: 3 });
 * await mutateAsync({ global: "banner", version: 2 });
 * ```
 */
export function deleteVersion() {
  return useConvexMutation(vexConvexApi.versions.deleteVersion);
}
