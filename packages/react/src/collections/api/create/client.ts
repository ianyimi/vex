import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug } from "@vexcms/core";
import type { GenericMutationClientParams } from "@vexcms/core";

/**
 * Client-side args for {@link useCreate}.
 *
 * @example
 * ```tsx
 * import { useCreate, type CreateClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * // Inside a React component:
 * const createMutationFn = useCreate();
 * const { mutateAsync } = useMutation({ mutationFn: createMutationFn });
 * await mutateAsync({ collection: "posts", data: { title: "My first post" } });
 * ```
 */
export interface CreateClientArgs extends GenericMutationClientParams {
  /** The collection slug to insert into. */
  collection: CollectionSlug;
  /** Field values for the new document. */
  data: Record<string, unknown>;
}

/**
 * Returns a `mutationFn` for creating a document in a VexCMS collection.
 *
 * Wraps `useConvexMutation(vexConvexApi.create)`. A React hook (the `use`
 * prefix is REQUIRED, not just convention — a non-`use`-prefixed wrapper
 * around a hook call can be treated as a pure, memoizable function by the
 * React Compiler, silently dropping the internal hook call on a later
 * render and causing a hook-order mismatch crash; confirmed live on the
 * sibling `saveView`/`removeView` helpers). Call at
 * the top level of a React component, as its own statement, BEFORE
 * `useMutation` (not inlined as `useMutation`'s own `mutationFn` argument).
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `create` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link CreateClientArgs} for the typed args shape.
 * @example
 * ```tsx
 * import { useCreate } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function CreatePostButton() {
 *   const createMutationFn = useCreate();
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: createMutationFn });
 *   return (
 *     <button onClick={() => mutateAsync({ collection: "posts", data: { title: "Hi" } })}>
 *       {isPending ? "Creating…" : "Create"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreate() {
  return useConvexMutation(vexConvexApi.create);
}
