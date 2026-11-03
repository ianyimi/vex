"use client";

import {
  isDisplayValueEmpty,
  type ArrayField,
  type ArrayType,
  type DisplayComponentProps,
  type TDocument,
  type VexResourceSlug,
} from "@vexcms/core";
import { fieldToDisplayComponent } from "../registry";

/**
 * Array field read-only display, registered as `reactAdapter.fields.array.display`.
 *
 * Shows every item, numbered, each resolved through `fieldToDisplayComponent`
 * for `props.field.items`'s own type — a scalar item (`text`/`number`/…)
 * renders its own Display directly, an object item (`group`/`array`/
 * `blocks`/`json`) recurses into ITS Display in turn, with nested
 * indentation. NOT `ArrayFieldCell`'s `"N items"` count — a list-column
 * concern, no room for every item there.
 *
 * @param props - Component props.
 * @returns One numbered row per array item, or an em-dash for an empty array.
 */
export function ArrayFieldDisplay<
  TData extends TDocument = TDocument,
  TArrayType extends ArrayType = ArrayType,
>(props: DisplayComponentProps<ArrayField<VexResourceSlug, TArrayType>, TData>) {
  const value = Array.isArray(props.value) ? props.value : [];
  if (isDisplayValueEmpty(value)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const ItemDisplay = fieldToDisplayComponent(props.field.items.type);
  return (
    <ol className="space-y-2">
      {value.map((item, index) => (
        <li key={index} className="rounded-md border border-border/60 px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">[{index + 1}]</p>
          {ItemDisplay ? (
            <ItemDisplay
              field={props.field.items}
              value={item}
              document={props.document}
              collection={props.collection}
            />
          ) : (
            <span className="text-sm">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
