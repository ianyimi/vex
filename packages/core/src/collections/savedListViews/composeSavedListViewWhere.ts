import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";

/**
 * Composes a config view's hidden `where` with the caller's own filter into
 * the single plain `where` the client sends to `find`/`search` (Decision
 * 25). `find`/`search` take no `view` argument and know nothing about views
 * — the server only ever sees the result of this function, ANDed together
 * like any other caller `where`.
 *
 * `matchDeclaredSavedListViewFilter` (Step 6, SERVER-SIDE, inside `find`) is the one
 * place that re-derives which top-level AND part of the request `where` came
 * from a trusted config/default view — by deep-equality against the SAME
 * `viewWhere` this function composes from (the collection's own
 * `admin.view`/`admin.views`, resolved server-side from `VexConfig`, not
 * from anything the client sends). Changing the declared filter
 * client-side (dropping a condition, editing a value, nesting it in an
 * OR) breaks that deep-equality and the whole part falls back to the
 * ordinary field-read check (Decision 26).
 *
 * @param props - Input props.
 * @param props.viewWhere - The active config view's raw `where`
 *   (`VexViewConfig.state.where`, read straight off the bundled
 *   `VexClientConfig` — never a `VexClientViewConfig`, which has `where`
 *   stripped). Omitted when no view is active, or the active view has no
 *   hidden filter.
 * @param props.filter - The caller's own filter — the filter builder's
 *   compiled `VexWhereNode` from the URL's `filter` param. Omitted when the
 *   user hasn't added one.
 * @returns `{ and: [viewWhere, filter] }` when both are set, whichever one
 *   is set alone, or `undefined` when neither is set.
 */
export function composeSavedListViewWhere(props: {
  viewWhere?: VexWhereNodeOf<unknown>;
  filter?: VexWhereNodeOf<unknown>;
}): VexWhereNodeOf<unknown> | undefined {
  const { viewWhere, filter } = props;
  if (viewWhere !== undefined && filter !== undefined) return { and: [viewWhere, filter] };
  return viewWhere ?? filter;
}
