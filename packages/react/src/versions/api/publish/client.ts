import type { GenericId } from "convex/values";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, GlobalSlug } from "@vexcms/core";
import type { GenericMutationClientParams } from "@vexcms/core";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link usePublish}. A discriminated union: pass
 * `{ collection, id }` for a versioned collection's active draft, or
 * `{ global }` for a versioned global's.
 *
 * @example
 * ```tsx
 * import { usePublish, type PublishClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const publishMutationFn = usePublish();
 * const { mutateAsync } = useMutation({ mutationFn: publishMutationFn });
 * await mutateAsync({ collection: "posts", id: draftId });
 * await mutateAsync({ global: "siteSettings" });
 * ```
 */
export type PublishClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  GenericMutationClientParams &
    (
      | {
          /** The versioned collection slug. */
          collection: TCollectionSlug;
          /** The document id currently loaded — the published row's id, or an active draft's own id. */
          id: GenericId<TCollectionSlug>;
          /** Field values to merge on top of the current draft/published row before publishing. */
          data?: Record<string, unknown>;
          /** Publish this history version's snapshot instead of the draft. */
          version?: number;
        }
      | {
          /** The versioned global slug. */
          global: GlobalSlug;
          /** Field values to merge on top of the current draft/published row before publishing. */
          data?: Record<string, unknown>;
          /** Publish this history version's snapshot instead of the draft. */
          version?: number;
        }
    );

/**
 * Returns a `mutationFn` for publishing a VexCMS versioned collection
 * document's — or versioned global's — active draft.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.publish)`. A React hook
 * (the `use` prefix is REQUIRED, not just convention — a non-`use`-prefixed
 * wrapper around a hook call can be treated as a pure, memoizable function
 * by the React Compiler, silently dropping the internal hook call on a
 * later render and causing a hook-order mismatch crash; developer-reported,
 * confirmed live on the sibling `saveView`/`removeView` helpers). Call at
 * the top level of a React component, as its own statement, BEFORE
 * `useMutation` (not inlined as `useMutation`'s own `mutationFn` argument).
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `publish` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link PublishClientArgs} for the typed args shape.
 */
export function usePublish() {
  return useConvexMutation(vexConvexApi.versions.publish);
}
