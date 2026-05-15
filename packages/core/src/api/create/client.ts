import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";

/**
 * Client-side args for {@link create}.
 *
 * @example
 * ```tsx
 * import { create, type CreateClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * // Inside a React component:
 * const { mutateAsync } = useMutation({ mutationFn: create() });
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
 * Wraps `useConvexMutation(vexConvexApi.create)`. Call at the top level of
 * a React component (obeys the Rules of Hooks); pass the return value as
 * `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `create` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link CreateClientArgs} for the typed args shape.
 * @example
 * ```tsx
 * import { create } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function CreatePostButton() {
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: create() });
 *   return (
 *     <button onClick={() => mutateAsync({ collection: "posts", data: { title: "Hi" } })}>
 *       {isPending ? "Creating…" : "Create"}
 *     </button>
 *   );
 * }
 * ```
 */
export function create() {
  return useConvexMutation(vexConvexApi.create);
}
