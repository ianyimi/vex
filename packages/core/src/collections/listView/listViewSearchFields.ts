import { isFieldAllowed } from "../../access";
import type { ResolvedFieldPermissions } from "../../access";
import type { CollectionConfig } from "../types";

/**
 * Resolves the READABLE subset of `collection.admin.view.state.searchFields`, in
 * config order (Decision 2: "the first entry is the default when the user
 * starts typing"; Decision 26: "the client hides unreadable fields from …
 * the search field picker"). Shared by {@link resolveListViewSearchField} and
 * `ListViewSearch`'s own field picker, so both agree on which fields exist —
 * `ListViewSearch` renders `null` when this is empty. Lives in `@vexcms/core`
 * (Design Decision 44), not `@vexcms/react`, specifically so `NextAdminPage`
 * (a server component) can call it directly — bundled next to a client
 * component (`CollectionListView`/`ListViewSearch`) would tag the whole chunk
 * `"use client"`, which Next.js refuses to invoke server-side.
 *
 * @param props - Input props.
 * @param props.collection - The collection whose `admin.view.state.searchFields` to filter.
 * @param props.fieldPermissions - The caller's resolved field-read permissions (`useFieldPermissions`).
 * @returns The readable search fields, in declared order.
 */
export function readableListViewSearchFields<TFieldSlug extends string = string>(props: {
  collection: CollectionConfig;
  fieldPermissions: ResolvedFieldPermissions;
}): TFieldSlug[] {
  return ((props.collection.admin.view.state.searchFields as readonly TFieldSlug[] | undefined) ?? []).filter(
    (f) => isFieldAllowed(props.fieldPermissions, f),
  );
}

/**
 * Resolves the ACTUAL search field a query should use — the single
 * resolution point `CollectionListView` (feeding `useVexListQuery`),
 * `ListViewSearch` (the field picker's displayed/default value), and
 * `NextAdminPage` (the server prefetch, Design Decision 44) all call, so
 * they can never disagree about which field `q` searches by default.
 *
 * Decision 9: "`qf` … omitted when it is the default field" — a URL with no
 * `qf` (or an invalid/unreadable one) must still resolve to a real,
 * readable field before reaching the server, never `undefined` while a
 * search is active (an `undefined` `searchField` with a non-empty `search`
 * is a hard error in `useVexListQuery`, Decision 3's config-time
 * guarantee that every `searchField` entry has a declared index only
 * covers the field NAMES, not a caller forgetting to default one).
 *
 * @param props - Input props.
 * @param props.collection - The collection whose `admin.view.state.searchFields` to resolve against.
 * @param props.qf - The URL's raw `qf`, or `undefined`.
 * @param props.fieldPermissions - The caller's resolved field-read permissions (`useFieldPermissions`).
 * @returns `qf` itself when it names a readable `searchField` entry; otherwise the first readable
 *   entry; `undefined` when NO entry is readable (search is unavailable — `ListViewSearch` renders
 *   nothing in that case, and the caller must not send a `search` query either).
 */
export function resolveListViewSearchField<TFieldSlug extends string = string>(props: {
  collection: CollectionConfig;
  qf: TFieldSlug | undefined;
  fieldPermissions: ResolvedFieldPermissions;
}): TFieldSlug | undefined {
  const readable = readableListViewSearchFields<TFieldSlug>({
    collection: props.collection,
    fieldPermissions: props.fieldPermissions,
  });
  if (readable.length === 0) return undefined;
  if (props.qf !== undefined && readable.includes(props.qf)) return props.qf;
  return readable[0];
}
