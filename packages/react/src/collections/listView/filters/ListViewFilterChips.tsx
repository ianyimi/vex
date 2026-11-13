"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { getDataFields, VERSION_STATUSES, type AdminDataField, type CollectionConfig, type VexWhereNode } from "@vexcms/core";
import { Badge, Button, Icon } from "../../../ui";
import { useVexConfig } from "../../../config/VexConfigContext";
import { useCanReadField } from "../../../access";
import { formatDateFieldValue } from "../../../fields/date/utils";
import { CHECKBOX_FILTER_BOOLEAN_OPTIONS } from "../../../fields/checkbox/FilterInput";
import { writeListViewChipsVisibleCookie } from "../writeListViewConfigCookies";
import { fromListViewFilterGroups, listFilterOpOf, toListViewFilterGroups, type ListViewFilterLeaf } from "./listViewFilterGroups";
import { LIST_VIEW_FILTER_OP_LABELS, LIST_VIEW_FILTER_STATUS_FIELD_KEY } from "./listViewFilterOperators";

/** Props for {@link ListViewFilterChips}. */
export interface ListViewFilterChipsProps {
  /** The collection the list view renders — needed for field labels and date formatting. */
  collection: CollectionConfig;
  /** The list's current filter, in plain `VexWhereNode` form. Same prop as `ListViewFilterBuilder.where`. */
  where: VexWhereNode<string> | undefined;
  /**
   * The ACTIVE `config`/`default` view's own declared `where`, narrowed to
   * the conditions readable by the current caller
   * (`ListViewContext.lockedFilterWhere`). Rendered as LOCKED chips —
   * same visual row as `where`'s own editable chips, but with no remove
   * button and never part of `onWhereChange`'s groups: the condition
   * isn't user-editable state, so there is nothing to clear it TO other
   * than switching views. `undefined` when no active view declares a
   * readable condition (including every `shared`/`local` source, which
   * routes its own filter through `where` instead).
   */
  lockedWhere?: VexWhereNode<string>;
  /** Replaces `where` wholesale — same contract as `ListViewFilterBuilder.onWhereChange`. `null` means the user explicitly cleared every condition (distinct from `undefined` — see `ListViewFilterBuilder.onWhereChange`'s own doc). */
  onWhereChange: (where: VexWhereNode<string> | undefined | null) => void;
  /**
   * Whether the chip row is showing — owned by `ListViewLayout`,
   * flipped by {@link ListViewFilterVisibilityToggle}
   * below (the eye toggle lives HERE, not `ListViewFilterBuilder`, and chips
   * now ALWAYS render inline in `ListViewToolbar`'s own row, flex-wrapping
   * onto additional lines as needed — never their own separate row below
   * the toolbar, never a horizontally-scrolling max-width strip).
   */
  visible: boolean;
  /**
   * Resolved titles for every `relationship`/`upload` id a chip might need
   * to display (`ListViewContext.filterValueTitles`) —
   * falls back to the raw id for any id missing from this map.
   */
  filterValueTitles: Record<string, string | null>;
}

/**
 * Formats one leaf's value for its chip — a `relationship`/`upload`
 * field's id resolved to `filterValueTitles[value]` (falling back to the
 * raw id), a `date` field via `formatDateFieldValue` (the
 * same formatter the data-table cell and the date field's own display
 * use — always displayed formatted as
 * date/time), a `select`/`checkbox` field (including the synthetic
 * `vex_status`) resolved to the matching option's own label — the SAME
 * label the field's own `FilterInput` now shows (the
 * chip must match the input exactly, SSR and client) — everything else
 * `String(value)`. `vex_status` is checked FIRST and separately from the
 * generic `select` branch below, since the synthetic field never
 * resolves through `dataFields` (`field` is `undefined` for it) — its
 * own values are `VERSION_STATUSES` keys (`"draft"`/`"published"`), not
 * a declared `select` field's options. Never called for
 * `isEmpty`/`isNotEmpty` rows (the caller omits the value segment for
 * those). Exported so a saved-view "Modified: …" summary can
 * reuse the same formatting — `filterValueTitles` defaults to `{}`
 * (id-only) for a caller with no title map available.
 *
 * @param row - The DNF leaf whose `value` is being formatted for display.
 * @param dataFields - The collection's fields, keyed by field key, used to resolve `row.field`'s type.
 * @param filterValueTitles - Resolved relationship/upload titles keyed by id; defaults to `{}`.
 * @returns The chip-ready string for `row.value`.
 */
export function formatFilterChipValue(
  row: ListViewFilterLeaf<string>,
  dataFields: Record<string, AdminDataField>,
  filterValueTitles: Record<string, string | null> = {},
): string {
  const isStatus = row.field === LIST_VIEW_FILTER_STATUS_FIELD_KEY;
  const field = isStatus ? undefined : dataFields[row.field];
  const { value } = row;
  if (isStatus && typeof value === "string") {
    return Object.values(VERSION_STATUSES).find((status) => status.key === value)?.labels.singular ?? value;
  }
  if (field?.type === "date" && typeof value === "number") {
    return formatDateFieldValue({ value, time: field.time });
  }
  if ((field?.type === "relationship" || field?.type === "upload") && typeof value === "string") {
    return filterValueTitles[value] ?? value;
  }
  if (field?.type === "checkbox") {
    return CHECKBOX_FILTER_BOOLEAN_OPTIONS.find((option) => option.value === String(value))?.label ?? String(value);
  }
  if (field?.type === "select") {
    return field.options.find((option) => option.value === value)?.label ?? String(value);
  }
  return String(value);
}

/**
 * The display LABEL for a filter's field key — the synthetic `vex_status`
 * resolves to "Status" (hardcoded; it never resolves through `dataFields`,
 * same reasoning as {@link formatFilterChipValue}'s own `isStatus` branch),
 * any other field to `dataFields[field]?.label`, falling back to the raw
 * key when the field carries none. The ONE place a filter field's label is
 * resolved — chips (below) and {@link StaleSavedListViewNotice}'s dropped-
 * sort/search/filter sentences (access-system-fields.md, developer-
 * reported: "use the field's label, exactly like the filter chips do")
 * both call this, so a raw key never reaches either surface independently.
 *
 * @param field - A filter row's field key, or a `staleSortField`/
 *   `staleSearchField`/`staleFilterField` value.
 * @param dataFields - The collection's fields, keyed by field key.
 * @returns The field's display label.
 */
export function resolveFilterFieldLabel(field: string, dataFields: Record<string, AdminDataField>): string {
  return field === LIST_VIEW_FILTER_STATUS_FIELD_KEY ? "Status" : dataFields[field]?.label || field;
}

/**
 * The chip row under the toolbar showing the active filter rows —
 * clear one, clear all — plus, when the active view is a `config`/`default`
 * one with its own readable condition(s), a LOCKED chip per condition
 * (`props.lockedWhere`, `ListViewContext.lockedFilterWhere`): no remove
 * button, never part of `onWhereChange`'s groups. Renders nothing when
 * BOTH `where` and `lockedWhere` are `undefined`/not in DNF form
 * (`toListViewFilterGroups` returns `null` — a non-DNF `where` has no
 * per-row chips to show; it still reaches the user via
 * `ListViewFilterBuilder`'s read-only panel), or `!props.visible` (the
 * grouped eye toggle beside `ListViewFilterBuilder`'s own "Filter" trigger
 * controls this). A condition on a field the viewer can no longer read
 * (including the synthetic `vex_status`) never reaches EITHER row —
 * `lockedWhere` is already narrowed to readable fields at the source
 * (`splitWhereByReadability`); `canReadField` below is this component's
 * own belt-and-suspenders check for `where`'s editable chips, same as
 * always.
 *
 * @param props - {@link ListViewFilterChipsProps}.
 * @returns The chip row, or `null`.
 */
export function ListViewFilterChips(props: ListViewFilterChipsProps): ReactNode {
  const dnf = useMemo(() => toListViewFilterGroups({ where: props.where }), [props.where]);
  const lockedDnf = useMemo(() => toListViewFilterGroups({ where: props.lockedWhere }), [props.lockedWhere]);
  const dataFields = useMemo(
    () => getDataFields({ fields: props.collection.fields }),
    [props.collection.fields],
  );
  // A chip for a field the viewer
  // can no longer read (including the synthetic `vex_status`) is hidden
  // entirely, not just unlabeled — the same "hidden unless listed"
  // default `ListViewFilterBuilder`'s own field picker already applies.
  // User-added filters on unreadable fields are rejected server-side,
  // so there is no result the chip could honestly
  // describe; a declared view's UNREADABLE condition never reaches this
  // component at all (see this function's own doc comment above) and
  // keeps showing only as `SavedListViewHiddenFilterBadge`.
  const canReadField = useCanReadField({ resource: props.collection.slug });

  const groups = dnf?.groups ?? [];
  const lockedGroups = lockedDnf?.groups ?? [];
  if ((groups.length === 0 && lockedGroups.length === 0) || !props.visible) return null;

  function handleRemoveRow(groupIndex: number, rowIndex: number): void {
    const nextGroups = groups
      .map((group, i) =>
        i === groupIndex ? { rows: group.rows.filter((_row, j) => j !== rowIndex) } : group,
      )
      .filter((group) => group.rows.length > 0);
    // This function only ever runs when a chip existed to click Remove on
    // (rendered only while `groups.length > 0`) — so a `fromListViewFilterGroups` result of
    // `undefined` here always means "the user just removed the LAST
    // condition," the same explicit-clear intent as "Clear all" below, not
    // a no-op echo of an already-empty filter.
    props.onWhereChange(fromListViewFilterGroups({ groups: nextGroups }) ?? null);
  }

  function chipTextFor(row: ListViewFilterLeaf<string>): string {
    const op = listFilterOpOf({ leaf: row });
    const fieldLabel = resolveFilterFieldLabel(row.field, dataFields);
    return op === "isEmpty" || op === "isNotEmpty"
      ? `${fieldLabel} ${LIST_VIEW_FILTER_OP_LABELS[op]}`
      : `${fieldLabel} ${LIST_VIEW_FILTER_OP_LABELS[op]} ${formatFilterChipValue(row, dataFields, props.filterValueTitles)}`;
  }

  return (
    // `contents`, not its own `flex flex-wrap` — a NESTED flex-wrap here
    // (the prior shape) wrapped chips WITHIN this div's own narrow box,
    // whose left edge sits wherever `ListViewToolbar` happens to render this
    // component (after `[Filter][eye]`), not the toolbar's own left edge
    // — avoids the "chips wrap into a column under Filter,
    // not flush with Search" bug. `display: contents` removes this div
    // from layout entirely, so every chip `Badge` and the `Clear all`
    // `Button` become DIRECT items of `ListViewToolbar`'s own top-level
    // flex-wrap row — when they don't fit after `[Filter][eye]`, THAT
    // container's line wrap naturally starts a new line flush with its
    // own left edge (the toolbar's, matching Search), with every chip
    // AND `Clear all` normally in-flow on it (never a separate nested
    // wrap decision, which is what stacked `Clear all` under the chip
    // before).
    <div className="contents">
      {lockedGroups.map((group, groupIndex) =>
        group.rows.map((row, rowIndex) => {
          if (!canReadField(row.field)) return null;
          const chipText = chipTextFor(row);
          return (
            <Badge
              key={`locked-${groupIndex}-${rowIndex}`}
              variant="outline"
              className="shrink-0 gap-1"
              aria-label={`${chipText} (set by this view, not editable)`}
            >
              <Icon name="Lock" className="size-3" />
              {chipText}
            </Badge>
          );
        }),
      )}
      {groups.map((group, groupIndex) =>
        group.rows.map((row, rowIndex) => {
          if (!canReadField(row.field)) return null;
          const chipText = chipTextFor(row);
          return (
            <Badge key={`${groupIndex}-${rowIndex}`} variant="secondary" className="shrink-0 gap-1 pr-1">
              {chipText}
              <Button
                variant="ghost"
                size="icon-xs"
                icon="X"
                aria-label={`Remove ${chipText} filter`}
                onClick={() => handleRemoveRow(groupIndex, rowIndex)}
              />
            </Badge>
          );
        }),
      )}
      {groups.length > 0 && (
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => props.onWhereChange(null)}>
          Clear all
        </Button>
      )}
    </div>
  );
}

/** Props for {@link ListViewFilterVisibilityToggle}. */
export interface ListViewFilterVisibilityToggleProps {
  /** The collection the list view renders — needed for the consolidated `vex-admin:<slug>` cookie key. */
  collection: CollectionConfig;
  /** The list's current filter — determines whether there's anything to toggle at all. Same prop as `ListViewFilterChips.where`. */
  where: VexWhereNode<string> | undefined;
  /** Whether the chip row is currently showing. */
  chipsVisible: boolean;
  /** Replaces `chipsVisible`; this component also persists the choice via `writeListViewChipsVisibleCookie`. */
  onChipsVisibleChange: (visible: boolean) => void;
}

/**
 * The eye/crossed-eye chip-visibility toggle — moved HERE from
 * `ListViewFilterBuilder`. `ListViewToolbar` renders `[Filter] [eye] [chips…]`
 * in that order: Filter is its own
 * always-inline flex item, never wrapping away from search; `eye`
 * leads the SEPARATE flattened group chips also belong to, so the two
 * wrap together onto a new line rather than `eye` ever being stranded
 * alone on the search row while chips wrap away without it — only
 * `ListViewToolbar` itself (which already renders the chips directly) can
 * place the eye immediately before them; a filter builder rendering its
 * own eye button could never produce that order.
 *
 * `variant="ghost"` (no button background, matching `ListViewCopyLinkButton`'s
 * own style) via the `Button` `icon` prop — never a hand-rendered icon
 * child, and never disabled. With NO active filter (`toListViewFilterGroups` null/empty —
 * the same condition `ListViewFilterChips` itself renders nothing for), it is
 * NOT RENDERED AT ALL (never disabled) — no layout shift on first paint,
 * since the server already knows whether `filter` is set. With an active
 * filter: `Eye` when chips are shown, `EyeOff` when hidden (filters still
 * apply to the results either way — only the chip row's own visibility
 * changes).
 *
 * @param props - {@link ListViewFilterVisibilityToggleProps}.
 * @returns The eye/crossed-eye toggle button, or `null`.
 */
export function ListViewFilterVisibilityToggle(props: ListViewFilterVisibilityToggleProps): ReactNode {
  const config = useVexConfig();
  const dnf = useMemo(() => toListViewFilterGroups({ where: props.where }), [props.where]);
  const hasActiveFilter = dnf !== null && dnf.groups.length > 0;
  if (!hasActiveFilter) return null;

  function handleToggle(): void {
    const next = !props.chipsVisible;
    props.onChipsVisibleChange(next);
    writeListViewChipsVisibleCookie({ basePath: config.basePath, collectionSlug: props.collection.slug, visible: next });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      icon={props.chipsVisible ? "Eye" : "EyeOff"}
      aria-label={props.chipsVisible ? "Hide filter chips" : "Show filter chips"}
      onClick={handleToggle}
    />
  );
}
