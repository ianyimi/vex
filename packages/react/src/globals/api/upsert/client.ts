import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";

/**
 * Returns a `useConvexMutation` hook bound to the `globals.update` Convex mutation.
 * Call the returned function as `mutationFn` inside `useMutation`.
 *
 * The mutation accepts `{ slug: string, data: Record<string, unknown> }`.
 * Pass user field values in `data` — system keys (`_id`, `_creationTime`, `_slug`)
 * are stripped server-side if they accidentally appear.
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
 *
 * @example
 * ```tsx
 * import { useUpdateGlobal } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const updateGlobalMutationFn = useUpdateGlobal();
 * const mutation = useMutation({ mutationFn: updateGlobalMutationFn });
 * mutation.mutate({ slug: "siteSettings", data: { siteName: "New Name" } });
 * ```
 */
export function useUpdateGlobal() {
  return useConvexMutation(vexConvexApi.globals.upsert);
}
