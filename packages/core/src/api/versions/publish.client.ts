import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link publish}. A discriminated union: pass
 * `{ collection, id }` for a versioned collection's active draft, or
 * `{ global }` for a versioned global's.
 *
 * @example
 * ```tsx
 * import { publish, type PublishClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: publish() });
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
        }
      | {
          /** The versioned global slug. */
          global: GlobalSlug;
        }
    );

/**
 * Returns a `mutationFn` for publishing a VexCMS versioned collection
 * document's — or versioned global's — active draft.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.publish)`. Call at the top
 * level of a React component (obeys the Rules of Hooks); pass the return
 * value as `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `publish` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link PublishClientArgs} for the typed args shape.
 */
export function publish() {
  return useConvexMutation(vexConvexApi.versions.publish);
}
