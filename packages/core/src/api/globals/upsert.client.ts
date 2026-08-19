import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "../convex";

/**
 * Returns a `useConvexMutation` hook bound to the `globals.update` Convex mutation.
 * Call the returned function as `mutationFn` inside `useMutation`.
 *
 * The mutation accepts `{ slug: string, data: Record<string, unknown> }`.
 * Pass user field values in `data` — system keys (`_id`, `_creationTime`, `_slug`)
 * are stripped server-side if they accidentally appear. `GlobalEditView` calls
 * this internally after stripping system keys from the flat form state.
 *
 * Import from `@vexcms/core/client`.
 *
 * @returns A `useConvexMutation`-compatible mutation function.
 *
 * @example
 * ```tsx
 * import { globals } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const mutation = useMutation({ mutationFn: globals.update() });
 * mutation.mutate({ slug: "siteSettings", data: { siteName: "New Name" } });
 * ```
 */
export function updateGlobal() {
  return useConvexMutation(vexConvexApi.globals.upsert);
}
