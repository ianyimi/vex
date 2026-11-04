"use client";

import { useListViewContext } from "../ListViewContext";
import { ListViewSearch } from "./ListViewSearch";

/**
 * The `vex.list.search` built-in — renders {@link ListViewSearch} wired to the
 * active list's `collection` and `urlState` (`q`/`qf`/`setQ`/`setQf`) from
 * `useListViewContext()`, so it never takes props of its own (mirrors every
 * other `list.*` built-in).
 *
 * @returns {@link ListViewSearch}, or `null` when no `searchField` entry is
 *   readable (handled inside `ListViewSearch` itself).
 */
export function ListViewSearchAction() {
  const list = useListViewContext();
  return (
    <ListViewSearch
      collection={list.collection}
      q={list.urlState.q ?? ""}
      qf={list.urlState.qf}
      onQChange={list.urlState.setQ}
      onQfChange={list.urlState.setQf}
      isFetching={list.isSearchFetching}
    />
  );
}
