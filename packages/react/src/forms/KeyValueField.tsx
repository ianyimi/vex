"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { TrashIcon } from "lucide-react";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, NullFieldToggle } from "./FormFieldLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { FieldDescription, FieldError, FieldLabel } from "../ui/field";
import type { BaseFormFieldProps } from "./types";

/** The subset of a TanStack field the hook needs — a record-valued field. */
export interface KeyValueRowsField<TValue> {
  state: { value: Record<string, TValue> | null | undefined };
  handleChange: (value: Record<string, TValue>) => void;
}

/** One row — a stable identity (`rowId`) paired with its current key and value. */
export interface KeyValueRow<TValue> {
  rowId: string;
  key: string;
  value: TValue;
}

/** Options for {@link useKeyValueRows}. */
export interface UseKeyValueRowsOptions<TValue> {
  field: KeyValueRowsField<TValue>;
  /** Builds a new row's value for "Add". */
  createValue: () => TValue;
  /** Caps `atMax`/add growth; `undefined` means unbounded. */
  max?: number;
}

/** Return value of {@link useKeyValueRows}. */
export interface UseKeyValueRowsResult<TValue> {
  rows: KeyValueRow<TValue>[];
  atMax: boolean;
  /** Keys shared by two or more rows — every row sharing one is flagged. */
  duplicateKeys: ReadonlySet<string>;
  add: () => void;
  remove: (rowId: string) => void;
  setKey: (rowId: string, key: string) => void;
  setValue: (rowId: string, value: TValue) => void;
}

/**
 * Row-list mechanics for a `keyValue()` field: add/remove, per-row key/value
 * editing, duplicate-key detection, and committing the full `Record<K, V>`
 * back to the real field on every change. Rows are seeded ONCE from the
 * field's initial value (`Object.entries`, each entry assigned a stable
 * `${idPrefix}-${n}` identity, `idPrefix` from `useId()` — identical on the
 * server and the client, unlike `crypto.randomUUID()`, so SSR markup and
 * hydration never disagree on a row's DOM id) and held as independent local
 * state from then on — the outer field's value is a WRITE target this hook
 * owns, not a value it continuously re-derives from, mirroring
 * `useArrayItems`' own synthetic-key cache.
 *
 * `lastValueRef` (the same pattern `BytesControl` uses) distinguishes an
 * EXTERNAL value change (a version switch, a post-save form reset, a live
 * field merge, a null restore) from this hook's own writes:
 * `options.field.state.value` differs from `lastValueRef.current` only when
 * something OTHER than `commit` changed it, since `commit` updates
 * `lastValueRef.current` to the exact record it passes to `handleChange`
 * before that value ever reaches this hook as a prop. On a genuine external
 * change, `rows` is rebuilt from the new value, reusing an existing row's
 * `rowId` for any key that still exists (reconciled by key, so an unchanged
 * key's mounted value control is never torn down) and minting a fresh
 * `nextRowId()` for a key with no current row.
 *
 * An empty-string key is a valid interim row state (not yet named) and is
 * excluded from the committed record; a later row with the SAME non-empty
 * key as an earlier one overwrites it in the committed record (ordinary
 * object-literal semantics) while both rows stay flagged via `duplicateKeys`
 * until resolved.
 *
 * @param options - {@link UseKeyValueRowsOptions}.
 * @returns {@link UseKeyValueRowsResult}.
 */
export function useKeyValueRows<TValue>(
  options: UseKeyValueRowsOptions<TValue>,
): UseKeyValueRowsResult<TValue> {
  const idPrefix = useId().replace(/[.[\]]/g, "_");
  const nextRowIndex = useRef(0);

  function nextRowId(): string {
    const rowId = `${idPrefix}-${nextRowIndex.current}`;
    nextRowIndex.current += 1;
    return rowId;
  }

  const [rows, setRows] = useState<KeyValueRow<TValue>[]>(() =>
    Object.entries(options.field.state.value ?? {}).map(([key, value]) => ({
      rowId: nextRowId(),
      key,
      value: value as TValue,
    })),
  );
  const lastValueRef = useRef(options.field.state.value);

  useEffect(() => {
    if (options.field.state.value === lastValueRef.current) return;
    lastValueRef.current = options.field.state.value;
    const existingRowIdsByKey = new Map<string, string>();
    for (const row of rows) {
      existingRowIdsByKey.set(row.key, row.rowId);
    }
    setRows(
      Object.entries(options.field.state.value ?? {}).map(([key, value]) => ({
        rowId: existingRowIdsByKey.get(key) ?? nextRowId(),
        key,
        value: value as TValue,
      })),
    );
  }, [options.field.state.value]);

  function commit(nextRows: KeyValueRow<TValue>[]): void {
    setRows(nextRows);
    const record: Record<string, TValue> = {};
    for (const row of nextRows) {
      if (row.key === "") continue;
      record[row.key] = row.value;
    }
    lastValueRef.current = record;
    options.field.handleChange(record);
  }

  function add(): void {
    commit([...rows, { rowId: nextRowId(), key: "", value: options.createValue() }]);
  }

  function remove(rowId: string): void {
    commit(rows.filter((row) => row.rowId !== rowId));
  }

  function setKey(rowId: string, key: string): void {
    commit(rows.map((row) => (row.rowId === rowId ? { ...row, key } : row)));
  }

  function setValue(rowId: string, value: TValue): void {
    commit(rows.map((row) => (row.rowId === rowId ? { ...row, value } : row)));
  }

  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.key === "") continue;
    keyCounts.set(row.key, (keyCounts.get(row.key) ?? 0) + 1);
  }
  const duplicateKeys = new Set(
    [...keyCounts.entries()].filter(([, count]) => count > 1).map(([key]) => key),
  );

  return {
    rows,
    atMax: options.max !== undefined && rows.length >= options.max,
    duplicateKeys,
    add,
    remove,
    setKey,
    setValue,
  };
}

/** Props for {@link KeyValueField}. */
export interface KeyValueFieldProps<TValue>
  extends Omit<BaseFormFieldProps<Record<string, TValue>>, "renderControl"> {
  /** Singular noun for the "Add <entryLabel>" button, e.g. `"Entry"`. */
  entryLabel: string;
  /** Plural noun for counts/empty state, e.g. `"Entries"`. */
  pluralLabel: string;
  /**
   * Label for the key column — `"Key"` for string keys, or the id target
   * collection's singular label (e.g. `"User"`) for id keys. Shown visibly
   * on EVERY row (matching the value label, which already does the same),
   * with a required asterisk — a record entry's key is always required,
   * regardless of the field's own `required`. The key control itself always
   * carries this text as its own `aria-label` too.
   */
  keyLabel: string;
  max?: number;
  createValue: () => TValue;
  /** Renders one row's key control. */
  renderKey: (props: {
    row: KeyValueRow<TValue>;
    duplicate: boolean;
    onChange: (key: string) => void;
    onBlur: () => void;
  }) => ReactNode;
  /** Renders one row's value control. */
  renderValue: (props: { row: KeyValueRow<TValue>; onChange: (value: TValue) => void }) => ReactNode;
  /** Whether the field is currently toggled to `null` (nullable containers render a null toggle). */
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
  /** Whether the accordion starts collapsed. Mirrors `GroupField`'s `defaultOpen`. */
  defaultOpen?: boolean;
}

/** Shown under an empty-keyed row's key input, and gates submission via `field.setMeta`. */
const REQUIRED_KEY_MESSAGE = "This field is required.";

/**
 * A key/value row editor bound to the nearest `<form.AppField name="...">`.
 * No reorder — a record has no meaningful order of its own, unlike `ArrayField`.
 *
 * @param props - See {@link KeyValueFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled row list, add button, description and error.
 */
export function KeyValueField<TValue>(props: KeyValueFieldProps<TValue>): ReactNode {
  const field = useFieldContext<Record<string, TValue> | null>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const { rows, atMax, duplicateKeys, add, remove, setKey, setValue } = useKeyValueRows<TValue>({
    field: field as unknown as KeyValueRowsField<TValue>,
    createValue: props.createValue,
    max: props.max,
  });

  const [touchedRowIds, setTouchedRowIds] = useState<ReadonlySet<string>>(() => new Set());
  function touchRow(rowId: string): void {
    setTouchedRowIds((prev) => (prev.has(rowId) ? prev : new Set(prev).add(rowId)));
  }

  const hasEmptyKeyRow = rows.some((row) => row.key === "");
  useEffect(() => {
    const message = hasEmptyKeyRow ? REQUIRED_KEY_MESSAGE : undefined;
    field.setMeta((prev) =>
      prev.errorMap.onSubmit === message ? prev : { ...prev, errorMap: { ...prev.errorMap, onSubmit: message } },
    );
  }, [rows, submissionAttempts]);

  const itemValue = useRef(`${field.name}-accordion-item`).current;
  const [openValue, setOpenValue] = useState<string[]>(() => ((props.defaultOpen ?? true) ? [itemValue] : []));

  const entryCount = rows.length === 1 ? props.entryLabel.toLowerCase() : props.pluralLabel.toLowerCase();
  const nullToggle = props.onIsNullChange ? (
    <NullFieldToggle isNull={Boolean(props.isNull)} onIsNullChange={props.onIsNullChange} label={props.label} />
  ) : undefined;

  return (
    <Accordion
      value={props.isNull ? [] : openValue}
      onValueChange={(next) => {
        if (!props.isNull) setOpenValue(next);
      }}
      className="rounded-sm border-2 border-border"
    >
      <AccordionItem value={itemValue} disabled={props.isNull}>
        <AccordionTrigger className="flex gap-4 px-3 text-sm font-medium hover:no-underline" actions={nullToggle}>
          <div
            className="group/field flex min-w-0 flex-col gap-1 self-center"
            data-disabled={props.readOnly || undefined}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                id={`${field.name}-label`}
                className="relative block min-w-0 truncate text-sm leading-snug font-medium select-none group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
                {props.label}
                {props.required && <span className="text-red-500">*</span>}
              </span>
              <span className="hidden shrink-0 text-xs font-normal text-muted-foreground @lg/form:inline">
                {rows.length} {entryCount}
              </span>
            </span>
            {props.description && <FieldDescription>{props.description}</FieldDescription>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pt-3">
          <FormFieldLayout
            id={field.name}
            field={field}
            submissionAttempts={submissionAttempts}
            readOnly={props.readOnly}
            isNull={props.isNull}
            showError={!hasEmptyKeyRow}
          >
            <div className="flex flex-col gap-3">
              {rows.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {rows.map((row) => (
                    <li key={row.rowId} className="flex items-start gap-2">
                      <div className="w-1/3 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <FieldLabel>
                            {props.keyLabel}
                            <span className="text-red-500">*</span>
                          </FieldLabel>
                        </div>
                        <div className="mt-2">
                          {props.renderKey({
                            row,
                            duplicate: duplicateKeys.has(row.key),
                            onChange: (key) => setKey(row.rowId, key),
                            onBlur: () => touchRow(row.rowId),
                          })}
                        </div>
                        {row.key === "" && (touchedRowIds.has(row.rowId) || submissionAttempts > 0) && (
                          <FieldError role="alert" className="mt-1">
                            {REQUIRED_KEY_MESSAGE}
                          </FieldError>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {props.renderValue({ row, onChange: (value) => setValue(row.rowId, value) })}
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <FieldLabel className="invisible" aria-hidden="true">
                            {"\u00A0"}
                          </FieldLabel>
                        </div>
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={Boolean(props.readOnly)}
                            onClick={() => remove(row.rowId)}
                            aria-label={
                              row.key
                                ? `Remove ${props.entryLabel} "${row.key}"`
                                : `Remove ${props.entryLabel}`
                            }
                          >
                            <TrashIcon className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No {props.pluralLabel.toLowerCase()} yet.</p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={Boolean(props.readOnly) || atMax}
                  variant="outline"
                  size="sm"
                  onClick={add}
                  icon="Plus"
                >
                  Add {props.entryLabel}
                </Button>
                {atMax && (
                  <span className="text-xs text-muted-foreground">
                    Maximum {props.max} {props.pluralLabel.toLowerCase()} reached
                  </span>
                )}
              </div>
            </div>
          </FormFieldLayout>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
