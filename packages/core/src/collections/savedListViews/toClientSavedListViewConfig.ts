import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";
import type { VexClientViewConfig, VexViewConfig } from "../types";

/**
 * Counts the leaf conditions in a {@link VexWhereNodeOf} tree, walking
 * `and`/`or`/`not` recursively. One leaf is one condition a user would see
 * as one row in the filter builder, so this is what `hiddenFilterCount`
 * reports.
 *
 * @param node - The where tree, or a branch of it during recursion.
 * @returns The number of leaf conditions under `node`, inclusive.
 */
function countWhereLeaves(node: VexWhereNodeOf<unknown>): number {
  if ("and" in node) return node.and.reduce((sum, child) => sum + countWhereLeaves(child), 0);
  if ("or" in node) return node.or.reduce((sum, child) => sum + countWhereLeaves(child), 0);
  if ("not" in node) return countWhereLeaves(node.not);
  return 1;
}

/**
 * Converts a full {@link VexViewConfig} (a default or config view resolved
 * from `admin.view`/`admin.views`, `where` intact) into the {@link
 * VexClientViewConfig} shape UI code is allowed to read.
 *
 * Called CLIENT-SIDE only — by `useSavedListViews`, once per
 * `default`/`config`-source view read straight off the bundled
 * `VexClientConfig`. `state.where` already shipped to the browser as
 * plain JS before this ever runs (hidden from the UI, not secret, like
 * an access rule) — this function doesn't keep `where` out of the
 * bundle, it keeps UI CODE from reading it, so the filter builder,
 * chips, and every other control only ever see
 * `hasHiddenFilter`/`hiddenFilterCount`. The `listViews` query never
 * calls this — it returns `shared` views only. To actually QUERY a
 * default/config view, the list calls `composeSavedListViewWhere` on the RAW
 * `VexViewConfig`, not on this function's output.
 *
 * @param view - The full config-source view, `where` intact.
 * @returns The client-safe view: `where` replaced by `hasHiddenFilter`
 *   (whether `where` was set) and `hiddenFilterCount` (its leaf-condition
 *   count).
 */
export function toClientSavedListViewConfig<TFieldSlug extends string = string>(
  view: VexViewConfig<TFieldSlug>,
): VexClientViewConfig<TFieldSlug> {
  const { where, ...state } = view.state;
  return {
    viewId: view.viewId,
    name: view.name,
    description: view.description,
    state,
    hasHiddenFilter: where !== undefined,
    hiddenFilterCount: where === undefined ? 0 : countWhereLeaves(where),
  };
}
