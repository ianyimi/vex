"use client";

import { isDisplayValueEmpty, type DisplayComponentProps, type KeyValueField, type TDocument } from "@vexcms/core";
import { fieldToDisplayComponent } from "../registry";

/**
 * KeyValue field read-only display, registered as `reactAdapter.fields.keyValue.display`.
 *
 * Shows every entry as `key → value`, with the value resolved through the
 * SAME `fieldToDisplayComponent` dispatch `ArrayFieldDisplay`/`GroupFieldDisplay`
 * use for their own nested values — NOT `KeyValueFieldCell`'s entry count,
 * which is a list-column concern.
 *
 * @param props - Component props.
 * @returns One labelled row per entry, or an em-dash when the value is absent.
 */
export function KeyValueFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<KeyValueField, TData>,
) {
  const value = (props.value ?? {}) as Record<string, unknown>;
  if (isDisplayValueEmpty(props.value) || Object.keys(value).length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  const ValueDisplay = fieldToDisplayComponent(props.field.value.type);
  return (
    <ul className="space-y-2">
      {Object.entries(value).map(([key, entryValue]) => (
        <li key={key} className="rounded-md border border-border/60 px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">{key}</p>
          {ValueDisplay ? (
            <ValueDisplay
              field={props.field.value}
              value={entryValue}
              document={props.document}
              collection={props.collection}
            />
          ) : (
            <span className="text-sm">
              {typeof entryValue === "object" ? JSON.stringify(entryValue) : String(entryValue)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
