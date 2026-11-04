import { VERSION_SYSTEM_FIELDS, type AdminDataField } from "@vexcms/core";
import type { ListViewFilterOp } from "./listViewFilterGroups";

/**
 * Operator choices the filter builder offers, keyed by every {@link ListViewFilterOp}
 * — each label pairs a symbol with
 * its op CODE ("= eq", "≥ gte", …), shown identically in the operator `Select`'s
 * option list, as its selected value, and in `ListViewFilterChips`' chip text (which
 * imports this same map) — one notation everywhere. `gt`/`lt` keep entries here
 * even though the builder no longer OFFERS them as new choices (see
 * {@link listViewFilterOpsForFieldType}): a `where` built earlier, or
 * a hand-authored saved view, can still carry one, and it must render with its
 * own code rather than being silently relabelled or dropped.
 *
 * `isEmpty`/`isNotEmpty` drop the "is"/"Not"
 * words, keeping only "empty" — the `!` already reads as a negation on its own
 * (same convention the rest of this map already leans on, e.g. `≠`/`!=`), so
 * `!∅ empty` still reads unambiguously as "is not empty" without the extra
 * width `!∅ isNotEmpty` cost. This also keeps the operator column the
 * narrowest one in the row's fixed grid template.
 */
export const LIST_VIEW_FILTER_OP_LABELS: Record<ListViewFilterOp, string> = {
  eq: "= eq",
  neq: "≠ neq",
  gt: "> gt",
  gte: "≥ gte",
  lt: "< lt",
  lte: "≤ lte",
  isEmpty: "∅ empty",
  isNotEmpty: "!∅ empty",
};

/** The synthetic field key for the built-in `vex_status` filter — never a real `AdminDataField` key, so it is injected rather than declared on any collection. */
export const LIST_VIEW_FILTER_STATUS_FIELD_KEY = VERSION_SYSTEM_FIELDS.status.slug;

/**
 * Per-field-type operator
 * matrix — the builder's own minimal, no-derivable-duplicates op set, one
 * entry per `AdminDataField["type"]` the builder dispatches a value control
 * for. `gt`/`lt` are deliberately absent from every entry (their `gte`/`lte`
 * siblings cover the same comparison without a redundant inverse pair) —
 * core `FilterOp` itself is unchanged, so access rules, the URL codec, and
 * a stored saved view are unaffected; only the builder's own NEW-row
 * choices narrowed. `date` drops `eq`/`neq` too — an exact-millisecond
 * match on a timestamp is never what a user means, so only the ordering
 * comparisons plus the two value-less operators are offered. Every other
 * declared type not listed here (`text`, `email`, `textarea`, `url`,
 * `select`, `checkbox`, `relationship`, `color`, …) falls back to
 * {@link LIST_VIEW_FILTER_DEFAULT_OPS}. The synthetic `vex_status` field is
 * looked up by its own KEY, not through this type-keyed map — see
 * {@link listViewFilterOpsForFieldType}.
 *
 * `json`/`richtext`/`array`/`blocks`/`group` are explicit entries too
 * (bug fix): these five structured-data types used to fall
 * through to {@link LIST_VIEW_FILTER_DEFAULT_OPS}'s `eq`/`neq`, offering a
 * comparison against a structured value that was never meaningful and had
 * no matching value control (`fieldToFilterInputComponent` registers none
 * for them) — now they list ONLY the two value-less operators, matching
 * the control-free row `ListViewFilterBuilder`'s own call site already
 * renders for any op with no registered input.
 */
export const LIST_VIEW_FILTER_OPS_BY_FIELD_TYPE: Record<string, ListViewFilterOp[]> = {
  number: ["eq", "neq", "gte", "lte", "isEmpty", "isNotEmpty"],
  date: ["gte", "lte", "isEmpty", "isNotEmpty"],
  commitTs: ["gte", "lte", "isEmpty", "isNotEmpty"],
  json: ["isEmpty", "isNotEmpty"],
  richtext: ["isEmpty", "isNotEmpty"],
  array: ["isEmpty", "isNotEmpty"],
  blocks: ["isEmpty", "isNotEmpty"],
  group: ["isEmpty", "isNotEmpty"],
};

/** Every field type NOT listed in {@link LIST_VIEW_FILTER_OPS_BY_FIELD_TYPE} — equality plus the two value-less operators. No ordering comparisons: "greater than" has no meaning for text, a checkbox, a relationship, or a select. */
const LIST_VIEW_FILTER_DEFAULT_OPS: ListViewFilterOp[] = ["eq", "neq", "isEmpty", "isNotEmpty"];

/**
 * `vex_status`'s own operator set — justification for NOT reusing
 * {@link LIST_VIEW_FILTER_DEFAULT_OPS}'s `isEmpty`/`isNotEmpty`: a version
 * status is always exactly `"draft"` or `"published"` on every row of a
 * versioned collection (never unset), so an emptiness check could never
 * match anything, and there is no meaningful "greater/less than" between
 * two status values either. Only equality and its inverse are offered.
 */
const LIST_VIEW_FILTER_STATUS_OPS: ListViewFilterOp[] = ["eq", "neq"];

/**
 * Which {@link ListViewFilterOp}s a field's `Select` OFFERS as new choices, by
 * field type (or, for the synthetic `vex_status` field, by key) — see
 * {@link LIST_VIEW_FILTER_OPS_BY_FIELD_TYPE}'s own doc for the matrix and why
 * `gt`/`lt` are absent. This governs only what a user can newly PICK: a row
 * whose CURRENT op isn't in this list (a `gt`/`lt` row from before this
 * revision, or from a hand-authored URL/saved view) is never silently
 * dropped or relabelled — the caller (`ListViewFilterBuilder`'s own render)
 * adds that one extra op to what it actually renders, so the row keeps
 * displaying and querying with its real operator.
 *
 * @param props - Input props.
 * @param props.type - The field's `AdminDataField["type"]`.
 * @param props.field - The row's field key — checked first, so the
 *   synthetic `vex_status` key (itself typed `"select"`) resolves to
 *   {@link LIST_VIEW_FILTER_STATUS_OPS} instead of a real `select` field's set.
 * @returns The operators to render, in {@link LIST_VIEW_FILTER_OP_LABELS} order.
 */
export function listViewFilterOpsForFieldType(props: {
  type: AdminDataField["type"];
  field?: string;
}): ListViewFilterOp[] {
  if (props.field === LIST_VIEW_FILTER_STATUS_FIELD_KEY) return LIST_VIEW_FILTER_STATUS_OPS;
  return LIST_VIEW_FILTER_OPS_BY_FIELD_TYPE[props.type] ?? LIST_VIEW_FILTER_DEFAULT_OPS;
}
