import type { GenericId } from "convex/values";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, GlobalSlug } from "@vexcms/core";
import type { GenericMutationClientParams } from "@vexcms/core";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link useSaveDraft}. A discriminated union: pass
 * `{ collection, id, data }` for a versioned collection's document, or
 * `{ global, data }` for a versioned global.
 *
 * @example
 * ```tsx
 * import { useSaveDraft, type SaveDraftClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const saveDraftMutationFn = useSaveDraft();
 * const { mutateAsync } = useMutation({ mutationFn: saveDraftMutationFn });
 * await mutateAsync({ collection: "posts", id: postId, data: { title: "Draft title" } });
 * await mutateAsync({ global: "siteSettings", data: { siteName: "New Name" } });
 * ```
 */
export type SaveDraftClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  GenericMutationClientParams &
    (
      | {
          /** The versioned collection slug. */
          collection: TCollectionSlug;
          /**
           * The document id currently loaded — the published row's id, or an
           * active draft's own id. The server resolves either to the one draft row.
           */
          id: GenericId<TCollectionSlug>;
          /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
          data: Record<string, unknown>;
          /** The version number this save restores from, when reverting to an older snapshot. */
          restoredFrom?: number;
        }
      | {
          /** The versioned global slug. */
          global: GlobalSlug;
          /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
          data: Record<string, unknown>;
        }
    );

/**
 * Returns a `mutationFn` for saving a draft in a VexCMS versioned collection.
 * The mutation resolves to the draft row's id — which differs from the `id`
 * passed in on the first edit of a published document, when the server
 * bootstraps a new draft row.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.saveDraft)`. A React hook
 * (the `use` prefix is REQUIRED, not just convention — a non-`use`-prefixed
 * wrapper around a hook call can be treated as a pure, memoizable function
 * by the React Compiler, silently dropping the internal hook call on a
 * later render and causing a hook-order mismatch crash; confirmed live
 * on the sibling `saveView`/`removeView` helpers). Call at
 * the top level of a React component, as its own statement, BEFORE
 * `useMutation` (not inlined as `useMutation`'s own `mutationFn` argument).
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `saveDraft` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link SaveDraftClientArgs} for the typed args shape.
 * @example
 * ```tsx
 * import { useSaveDraft } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function SaveDraftButton({ id, title }: { id: Id<"posts">; title: string }) {
 *   const saveDraftMutationFn = useSaveDraft();
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: saveDraftMutationFn });
 *   return (
 *     <button onClick={() => mutateAsync({ collection: "posts", id, data: { title } })}>
 *       {isPending ? "Saving…" : "Save draft"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSaveDraft() {
  return useConvexMutation(vexConvexApi.versions.saveDraft);
}
