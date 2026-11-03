import type { GenericId } from "convex/values";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, GlobalSlug } from "@vexcms/core";
import type { GenericMutationClientParams } from "@vexcms/core";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link useUnpublish}. A discriminated union, mirroring
 * `SaveDraftClientArgs`: pass `{ collection, id }` for a versioned
 * collection's document, or `{ global }` for a versioned global.
 *
 * @example
 * ```tsx
 * import { useUnpublish, type UnpublishClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const unpublishMutationFn = useUnpublish();
 * const { mutateAsync } = useMutation({ mutationFn: unpublishMutationFn });
 * await mutateAsync({ collection: "posts", id: publishedId });
 * await mutateAsync({ global: "siteSettings" });
 * ```
 */
export type UnpublishClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  GenericMutationClientParams &
    (
      | {
          /** The versioned collection slug. */
          collection: TCollectionSlug;
          /** The currently-loaded document's id — the published row's id, in practice. */
          id: GenericId<TCollectionSlug>;
        }
      | {
          /** The versioned global slug. */
          global: GlobalSlug;
        }
    );

/**
 * Returns a `mutationFn` for unpublishing a VexCMS versioned collection's
 * document, or a versioned global.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.unpublish)`. A React hook
 * (the `use` prefix is REQUIRED, not just convention — a non-`use`-prefixed
 * wrapper around a hook call can be treated as a pure, memoizable function
 * by the React Compiler, silently dropping the internal hook call on a
 * later render and causing a hook-order mismatch crash; developer-reported,
 * confirmed live on the sibling `saveView`/`removeView` helpers). Call at
 * the top level of a React component, as its own statement, BEFORE
 * `useMutation` (not inlined as `useMutation`'s own `mutationFn` argument).
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `unpublish` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link UnpublishClientArgs} for the typed args shape.
 */
export function useUnpublish() {
  return useConvexMutation(vexConvexApi.versions.unpublish);
}
