import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link saveDraft}.
 *
 * @example
 * ```tsx
 * import { saveDraft, type SaveDraftClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: saveDraft() });
 * await mutateAsync({ collection: "posts", id: postId, data: { title: "Draft title" } });
 * ```
 */
export interface SaveDraftClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericMutationClientParams {
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /**
   * The document id currently loaded — the published row's id, or an active
   * draft's own id. The server resolves either to the one draft row.
   */
  id: GenericId<TCollectionSlug>;
  /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
  data: Record<string, unknown>;
  /** The version number this save restores from, when reverting to an older snapshot. */
  restoredFrom?: number;
}

/**
 * Returns a `mutationFn` for saving a draft in a VexCMS versioned collection.
 * The mutation resolves to the draft row's id — which differs from the `id`
 * passed in on the first edit of a published document, when the server
 * bootstraps a new draft row.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.saveDraft)`. Call at the top
 * level of a React component (obeys the Rules of Hooks); pass the return
 * value as `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `saveDraft` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link SaveDraftClientArgs} for the typed args shape.
 * @example
 * ```tsx
 * import { saveDraft } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function SaveDraftButton({ id, title }: { id: Id<"posts">; title: string }) {
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: saveDraft() });
 *   return (
 *     <button onClick={() => mutateAsync({ collection: "posts", id, data: { title } })}>
 *       {isPending ? "Saving…" : "Save draft"}
 *     </button>
 *   );
 * }
 * ```
 */
export function saveDraft() {
  return useConvexMutation(vexConvexApi.versions.saveDraft);
}
