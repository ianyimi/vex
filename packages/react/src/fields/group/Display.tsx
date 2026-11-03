"use client";

import { isDisplayValueEmpty, type DisplayComponentProps, type GroupField, type TDocument } from "@vexcms/core";
import { DisplayFieldList } from "../DisplayFieldList";

/**
 * Group field read-only display, registered as `reactAdapter.fields.group.display`.
 *
 * Shows every sub-field recursively via `DisplayFieldList` (labels, nested
 * indentation, each sub-field resolved through `fieldToDisplayComponent`
 * in turn) — NOT `GroupFieldCell`'s flat `JSON.stringify` preview, which
 * is a list-column concern (no room for a nested layout there).
 *
 * @param props - Component props.
 * @returns The group's sub-fields, each labeled and rendered, or an em-dash when the value is absent.
 */
export function GroupFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<GroupField, TData>,
) {
  if (isDisplayValueEmpty(props.value)) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="rounded-md border border-border/60 px-2 py-1.5">
      <DisplayFieldList
        fields={props.field.fields}
        values={props.value as Record<string, unknown>}
        document={props.document}
        collection={props.collection}
      />
    </div>
  );
}
