import { ADMIN_FIELDS, getDataFields } from "../../fields";
import { columnEntriesEqual, completeListViewColumnOrder } from "./listViewColumnOrder";
import { columnEntryField, type ColumnEntry, type CollectionConfig, type VexViewState } from "../types";
import { VERSION_SYSTEM_FIELDS } from "../../versions";
import type { VexWhereNode } from "../../db/queryArgs";

/** A saved view's source, matching the `view=<source>:<id>` URL prefix. */
export type ListViewSource = "config" | "shared" | "local";

/** The portable `{ field, order }` sort shape, restricted to the collection's own field slugs plus `_creationTime`. */
export interface ListViewSort<TFieldSlug extends string = string> {
  field: TFieldSlug | "_creationTime";
  order: "asc" | "desc";
}

/**
 * The collection list's full URL state, decoded from the compact
 * query-param grammar: `q`, `qf` (omitted when it's the
 * default field), `sort=<field>.<asc|desc>`, `filter=(<field>.<op>.<value>,…)|(…)`,
 * `size` (omitted at the default), `view=<config|shared|local>:<id>`, `peek=<id>`,
 * `cols=<field>[:w<width>][:pl|:pr][:h],<field>…` (the full column list —
 * order, width, pin side, and hidden state, one entry per field — omitted
 * when it matches the active view's own resolved array).
 *
 * Lives in `@vexcms/core`, pure and dependency-free of react
 * or any UI library — `NextAdminPage` and `useListViewUrlState`
 * (the react wrapper) both call `parseListViewUrlState`/
 * `serializeListViewUrlState` directly, so the server's prefetch args and the
 * client's query args are built from one implementation, never two that
 * could drift.
 *
 * @typeParam TFieldSlug - The collection's own field slugs.
 */
export interface ListViewUrlState<TFieldSlug extends string = string> {
  /**
   * Raw search text (`?q=`). `undefined` means absent from the URL —
   * inherit the active view's own saved search.
   * `""` means the user explicitly cleared it (distinct from absent —
   * Clearing search on a view with its own saved
   * search must NOT silently re-inherit that saved text). A non-empty
   * string is an explicit search term.
   */
  q: string | undefined;
  /** The active search field (`?qf=`), or `undefined` to fall back to the active view's own `searchField`, then `collection.admin.view.state.searchField`. */
  qf: TFieldSlug | undefined;
  /** Portable sort (`?sort=`), or `undefined` to fall back to `collection.admin.view.state.sort`. While `q !== ""`, callers must ignore this rather than send it to the server — this hook still parses and returns it (the park is a rendering/query-building concern, not a URL-state one). */
  sort: ListViewSort<TFieldSlug> | undefined;
  /**
   * The filter (`?filter=`), decoded into a plain `VexWhereNode`.
   * `undefined` means absent from the URL — inherit the active view's
   * own saved `where`. `null` means the user
   * explicitly cleared it (distinct from absent —
   * "Clear all" on a view with its own saved filter must NOT silently
   * re-inherit that saved filter). An object is an explicit filter.
   */
  filter: VexWhereNode<TFieldSlug> | undefined | null;
  /** Page size (`?size=`), or `undefined` to fall back to `collection.admin.view.state.pageSize`. */
  size: number | undefined;
  /** The active saved view, as the raw `<source>:<id>` string (`?view=`), or `undefined` for none. This module splits it into `source`/`id` elsewhere; this field keeps it opaque. */
  view: string | undefined;
  /** The Inspect peek's open document id (`?peek=`), or `undefined` when the peek is closed. */
  peek: string | undefined;
  /**
   * Full column list (`?cols=<field>[:w<width>][:pl|:pr][:h],…`) — every entry's field URI-component-encoded, suffixes (when
   * present) always in that fixed order: `w<width>` (pixels), then `pl`/
   * `pr` (pinned left/right — mutually exclusive, at most one), then `h`
   * (hidden). `undefined` falls back to the active view's own `columns`,
   * then `collection.admin.view.state.columns` (`resolveListViewQueryState`'s/
   * `completeListViewColumnOrder`'s job, not this module's — a parsed `cols` here
   * may be a PARTIAL list, same as an old stored view's `columns`;
   * completion happens downstream). Replaces the earlier plain
   * bare-field-list grammar entirely — a breaking format change, no
   * back-compat shim; a
   * pre-Part-B `cols=<field>,<field>` URL still parses (every token with
   * no `:` suffix is just a bare field), it simply carries no width/pin/
   * hidden overrides, same as any other bare-slug entry.
   */
  cols: ColumnEntry<TFieldSlug>[] | undefined;
}

/**
 * The filter row's `<op>` token set this URL grammar accepts — the six
 * comparisons plus two list-only, no-value operators. Not
 * `ListViewFilterOp` from a dedicated `listViewFilterGroups.ts`: that module doesn't exist
 * in this codebase, and this module only needs the literal token set, not the
 * editor's richer type (`isEmpty`/`isNotEmpty` compile straight down to
 * `eq`/`neq` with `value: undefined` here, same rule).
 */
const URL_FILTER_OPS = ["eq", "neq", "gt", "gte", "lt", "lte", "isEmpty", "isNotEmpty"] as const;
type UrlFilterOp = (typeof URL_FILTER_OPS)[number];

/** How a field's filter value is encoded in the `<value>` URL segment. */
type FilterValueKind = "number" | "boolean" | "date" | "string";

/**
 * Resolves a filter row's field to its {@link FilterValueKind}.
 * Relationship IDs are classified `"string"` too — Convex ids never contain
 * the grammar's delimiter characters, so `encodeURIComponent` round-trips
 * them as a no-op, and a dedicated kind would just duplicate the `"string"`
 * branch.
 *
 * @param props - Input props.
 * @param props.collection - Resolves `field`'s type, except the built-in
 *   `"vex_status"` filter field, which isn't a real data
 *   field and is hardcoded to `"string"`.
 * @param props.field - The filter row's field key.
 * @returns The value kind, or `undefined` when `field` is neither
 *   `"vex_status"` nor a data field on `collection` — the caller drops the row.
 */
function filterValueKindForField(props: {
  collection: CollectionConfig;
  field: string;
}): FilterValueKind | undefined {
  if (props.field === "vex_status") return "string";
  const fieldDef = getDataFields({ fields: props.collection.fields })[props.field];
  if (fieldDef === undefined) return undefined;
  if (fieldDef.type === ADMIN_FIELDS.number.type) return "number";
  if (fieldDef.type === ADMIN_FIELDS.checkbox.type) return "boolean";
  if (fieldDef.type === ADMIN_FIELDS.date.type || fieldDef.type === ADMIN_FIELDS.commitTs.type) return "date";
  return "string";
}

/**
 * Encodes one filter leaf's `value` into its `<value>` URL segment, per {@link FilterValueKind}.
 *
 * @returns `String(value)` for `"number"`, `"true"`/`"false"` for `"boolean"`,
 *   an ISO-8601 string for `"date"`, or `encodeURIComponent(String(value))` for `"string"`.
 */
function encodeFilterValue(props: { kind: FilterValueKind; value: unknown }): string {
  switch (props.kind) {
    case "number":
      return String(props.value);
    case "boolean":
      return props.value ? "true" : "false";
    case "date":
      return new Date(props.value as number).toISOString();
    case "string":
      return encodeURIComponent(String(props.value));
  }
}

/**
 * Decodes one filter leaf's `<value>` URL segment back into its stored value, per {@link FilterValueKind}, or `undefined` when `raw` doesn't parse for that kind (a `"string"` kind's legitimately-empty decode is `""`, never `undefined` — only an actual failure returns `undefined`).
 *
 * @returns The decoded `number`/`boolean`/timestamp `number`/`string`, or
 *   `undefined` when `raw` fails to parse for `kind` (an un-decodable
 *   `"string"` segment, a non-numeric `"number"`, an unrecognized
 *   `"boolean"` literal, or an unparseable `"date"`).
 */
function decodeFilterValue(props: { kind: FilterValueKind; raw: string }): unknown {
  switch (props.kind) {
    case "number": {
      const parsed = Number(props.raw);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    case "boolean":
      if (props.raw === "true") return true;
      if (props.raw === "false") return false;
      return undefined;
    case "date": {
      const parsed = Date.parse(props.raw);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    case "string":
      try {
        return decodeURIComponent(props.raw);
      } catch {
        return undefined;
      }
  }
}

/**
 * Parses one `<field>.<op>.<value>` (or `<field>.<op>` for `isEmpty`/
 * `isNotEmpty`) filter row into a plain `VexWhereNode` leaf.
 *
 * Splits on the FIRST two `.` only — `<value>` is everything after the
 * second dot, kept intact even if it itself contains dots (an ISO datetime
 * value such as `2026-09-01T00:00:00.000Z` has one).
 *
 * @param props - Input props.
 * @param props.row - One row's raw string, already split out of its group.
 * @param props.collection - Resolves the field's {@link FilterValueKind}.
 * @returns The leaf, or `undefined` for anything malformed — an unknown
 *   field, an unrecognized op, a missing value for a value-bearing op, a
 *   stray value for `isEmpty`/`isNotEmpty`, or a value that fails
 *   {@link decodeFilterValue} — dropped silently, never thrown.
 */
function parseFilterRow<S extends string>(props: {
  row: string;
  collection: CollectionConfig;
}): Extract<VexWhereNode<S>, { field: string }> | undefined {
  const firstDot = props.row.indexOf(".");
  if (firstDot === -1) return undefined;
  const field = props.row.slice(0, firstDot);
  const rest = props.row.slice(firstDot + 1);
  const secondDot = rest.indexOf(".");
  let op: string;
  let rawValue: string | undefined;
  if (secondDot === -1) {
    op = rest;
    rawValue = undefined;
  } else {
    op = rest.slice(0, secondDot);
    rawValue = rest.slice(secondDot + 1);
  }
  if (!URL_FILTER_OPS.includes(op as UrlFilterOp)) return undefined;
  if (op === "isEmpty" || op === "isNotEmpty") {
    if (rawValue !== undefined) return undefined;
    return { field, op: op === "isEmpty" ? "eq" : "neq", value: undefined } as Extract<
      VexWhereNode<S>,
      { field: string }
    >;
  }
  if (rawValue === undefined) return undefined;
  const kind = filterValueKindForField({ collection: props.collection, field });
  if (kind === undefined) return undefined;
  const value = decodeFilterValue({ kind, raw: rawValue });
  if (value === undefined) return undefined;
  return { field, op, value } as Extract<VexWhereNode<S>, { field: string }>;
}

/**
 * Serializes one leaf back into its `<field>.<op>.<value>` row — the
 * inverse of {@link parseFilterRow}.
 *
 * @param props - Input props.
 * @param props.leaf - The leaf, matched structurally against `{ field; op;
 *   value }` shape of a filter editor leaf — not imported, this file
 *   predates a dedicated `listViewFilterGroups.ts` module.
 * @param props.collection - Resolves the field's {@link FilterValueKind}.
 * @returns The row string, or `undefined` when the field isn't resolvable
 *   (defensive — the filter builder never produces such a leaf).
 */
function serializeFilterRow(props: {
  leaf: { field: string; op: string; value: unknown };
  collection: CollectionConfig;
}): string | undefined {
  if (props.leaf.value === undefined) {
    if (props.leaf.op === "eq") return `${props.leaf.field}.isEmpty`;
    if (props.leaf.op === "neq") return `${props.leaf.field}.isNotEmpty`;
    return `${props.leaf.field}.${props.leaf.op}`;
  }
  const kind = filterValueKindForField({ collection: props.collection, field: props.leaf.field });
  if (kind === undefined) return undefined;
  return `${props.leaf.field}.${props.leaf.op}.${encodeFilterValue({ kind, value: props.leaf.value })}`;
}

/**
 * Parses the whole `?filter=` value into a plain `VexWhereNode`, collapsing
 * groups the same way a future `listViewFilterGroups.ts#fromListViewFilterGroups` will — duplicated
 * here rather than imported, since `listViewFilterGroups.ts` doesn't exist
 * yet; both codecs independently converge on the same plain-node shape.
 *
 * @param props - Input props.
 * @param props.raw - The raw `?filter=` value. `URLSearchParams` has
 *   already undone the OUTER query-string percent-encoding; the grammar's
 *   own `,`/`|`/`(`/`)` structural characters are intact, and each
 *   `"string"`-kind row's `<value>` segment is still `encodeURIComponent`-
 *   encoded exactly once (see {@link decodeFilterValue}).
 * @param props.collection - Resolves each row's field type.
 * @returns `undefined` for an empty/all-invalid filter; the bare leaf for
 *   one surviving group of one row; `{ and }` for one group of 2+ rows;
 *   `{ or }` for 2+ surviving groups (mirrors `fromDnf`'s own collapsing).
 */
function parseFilterParam<S extends string>(props: {
  raw: string;
  collection: CollectionConfig;
}): VexWhereNode<S> | undefined {
  if (props.raw === "") return undefined;
  const groupStrings = props.raw.split("|");
  const survivingRowArrays: Extract<VexWhereNode<S>, { field: string }>[][] = [];
  for (const groupString of groupStrings) {
    if (!groupString.startsWith("(") || !groupString.endsWith(")")) continue;
    const inner = groupString.slice(1, -1);
    const rowStrings = inner === "" ? [] : inner.split(",");
    const rows = rowStrings
      .map((row) => parseFilterRow<S>({ row, collection: props.collection }))
      .filter((leaf): leaf is NonNullable<typeof leaf> => leaf !== undefined);
    if (rows.length === 0) continue;
    survivingRowArrays.push(rows);
  }
  if (survivingRowArrays.length === 0) return undefined;
  const nodes = survivingRowArrays.map((rows) =>
    rows.length === 1 ? rows[0]! : ({ and: rows } as VexWhereNode<S>),
  );
  if (nodes.length === 1) return nodes[0];
  return { or: nodes } as VexWhereNode<S>;
}

/**
 * Serializes a plain `VexWhereNode` into the `?filter=` grammar — the
 * inverse of {@link parseFilterParam}, restricted to the three shapes the
 * filter builder ever produces: a bare leaf, a flat `{ and:
 * leaves }`, or `{ or: (leaf | { and: leaves })[] }`.
 *
 * @param props - Input props.
 * @param props.where - The filter to serialize, or `undefined`.
 * @param props.collection - Resolves each leaf's field type.
 * @returns The grammar string, or `undefined` for `undefined`/an
 *   unrepresentable shape (a `not`, a nested `or`/`and`, or any leaf whose
 *   {@link serializeFilterRow} itself fails) — the caller OMITS the `filter`
 *   key entirely rather than writing a broken URL.
 */
function serializeFilterParam(props: {
  where: VexWhereNode<string> | undefined;
  collection: CollectionConfig;
}): string | undefined {
  if (props.where === undefined) return undefined;
  type Leaf = { field: string; op: string; value: unknown };
  let groups: Leaf[][];
  if ("field" in props.where) {
    groups = [[props.where as unknown as Leaf]];
  } else if ("and" in props.where) {
    const members = props.where.and;
    if (!members.every((member) => "field" in member)) return undefined;
    groups = [members as unknown as Leaf[]];
  } else if ("or" in props.where) {
    groups = [];
    for (const member of props.where.or) {
      if ("field" in member) {
        groups.push([member as unknown as Leaf]);
      } else if ("and" in member && member.and.every((row) => "field" in row)) {
        groups.push(member.and as unknown as Leaf[]);
      } else {
        return undefined;
      }
    }
  } else {
    return undefined;
  }
  const rowStrings: string[][] = [];
  for (const group of groups) {
    const rows: string[] = [];
    for (const leaf of group) {
      const row = serializeFilterRow({ leaf, collection: props.collection });
      if (row === undefined) return undefined;
      rows.push(row);
    }
    rowStrings.push(rows);
  }
  return rowStrings.map((rows) => `(${rows.join(",")})`).join("|");
}

/**
 * Parses one `<field>[:w<width>][:pl|:pr][:h]` `cols=` token into a
 * {@link ColumnEntry} — the field is URI-component-decoded
 * and checked against `dataFieldKeys` first (an unknown/undecodable field
 * drops the WHOLE token, never half-applies its suffixes to a bogus
 * field); a token with no suffixes at all decodes to the bare-slug shape.
 * Suffix order in the URL is NOT enforced here (`w200:pl` and `pl:w200`
 * both parse identically) — only {@link serializeColumnEntryToken} commits
 * to one canonical order, so a hand-edited or legacy URL still parses.
 *
 * @param props - Input props.
 * @param props.raw - One comma-separated token, not yet split on `:`.
 * @param props.dataFieldKeys - The collection's own valid field keys.
 * @returns The decoded entry, or `undefined` when the field segment is
 *   missing, undecodable, or not a real field on this collection.
 */
function parseColumnEntryToken<TFieldSlug extends string>(props: {
  raw: string;
  dataFieldKeys: string[];
}): ColumnEntry<TFieldSlug> | undefined {
  const segments = props.raw.split(":");
  const fieldSegment = segments[0];
  if (fieldSegment === undefined || fieldSegment === "") return undefined;
  let field: string;
  try {
    field = decodeURIComponent(fieldSegment);
  } catch {
    return undefined;
  }
  if (!props.dataFieldKeys.includes(field)) return undefined;
  const overrides: { width?: number; pinned?: "left" | "right"; hidden?: boolean } = {};
  for (const suffix of segments.slice(1)) {
    if (suffix.startsWith("w")) {
      const width = Number(suffix.slice(1));
      if (Number.isFinite(width) && width > 0) overrides.width = width;
    } else if (suffix === "pl") {
      overrides.pinned = "left";
    } else if (suffix === "pr") {
      overrides.pinned = "right";
    } else if (suffix === "h") {
      overrides.hidden = true;
    }
  }
  if (Object.keys(overrides).length === 0) return field as TFieldSlug;
  return { field: field as TFieldSlug, ...overrides };
}

/**
 * Serializes one {@link ColumnEntry} back into its `cols=` token — the
 * inverse of {@link parseColumnEntryToken}, always emitting suffixes in
 * the ONE canonical order the grammar documents: `w<width>`, then `pl`/
 * `pr`, then `h`. A bare-slug entry (or an object entry with every
 * override unset) serializes to just the encoded field, identical to
 * the earlier plain grammar's bare-slug output for that case.
 *
 * @param entry - A bare field slug, or an object entry carrying overrides.
 * @returns The `cols=` token: the URI-component-encoded field, followed by
 *   any `:w<width>`/`:pl`/`:pr`/`:h` suffixes `entry` sets.
 */
function serializeColumnEntryToken(entry: ColumnEntry<string>): string {
  if (typeof entry === "string") return encodeURIComponent(entry);
  let token = encodeURIComponent(entry.field);
  if (entry.width !== undefined) token += `:w${entry.width}`;
  if (entry.pinned === "left") token += ":pl";
  else if (entry.pinned === "right") token += ":pr";
  if (entry.hidden) token += ":h";
  return token;
}

/**
 * Parses the collection list's full compact-grammar URL state.
 *
 * @param props - Input props.
 * @param props.searchParams - The raw `q`/`qf`/`sort`/`filter`/`size`/
 *   `view`/`peek` params. A key absent from `searchParams` is treated the
 *   same as "not set".
 * @param props.collection - Constrains `qf`/`sort.field` to the
 *   collection's own fields and `size` to `admin.view.state.pageSizeOptions`.
 * @returns The parsed state. Every field is independently validated — one
 *   malformed param never affects another — and a malformed value is
 *   DROPPED (falls back to its default/`undefined`), never thrown.
 */
export function parseListViewUrlState<TFieldSlug extends string = string>(props: {
  searchParams: URLSearchParams;
  collection: CollectionConfig;
}): ListViewUrlState<TFieldSlug> {
  const qRaw = props.searchParams.get("q");
  const q = qRaw === null ? undefined : qRaw;
  // `_creationTime` plus `collection`'s own data-field keys — the valid `sort.field` universe.
  const dataFieldKeys = Object.keys(getDataFields({ fields: props.collection.fields }));

  const qfRaw = props.searchParams.get("qf");
  const searchFields: readonly string[] = props.collection.admin.view.state.searchFields ?? [];
  const qf =
    qfRaw !== null && searchFields.includes(qfRaw) ? (qfRaw as TFieldSlug) : undefined;

  const sortRaw = props.searchParams.get("sort");
  let sort: ListViewSort<TFieldSlug> | undefined;
  if (sortRaw !== null) {
    const match = /^(.+)\.(asc|desc)$/.exec(sortRaw);
    if (match && (match[1] === "_creationTime" || dataFieldKeys.includes(match[1]!))) {
      sort = { field: match[1] as TFieldSlug | "_creationTime", order: match[2] as "asc" | "desc" };
    }
  }

  const filterRaw = props.searchParams.get("filter");
  const filter: VexWhereNode<TFieldSlug> | undefined | null =
    filterRaw === null
      ? undefined
      : filterRaw === ""
        ? null
        : (parseFilterParam<TFieldSlug>({ raw: filterRaw, collection: props.collection }) ?? undefined);

  const sizeRaw = props.searchParams.get("size");
  const size =
    sizeRaw !== null && props.collection.admin.view.state.pageSizeOptions.includes(Number(sizeRaw))
      ? Number(sizeRaw)
      : undefined;

  const viewRaw = props.searchParams.get("view");
  const view = viewRaw !== null && /^(config|shared|local):.+$/.test(viewRaw) ? viewRaw : undefined;

  const peek = props.searchParams.get("peek") ?? undefined;

  // `vex_status` is a valid `cols=` field on a versioned collection ONLY
  // (resizing/pinning/hiding it
  // via a `cols=` token used to silently drop the whole token here, the
  // same validation gate that keeps an unknown/foreign field out) —
  // `dataFieldKeys` alone (declared data fields only) stays the universe
  // for `sort.field` above, which this synthetic column never joins
  // (`enableSorting` stays `false`, no server-side sort-by-status wiring
  // exists).
  const colsFieldKeys = props.collection.versions.drafts
    ? [...dataFieldKeys, VERSION_SYSTEM_FIELDS.status.slug]
    : dataFieldKeys;
  const colsRaw = props.searchParams.get("cols");
  let cols: ColumnEntry<TFieldSlug>[] | undefined;
  if (colsRaw !== null && colsRaw !== "") {
    const seenFields = new Set<string>();
    const decoded: ColumnEntry<TFieldSlug>[] = [];
    for (const token of colsRaw.split(",")) {
      const entry = parseColumnEntryToken<TFieldSlug>({ raw: token, dataFieldKeys: colsFieldKeys });
      if (entry === undefined) continue;
      const field = columnEntryField<TFieldSlug>(entry);
      if (seenFields.has(field)) continue;
      seenFields.add(field);
      decoded.push(entry);
    }
    if (decoded.length > 0) cols = decoded;
  }

  return { q, qf, sort, filter, size, view, peek, cols };
}

/**
 * Serializes a (possibly partial) collection list state back into the
 * compact-grammar URL params — the inverse of {@link
 * parseListViewUrlState}, and also how `ListViewCopyLinkButton`
 * builds a fully self-contained link for a local view.
 *
 * @param props - Input props.
 * @param props.params - The full state to serialize.
 * @param props.collection - Resolves the `qf`/`sort`/`size`/`cols`
 *   defaults (`admin.view.state`) and each filter leaf's field type.
 * @param props.viewState - The active declared (`default`/`config`) or
 *   `shared` view's own saved state — omit for a `local`-source view
 *   (its full state always stays in the URL, even where it
 *   happens to coincide with the collection's default — there's no
 *   server-side row to fall back to for it) or when no view has resolved
 *   yet. Every field below is omitted once it equals `viewState?.<field>
 *   ?? collection.admin.view.state.<field>` — the EXACT inverse of
 *   `resolveListViewQueryState`'s own `params.<field> ?? viewState?.<field> ??
 *   collection.admin.view.state.<field>`
 *   merge, so a written URL always round-trips to the
 *   identical resolved state instead of re-asserting a param that was
 *   already implied by the active view.
 * @returns A `URLSearchParams` with only the non-baseline keys set —
 *   every falsy/`undefined` field is simply absent, omitted
 *   when it's the default.
 */
export function serializeListViewUrlState(props: {
  params: Partial<ListViewUrlState<string>>;
  collection: CollectionConfig;
  viewState?: VexViewState<string>;
}): URLSearchParams {
  const out = new URLSearchParams();
  if (props.params.q !== undefined) out.set("q", props.params.q);

  const qfBaseline = props.viewState?.searchField ?? props.collection.admin.view.state.searchField;
  if (props.params.qf !== undefined && props.params.qf !== qfBaseline) {
    out.set("qf", props.params.qf);
  }

  const sortBaseline = props.viewState?.sort ?? props.collection.admin.view.state.sort;
  if (
    props.params.sort !== undefined &&
    (props.params.sort.field !== sortBaseline.field || props.params.sort.order !== sortBaseline.order)
  ) {
    out.set("sort", `${props.params.sort.field}.${props.params.sort.order}`);
  }

  if (props.params.filter === null) {
    // Explicit clear sentinel: the user removed the
    // view's own filter, distinct from never having touched it at all —
    // `filter=` present-but-empty, not absent. `resolveListViewQueryState`'s
    // own `params.filter !== undefined ? ... : viewState?.where` reads
    // this as "the user wants no filter," never re-inheriting the view's.
    out.set("filter", "");
  } else {
    const filterParam = serializeFilterParam({
      where: props.params.filter,
      collection: props.collection,
    });
    if (filterParam !== undefined) out.set("filter", filterParam);
  }

  const sizeBaseline = props.viewState?.pageSize ?? props.collection.admin.view.state.pageSize;
  if (props.params.size !== undefined && props.params.size !== sizeBaseline) {
    out.set("size", String(props.params.size));
  }
  if (props.params.view) out.set("view", props.params.view);
  if (props.params.peek) out.set("peek", props.params.peek);

  // Omitted when it matches the active view's own FULL,
  // completed column array — order, width, pin, hidden, every field.
  // `params.cols` now ALWAYS carries the full array (never a visible-only
  // subset the way the earlier grammar did — `CollectionListView`'s
  // `columns` state is always `completeListViewColumnOrder`'d before it ever
  // reaches `setCols`), so completing BOTH sides before comparing is what
  // makes this diff ever match a real, unmodified write — the OPPOSITE of
  // the earlier "never complete the baseline" rule (its own comment,
  // superseded): that rule existed specifically because ITS `cols=` was a
  // subset, so completing only the baseline would almost never match.
  const colsBaseline = completeListViewColumnOrder({
    order: props.viewState?.columns ?? props.collection.admin.view.state.columns,
    collection: props.collection,
  });
  if (props.params.cols !== undefined && !columnEntriesEqual(props.params.cols, colsBaseline)) {
    out.set("cols", props.params.cols.map(serializeColumnEntryToken).join(","));
  }
  return out;
}
