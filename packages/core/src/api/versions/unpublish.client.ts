import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link unpublish}. A discriminated union, mirroring
 * `SaveDraftClientArgs`: pass `{ collection, id }` for a versioned
 * collection's document, or `{ global }` for a versioned global.
 *
 * @example
 * ```tsx
 * import { unpublish, type UnpublishClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: unpublish() });
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
 * Wraps `useConvexMutation(vexConvexApi.versions.unpublish)`. Call at the
 * top level of a React component (obeys the Rules of Hooks); pass the
 * return value as `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `unpublish` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link UnpublishClientArgs} for the typed args shape.
 */
export function unpublish() {
  return useConvexMutation(vexConvexApi.versions.unpublish);
}
