import { useConvexMutation } from "@convex-dev/react-query";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, VexViewConfig, GenericMutationClientParams } from "@vexcms/core";

/**
 * Client-side args for {@link useSaveView}.
 *
 * @example
 * ```tsx
 * import { useSaveView, type SaveViewClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const saveViewMutationFn = useSaveView();
 * const { mutateAsync } = useMutation({ mutationFn: saveViewMutationFn });
 * const viewId = await mutateAsync({
 *   collection: "posts",
 *   view: {
 *     viewId: crypto.randomUUID(),
 *     name: "Featured",
 *     description: "Testimonials marked featured",
 *     state: { search: "featured" },
 *   },
 * });
 * ```
 */
export interface SaveViewClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug>
  extends GenericMutationClientParams {
  /** The collection slug the view belongs to. */
  collection: TCollectionSlug;
  /**
   * The view to save. `viewId` is client-generated — reuse the same id on a
   * second call to patch the view in place (the promotion dedupe, decision 14).
   * `description` is optional free text shown under the view's name (Step 12).
   * `state.where`, when present, must reference only fields the caller can
   * read — the server rejects anything else (decision 26).
   */
  view: VexViewConfig;
}

/**
 * Returns a `mutationFn` for creating or patching a shared view. Idempotent
 * on `view.viewId`. An insert requires `createView` on `collection`, a patch
 * requires `updateView` — throws `VexAccessError` server-side otherwise, as
 * does a `view.state.where` referencing a field the caller can't read (decision 26).
 *
 * Wraps `useConvexMutation(vexConvexApi.saveView)`. A React hook (the `use`
 * prefix is REQUIRED, not just convention — developer-reported crash: named
 * `saveView()` without it, `apps/test`'s `reactCompiler: true` treated the
 * call as a pure, memoizable function rather than a hook, so a later render
 * could skip re-invoking it and silently drop its internal `useConvexMutation`
 * call — a hook-order mismatch crash ("change in the order of Hooks"),
 * confirmed live). Call at the top level of a React component, as its own
 * statement, BEFORE `useMutation` (not inlined as `useMutation`'s own
 * `mutationFn` argument) — pass the returned function on as `mutationFn`.
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `saveView` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`,
 *   resolving to the saved view's `viewId`.
 * @see {@link SaveViewClientArgs} for the typed args shape.
 */
export function useSaveView() {
  return useConvexMutation(vexConvexApi.saveView);
}
