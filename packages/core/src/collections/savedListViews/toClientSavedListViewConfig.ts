import type { VexClientViewConfig, VexViewConfig } from "../types";
import { splitWhereByReadability } from "./whereReadability";

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
 * bundle, it keeps UI CODE from reading it directly; `visibleWhere`
 * (the portion safe to show as a read-only, non-removable filter chip —
 * every condition on a field the CALLER can read) and
 * `hasHiddenFilter`/`hiddenFilterCount` (covering ONLY the conditions on
 * a field the caller can NOT read, via {@link splitWhereByReadability})
 * are the only parts of the original `where` UI code ever sees. A
 * condition on a readable field is never hidden just because some OTHER
 * condition in the same view names an unreadable one. The `listViews`
 * query never calls this — it returns `shared` views only. To actually
 * QUERY a default/config view, the list calls `composeSavedListViewWhere`
 * on the RAW `VexViewConfig`, not on this function's output.
 *
 * @param view - The full config-source view, `where` intact.
 * @param isFieldReadable - Whether the current caller may read one field
 *   (`isFieldReadable` from `@vexcms/core`'s `access` module, resolved
 *   against this view's own collection).
 * @returns The client-safe view: `where` replaced by `visibleWhere` (the
 *   readable portion, renderable as locked chips), `hasHiddenFilter`
 *   (whether any condition is on an unreadable field), and
 *   `hiddenFilterCount` (how many leaf conditions are).
 */
export function toClientSavedListViewConfig<TFieldSlug extends string = string>(
  view: VexViewConfig<TFieldSlug>,
  isFieldReadable: (field: string) => boolean,
): VexClientViewConfig<TFieldSlug> {
  const { where, ...state } = view.state;
  const split = where === undefined ? undefined : splitWhereByReadability(where, isFieldReadable);
  return {
    viewId: view.viewId,
    name: view.name,
    description: view.description,
    state,
    visibleWhere: split?.visible,
    hasHiddenFilter: (split?.hiddenCount ?? 0) > 0,
    hiddenFilterCount: split?.hiddenCount ?? 0,
  };
}
