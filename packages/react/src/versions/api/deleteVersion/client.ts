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
 * A React hook (the `use` prefix is REQUIRED, not just convention — a
 * non-`use`-prefixed wrapper around a hook call can be treated as a pure,
 * memoizable function by the React Compiler, silently dropping the
 * internal hook call on a later render and causing a hook-order mismatch
 * crash; developer-reported, confirmed live on the sibling `saveView`/
 * `removeView` helpers). Call at the top level of a React component, as
 * its own statement, BEFORE `useMutation` (not inlined as `useMutation`'s
 * own `mutationFn` argument).
 *
 * Import from `@vexcms/react/client`.
 *
 * @returns A `useConvexMutation`-compatible mutation function.
 * @example
 * ```tsx
 * import { useDeleteVersion } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const deleteVersionMutationFn = useDeleteVersion();
 * const { mutateAsync } = useMutation({ mutationFn: deleteVersionMutationFn });
 * await mutateAsync({ collection: "posts", id: postId, version: 3 });
 * await mutateAsync({ global: "banner", version: 2 });
 * ```
 */
export function useDeleteVersion() {
  return useConvexMutation(vexConvexApi.versions.deleteVersion);
}
