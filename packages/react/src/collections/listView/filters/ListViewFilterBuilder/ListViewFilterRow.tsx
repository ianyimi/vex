"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { AdminDataField } from "@vexcms/core";
import {
  Button,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollSection,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "../../../../ui/command";
import { cn } from "../../../../utils/cn";
import { fieldToFilterInputComponent } from "../../../../fields/registry";
import { LIST_VIEW_FILTER_OP_LABELS, listViewFilterOpsForFieldType } from "../listViewFilterOperators";
import type { ListViewFilterOp } from "../listViewFilterGroups";

/**
 * One AND-ed row as edited in the builder's own draft state — unlike the
 * STORED `ListViewFilterLeaf`, `op` is the editor's own explicit
 * {@link ListViewFilterOp} the user picked, never re-derived from `{op, value}`
 * on every render.
 *
 * **Bug this fixes (reported live-broken by the developer):** the prior
 * design rendered the operator `Select`'s value as `listFilterOpOf({leaf:
 * row})`, re-deriving `"isEmpty"`/`"isNotEmpty"` from `value === undefined`
 * every time. Picking "eq" from an `isEmpty` row produced the IDENTICAL
 * stored leaf (`{op: "eq", value: undefined}`), which re-derived right
 * back to `"isEmpty"` — the picker looked like it ignored the click.
 * Picking "neq" produced `{op: "neq", value: undefined}`, which re-derived
 * to `"isNotEmpty"` instead of the "neq" the user actually chose. Storing
 * the chosen op explicitly, and converting to the stored shape only at
 * APPLY time (`toStoredFilterLeaf`), makes every op→op transition
 * keep exactly the op the user picked.
 */
export interface DraftFilterRow {
  readonly field: string;
  readonly op: ListViewFilterOp;
  readonly value: unknown;
}

/**
 * A row is complete once it has a field, an operator, and (for every operator except `isEmpty`/`isNotEmpty`) a non-empty value — Decision 10's "a row counts once it is complete, and incomplete rows are muted and ignored". Reads `row.op` directly (never re-derives it — see {@link DraftFilterRow}'s own doc).
 * @param row - The draft row to test.
 * @returns `true` if `row.op` is `isEmpty`/`isNotEmpty`, or if `row.value` is not `""`/`undefined`/`null`.
 */
export function isFilterRowComplete(row: DraftFilterRow): boolean {
  if (row.op === "isEmpty" || row.op === "isNotEmpty") return true;
  return row.value !== "" && row.value !== undefined && row.value !== null;
}

/** Field types whose value is free text, for the "Exact match. Use search for partial text." `eq` hint (Decision 10) — not `select`/`relationship`/`color`, where an exact match is the only sensible comparison anyway. */
const TEXT_LIKE_FILTER_TYPES: Record<string, true> = { text: true, email: true, textarea: true, url: true };

/**
 * One row's fixed 4-column grid template — field | operator | value |
 * remove — shared by EVERY row in EVERY group, so a field/op/value/remove
 * sits at the identical x position regardless of field type, operator, or
 * which group/row it's in (developer-binding: "don't size each row by its
 * content"). Field and value are `minmax(0,1fr)` (equal, growing to fill
 * the row, `min-w-0`-truncating rather than forcing the row wider); the
 * operator column is the one FIXED-width track, `6rem` (`96px`) — just
 * wide enough for {@link LIST_VIEW_FILTER_OP_LABELS}' longest entry
 * (`"!∅ empty"`), confirmed by measuring the rendered trigger — the
 * narrowest of the four by construction, since `1fr` columns only shrink
 * to `0` (never below a fixed track); remove is `auto` (its own
 * intrinsic, constant `icon-sm` `Button` size, identical in every row by
 * construction, so `auto` is already as "fixed" as a literal number here).
 *
 * A LITERAL string, not built from a shared width constant via template
 * interpolation — Tailwind's class scanner only generates CSS for
 * arbitrary-value classes it can find as unbroken source text; a
 * runtime-concatenated class name would silently produce no rule at all.
 */
const LIST_VIEW_FILTER_ROW_GRID_COLS = "grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)_auto]";

/**
 * Mobile (below `768px`, the bottom Sheet)'s own two-line row split — field
 * + operator on the first line, value + remove on the second — using the
 * SAME `6rem` operator column and the same `1fr`/`auto` rule as
 * {@link LIST_VIEW_FILTER_ROW_GRID_COLS}'s single line, so a field's left
 * edge and an operator's own width stay the one consistent grid rule
 * whether a row is laid out as one line or two.
 */
const LIST_VIEW_FILTER_ROW_GRID_COLS_MOBILE_LINE_1 = "grid-cols-[minmax(0,1fr)_6rem]";
/** Mobile row's second line — value, then remove. See {@link LIST_VIEW_FILTER_ROW_GRID_COLS_MOBILE_LINE_1}. */
const LIST_VIEW_FILTER_ROW_GRID_COLS_MOBILE_LINE_2 = "grid-cols-[minmax(0,1fr)_auto]";

/**
 * At or above this many readable fields, the field picker gets a search
 * box (developer-binding: auto-focused on open, filters by label AND
 * key, fixed-height internal scroll) instead of a plain `Select` list —
 * below it, scanning a short list is faster than typing. Matches
 * `SavedListViewTabs`' own "All views" `Popover`+`Command` convention.
 */
const LIST_VIEW_FILTER_FIELD_SEARCH_THRESHOLD = 7;

/**
 * The row's field picker — a plain `Select` below
 * {@link LIST_VIEW_FILTER_FIELD_SEARCH_THRESHOLD} readable fields, a
 * searchable `Popover`+`Command` combobox at or above it (developer-
 * binding). Owns its OWN `query` state and filters `entries` itself
 * (`Command shouldFilter={false}`) rather than relying on cmdk's default
 * filter — cmdk's default re-orders `Item` DOM nodes directly for
 * performance, which a real browser tolerates but jsdom does not (a
 * reliable `appendChild` crash under `@testing-library/react` the moment
 * a search query changes); owning the match ourselves (label OR key,
 * case-insensitive substring) sidesteps that path while keeping the same
 * "filters by label and key" behavior. Fills its grid cell exactly like
 * the plain `Select` did (`w-full min-w-0`) — the row's fixed-grid
 * layout doesn't change shape either way. `onSelect` closes over the
 * field KEY directly rather than reading cmdk's own callback argument,
 * the same pattern `SavedListViewTabs`' "All views" combobox already uses.
 *
 * @param props - Input props.
 * @param props.dataFields - Every readable field, keyed by field slug.
 * @param props.value - The row's current field key.
 * @param props.onChange - Replaces the row's field key.
 * @returns The field picker control.
 */
function FilterFieldSelect(props: {
  dataFields: Record<string, AdminDataField>;
  value: string;
  onChange: (key: string) => void;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const entries = Object.entries(props.dataFields);
  if (entries.length < LIST_VIEW_FILTER_FIELD_SEARCH_THRESHOLD) {
    const fieldLabel = (key: string) => props.dataFields[key]?.label || key || "Field";
    return (
      <Select
        value={props.value}
        onValueChange={(value) => props.onChange(value as unknown as string)}
      >
        <SelectTrigger
          aria-label={`Filter field: ${fieldLabel(props.value)}`}
          size="sm"
          className="w-full min-w-0"
        >
          <SelectValue>{(value: string) => fieldLabel(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {entries.map(([key, f]) => (
            <SelectItem key={key} value={key}>
              {f.label || key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  // Filters by label AND key ourselves, with `Command`'s own
  // `shouldFilter={false}` — cmdk's DEFAULT filtering re-orders `Item`
  // DOM nodes directly (a perf optimization, not React-driven), which a
  // real browser tolerates but jsdom does not: typing into the search
  // box reliably throws `Failed to execute 'appendChild' on 'Node'`
  // inside cmdk's own internals under `@testing-library/react`. Owning
  // the filter ourselves sidesteps that path entirely and is otherwise
  // the same "filters by label and key" behavior.
  const normalizedQuery = query.trim().toLowerCase();
  const filteredEntries =
    normalizedQuery === ""
      ? entries
      : entries.filter(([key, f]) => {
          const label = (f.label || key).toLowerCase();
          return label.includes(normalizedQuery) || key.toLowerCase().includes(normalizedQuery);
        });
  const selectedLabel = props.dataFields[props.value]?.label || props.value;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={`Filter field: ${selectedLabel}`}
            className="w-full min-w-0 font-normal"
            icon="ChevronDown"
            iconPosition="right"
            contentJustify="between"
          >
            <span className="min-w-0 truncate">{selectedLabel}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-0">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search fields…" />
          <CommandList>
            <ScrollSection maxHeight={240}>
              <CommandEmpty>No fields found.</CommandEmpty>
              {filteredEntries.map(([key, f]) => (
                <CommandItem
                  key={key}
                  value={key}
                  onSelect={() => {
                    props.onChange(key);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {f.label || key}
                  {key === props.value && <Icon name="Check" className="ml-auto size-3.5" />}
                </CommandItem>
              ))}
            </ScrollSection>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Props for {@link ListViewFilterRow}. */
export interface ListViewFilterRowProps {
  /** Every readable field, keyed by field slug — passed through to {@link FilterFieldSelect}. */
  dataFields: Record<string, AdminDataField>;
  /** The row's own draft state. */
  row: DraftFilterRow;
  /** Whether the responsive overlay is currently in its mobile (bottom Sheet) layout — selects the two-line vs. single-line grid. */
  isMobile: boolean;
  /** Replaces the row's field key — resets `op`/`value` for the new field, same as `handleFieldChange` always did. */
  onFieldChange: (key: string) => void;
  /** Replaces the row's operator. */
  onOpChange: (op: ListViewFilterOp) => void;
  /** Replaces the row's value. */
  onValueChange: (value: unknown) => void;
  /** Removes this row from its group. */
  onRemove: () => void;
}

/**
 * One AND-ed filter row — field picker, operator picker, value input, and
 * remove button — rendered by `ListViewFilterBuilder`'s own group map, one
 * per {@link DraftFilterRow}. Desktop renders the fixed 4-column grid
 * ({@link LIST_VIEW_FILTER_ROW_GRID_COLS}); mobile splits the same four
 * controls across two lines ({@link LIST_VIEW_FILTER_ROW_GRID_COLS_MOBILE_LINE_1}/
 * `_LINE_2}), both using the identical `6rem` operator column.
 *
 * @param props - {@link ListViewFilterRowProps}.
 * @returns The row's controls, or `null` if `props.row.field` no longer
 *   resolves to a readable field (e.g. a permission change mid-edit).
 */
export function ListViewFilterRow(props: ListViewFilterRowProps): ReactNode {
  const { row } = props;
  const field = props.dataFields[row.field];
  if (field === undefined) return null;
  const op = row.op;
  const complete = isFilterRowComplete(row);
  const showHint = TEXT_LIKE_FILTER_TYPES[field.type] === true && op === "eq";
  // A legacy `gt`/`lt` row (or any op outside the current matrix) keeps
  // its own operator in the picker — never silently relabelled or
  // dropped — by adding it to what's actually offered for THIS row, on
  // top of the type's normal new-choice set.
  const offeredOps = listViewFilterOpsForFieldType({ type: field.type, field: row.field });
  const availableOps = offeredOps.includes(op) ? offeredOps : [...offeredOps, op];
  const fieldSelect = <FilterFieldSelect dataFields={props.dataFields} value={row.field} onChange={props.onFieldChange} />;
  const opSelect = (
    <Select value={op} onValueChange={(value) => props.onOpChange(value as unknown as ListViewFilterOp)}>
      <SelectTrigger
        aria-label={`Filter operator: ${LIST_VIEW_FILTER_OP_LABELS[op] ?? op}`}
        size="sm"
        className="w-full min-w-0"
      >
        <SelectValue>
          {(value: unknown) => LIST_VIEW_FILTER_OP_LABELS[value as ListViewFilterOp] ?? String(value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableOps.map((candidateOp) => (
          <SelectItem key={candidateOp} value={candidateOp}>
            {LIST_VIEW_FILTER_OP_LABELS[candidateOp]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  // `isEmpty`/`isNotEmpty` render an EMPTY placeholder here, never
  // nothing — the row is a 4-column CSS grid with no explicit per-cell
  // `grid-column` assignment, so every row needs exactly 4 children in
  // the SAME order for the browser's auto-placement to land each one in
  // its own column; a 3rd child (skipping the value cell entirely) would
  // place "remove" into the value column instead of its own (developer-
  // binding: "the value cell keeps a stable width even for
  // isEmpty/isNotEmpty … so × doesn't jump").
  const FilterInputComponent = fieldToFilterInputComponent(field.type);
  const valueInput =
    op !== "isEmpty" && op !== "isNotEmpty" && FilterInputComponent !== undefined ? (
      <FilterInputComponent field={field} value={row.value} op={op} onChange={props.onValueChange} />
    ) : (
      <div aria-hidden="true" />
    );
  const removeButton = (
    <Button
      variant="ghost"
      size="icon-sm"
      icon="X"
      aria-label="Remove condition"
      onClick={props.onRemove}
    />
  );
  return (
    <div className={complete ? "flex flex-col gap-1" : "flex flex-col gap-1 opacity-50"}>
      {props.isMobile ? (
        // Decision 10 revised 2026-10-27, developer: a row's four
        // controls (field/op/value/×) don't all fit one line on a
        // narrow bottom Sheet once the value is a date-plus-time
        // picker — field+op on their own line, value+× below,
        // consistently for every row (not just `date`), so every
        // row looks the same regardless of field type. Same
        // `6rem` operator column and `1fr`/`auto` rule as the
        // single-line desktop grid below (further developer
        // revision: "same consistent alignment rule" on mobile).
        <div className="flex flex-col gap-1.5">
          <div className={cn("grid items-center gap-1.5", LIST_VIEW_FILTER_ROW_GRID_COLS_MOBILE_LINE_1)}>
            {fieldSelect}
            {opSelect}
          </div>
          <div className={cn("grid items-center gap-1.5", LIST_VIEW_FILTER_ROW_GRID_COLS_MOBILE_LINE_2)}>
            {valueInput}
            {removeButton}
          </div>
        </div>
      ) : (
        // Developer-binding: every row in every group uses this
        // SAME fixed 4-column grid ({@link
        // LIST_VIEW_FILTER_ROW_GRID_COLS}) — field/op/value/×
        // sit at identical x positions across every row and
        // group, whatever the field type or operator, rather
        // than each row sizing itself by its own content.
        <div className={cn("grid items-center gap-1.5", LIST_VIEW_FILTER_ROW_GRID_COLS)}>
          {fieldSelect}
          {opSelect}
          {valueInput}
          {removeButton}
        </div>
      )}
      {showHint && <p className="text-xs text-muted-foreground">Exact match. Use search for partial text.</p>}
    </div>
  );
}
