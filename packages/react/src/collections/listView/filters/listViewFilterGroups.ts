import type { FilterOp, VexWhereNode } from "@vexcms/core";

/**
 * One AND-ed comparison within a {@link ListViewFilterGroup} — the `field`/`op`/
 * `value` leaf of a {@link VexWhereNode}, narrowed out of the union rather
 * than redeclared so a new operator added to core's `FilterOp` reaches the
 * filter builder without a second edit.
 */
export type ListViewFilterLeaf<S extends string = string> = Extract<VexWhereNode<S>, { field: string }>;

/** One OR-ed group of AND-ed leaves. `rows` is never empty once stored — an empty group is dropped by {@link fromListViewFilterGroups} and never produced by {@link toListViewFilterGroups}. */
export interface ListViewFilterGroup<S extends string = string> {
  readonly rows: readonly ListViewFilterLeaf<S>[];
}

/**
 * The filter builder's own shape: zero or more {@link ListViewFilterGroup}s,
 * OR-ed together, each AND-ing its own `rows` — "AND rows
 * within groups, OR between groups" DNF, flattened for a tree-free editor.
 * `groups: []` means no filter.
 */
export interface ListViewFilterGroups<S extends string = string> {
  readonly groups: readonly ListViewFilterGroup<S>[];
}

/**
 * The filter builder's **editor-level** operator vocabulary — core's
 * {@link FilterOp} (`eq neq gt gte lt lte`) plus two
 * list-only operators. `isEmpty`/`isNotEmpty` have no stored representation
 * of their own: a leaf with `op: "eq"`/`"neq"` and `value: undefined` IS an
 * empty/not-empty check (core `FilterOp` is unchanged, access rules are
 * unaffected). This type exists only so the operator `Select` can offer
 * and label them; the stored `ListViewFilterLeaf` never carries `"isEmpty"` /
 * `"isNotEmpty"` as its `op`.
 */
export type ListViewFilterOp = FilterOp | "isEmpty" | "isNotEmpty";

/**
 * Reads a stored leaf's operator back as the {@link ListViewFilterOp} the
 * operator `Select` should show selected — the inverse half of
 * {@link applyListFilterOp}.
 *
 * @param props - Input props.
 * @param props.leaf - The row's current stored leaf.
 * @returns `"isEmpty"` for `{ op: "eq", value: undefined }`, `"isNotEmpty"`
 *   for `{ op: "neq", value: undefined }`, else `leaf.op` unchanged.
 */
export function listFilterOpOf<S extends string>(props: { leaf: ListViewFilterLeaf<S> }): ListViewFilterOp {
  if (props.leaf.value === undefined && props.leaf.op === "eq") return "isEmpty";
  if (props.leaf.value === undefined && props.leaf.op === "neq") return "isNotEmpty";
  return props.leaf.op;
}

/**
 * Applies an operator `Select` change to a row, translating the
 * two editor-only operators into their stored `eq`/`neq`-with-no-value
 * form — the inverse half of {@link listFilterOpOf}.
 *
 * @param props - Input props.
 * @param props.leaf - The row's current stored leaf (field and value kept
 *   unless overridden below).
 * @param props.op - The operator just selected.
 * @returns A new leaf: `{ ...leaf, op: "eq", value: undefined }` for
 *   `"isEmpty"`; `{ ...leaf, op: "neq", value: undefined }` for
 *   `"isNotEmpty"`; `{ ...leaf, op }` otherwise — never mutates `props.leaf`.
 */
export function applyListFilterOp<S extends string>(props: {
  leaf: ListViewFilterLeaf<S>;
  op: ListViewFilterOp;
}): ListViewFilterLeaf<S> {
  if (props.op === "isEmpty") return { ...props.leaf, op: "eq", value: undefined } as unknown as ListViewFilterLeaf<S>;
  if (props.op === "isNotEmpty")
    return { ...props.leaf, op: "neq", value: undefined } as unknown as ListViewFilterLeaf<S>;
  return { ...props.leaf, op: props.op };
}

/**
 * Narrows a list of `and`/`or` members to plain leaves, or signals the list
 * isn't flat. Shared by {@link toListViewFilterGroups}'s top-level `and` case and its `or`
 * case (each `or` member that is itself an `and` must also be flat).
 *
 * @param nodes - The `and`/`or` array being checked.
 * @returns The leaves, in input order, or `null` if `nodes` is empty or
 *   contains any non-leaf (`and`/`or`/`not`) member.
 */
function flattenLeaves<S extends string>(
  nodes: readonly VexWhereNode<S>[],
): readonly ListViewFilterLeaf<S>[] | null {
  if (nodes.length === 0) return null;
  const leaves: ListViewFilterLeaf<S>[] = [];
  for (const node of nodes) {
    if ("field" in node) {
      leaves.push(node);
    } else {
      return null;
    }
  }
  return leaves;
}

/**
 * Converts a plain {@link VexWhereNode} into its {@link ListViewFilterGroups} editor
 * shape, or `null` when `where` is not already in one level of OR-of-AND
 * normal form — a config-authored `where` outside that shape
 * (a `not`, a nested `or`, an `and` mixing leaves with sub-trees) renders
 * read-only in `ListViewFilterBuilder` rather than being forced into a lossy
 * edit.
 *
 * @param props - Input props.
 * @param props.where - The current filter, or `undefined` for none.
 * @returns `{ groups: [] }` for `undefined`; one group for a bare leaf or a
 *   flat `and` of leaves; one group per `or` member for an `or` of leaves
 *   and/or flat `and`s; `null` for anything else (any `not`, any `and`/`or`
 *   with zero members, any `or` containing a nested `or`/`not`, or any `and`
 *   — top-level or nested inside an `or` — containing a non-leaf member).
 */
export function toListViewFilterGroups<S extends string = string>(props: {
  where: VexWhereNode<S> | undefined;
}): ListViewFilterGroups<S> | null {
  if (props.where === undefined) return { groups: [] };
  const where = props.where;
  if ("field" in where) {
    return { groups: [{ rows: [where] }] };
  }
  if ("and" in where) {
    const rows = flattenLeaves(where.and);
    if (rows === null) return null;
    return { groups: [{ rows }] };
  }
  if ("or" in where) {
    if (where.or.length === 0) return null;
    const groups: ListViewFilterGroup<S>[] = [];
    for (const member of where.or) {
      if ("field" in member) {
        groups.push({ rows: [member] });
      } else if ("and" in member) {
        const rows = flattenLeaves(member.and);
        if (rows === null) return null;
        groups.push({ rows });
      } else {
        return null;
      }
    }
    return { groups };
  }
  // "not" in where — no DNF representation this editor supports.
  return null;
}

/**
 * Collapses a {@link ListViewFilterGroups}'s groups into the simplest equivalent plain
 * {@link VexWhereNode} — the inverse of {@link toListViewFilterGroups}, and the form
 * `ListViewFilterBuilder` writes back through `onWhereChange` (and ultimately
 * the URL `filter` param, via `useListViewUrlState`'s `setFilter`).
 *
 * @param props - Input props.
 * @param props.groups - The editor's current groups. A group with zero
 *   `rows` is dropped before collapsing (never surfaces as `{ and: [] }`).
 * @returns `undefined` when every group is empty; the bare leaf when
 *   exactly one group with exactly one row remains; `{ and: rows }` for one
 *   group with 2+ rows; `{ or: [...] }`, one member per surviving group
 *   (itself a bare leaf or an `{ and: [...] }`), for 2+ surviving groups.
 */
export function fromListViewFilterGroups<S extends string = string>(props: {
  groups: readonly ListViewFilterGroup<S>[];
}): VexWhereNode<S> | undefined {
  const nonEmpty = props.groups.filter((group) => group.rows.length > 0);
  if (nonEmpty.length === 0) return undefined;
  const nodes: VexWhereNode<S>[] = nonEmpty.map((group) =>
    group.rows.length === 1 ? group.rows[0]! : ({ and: group.rows } as VexWhereNode<S>),
  );
  if (nodes.length === 1) return nodes[0];
  return { or: nodes } as VexWhereNode<S>;
}
