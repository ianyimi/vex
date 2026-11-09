"use client";

import { useId, type ReactNode } from "react";
import { type CommitTsField as CommitTsFieldDef, type FieldComponentProps } from "@vexcms/core";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";
import { useFieldContext } from "../../forms";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { formatCommitTsFieldValue, commitTsTooltipValue } from "./utils";

/**
 * `commitTs` admin field — read-only display only. Never renders an
 * editable control: a `commitTs` field's value is stamped by Convex at
 * commit, never set through the admin form.
 *
 * Unlike every other `Field.tsx`, there is no `renderBareControl`/
 * `useFieldControlOverride` dispatch — this field is never an input.
 * `FieldComponentProps` carries no `value` of its own (only `Cell`/filter
 * controls do), so the current value is read off the bound form field
 * instead, the same `AdminFieldBinding` + `useFieldContext` wiring every
 * other admin field uses to reach its `@vexcms/react/form` leaf — here the
 * "leaf" is this component itself, reading the value directly rather than
 * handing it to an editable control.
 *
 * @param props - {@link FieldComponentProps} narrowed to `CommitTsField`.
 * @returns A read-only label + formatted value, with the full datetime in a tooltip; `null` while the value is `undefined`.
 */
export function CommitTsFieldAdmin(props: FieldComponentProps<{}, CommitTsFieldDef>): ReactNode {
  return (
    <AdminFieldBinding name={props.name}>
      <CommitTsFieldValue label={props.fieldDef.label || props.name} fieldDef={props.fieldDef} />
    </AdminFieldBinding>
  );
}

/**
 * Reads the bound form field's current value and renders it — split out so `useFieldContext` only runs once a form context is guaranteed to exist (via `AdminFieldBinding`'s own provider).
 *
 * @returns A labeled, formatted value with a full-datetime tooltip; `null` while the field's value is `undefined`.
 */
function CommitTsFieldValue(props: { label: string; fieldDef: CommitTsFieldDef }): ReactNode {
  const field = useFieldContext<number | undefined>();
  const labelId = useId();
  const value = field.state.value;
  if (value === undefined) return null;
  const formatted = formatCommitTsFieldValue({ value, format: props.fieldDef.admin.format });
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="space-y-1 rounded-sm border-2 border-border p-3 text-sm"
    >
      <span id={labelId} className="text-muted-foreground">{props.label}</span>
      <p>
        <TooltipProvider delay={1000}>
          <Tooltip>
            <TooltipTrigger render={<span>{formatted}</span>} />
            <TooltipContent>{commitTsTooltipValue(value)}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </p>
    </div>
  );
}
