"use client";

import { isInt64NumberField, type FilterInputProps, type NumberField } from "@vexcms/core";
import { Input } from "../../ui";

/**
 * Number field filter row value control — a number `Input`, registered as
 * `reactAdapter.fields.number.filterInput`. For an `int64` field
 * (`isInt64NumberField`), renders a digits-only text `Input` bound to a
 * `bigint` instead, matching `forms/NumberField.tsx`'s `bigint` mode.
 *
 * @param props - Component props.
 * @returns The value `Input`.
 */
export function NumberFilterInput(props: FilterInputProps<NumberField>) {
  if (isInt64NumberField(props.field)) {
    return (
      <Input
        type="text"
        inputMode="numeric"
        className="w-full min-w-0"
        aria-label={props.field.label || "Filter value"}
        defaultValue={props.value !== undefined && props.value !== null ? String(props.value) : ""}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          if (raw === "") {
            props.onChange(undefined);
            return;
          }
          if (!/^-?\d+$/.test(raw)) return;
          props.onChange(BigInt(raw));
        }}
        disabled={props.disabled}
      />
    );
  }
  return (
    <Input
      type="number"
      className="w-full min-w-0"
      aria-label={props.field.label || "Filter value"}
      value={String(props.value ?? "")}
      onChange={(e) => props.onChange(Number(e.target.value))}
      disabled={props.disabled}
    />
  );
}
