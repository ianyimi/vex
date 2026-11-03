"use client";

import {
  getDataFields,
  type AdminField,
  type CollectionConfig,
  type MediaCollectionConfig,
  type TDocument,
} from "@vexcms/core";
import { fieldToDisplayComponent } from "./registry";

/**
 * Renders one labeled, indented row per data field under `fields` against
 * `values` — the shared recursive body `group/Display.tsx` and
 * `blocks/Display.tsx` both use to show their own nested sub-fields.
 *
 * Flattens `fields` via `getDataFields` first (same utility every other
 * field-iteration site in this codebase uses — tabs/collapsible/row
 * containers hoist their children, `admin.hidden` fields still appear here
 * since THIS is a read-only display, not a form, with no permission/
 * condition concerns of its own to apply), then resolves each entry's own
 * value display through `fieldToDisplayComponent` — a nested group/array/
 * blocks/json field recurses or renders richly exactly like a top-level
 * one would, never a flat JSON dump.
 *
 * @param props.fields - The container's own (unflattened) field map.
 * @param props.values - The stored values the flattened fields read by key.
 * @param props.document - The full document, forwarded to every nested
 *   Display for relationship/upload lookups or edit-link building.
 * @param props.collection - The parent collection config.
 * @returns One row per data field, or an em-dash placeholder when the
 *   container declares no data fields at all.
 */
export function DisplayFieldList<TData extends TDocument = TDocument>(props: {
  fields: Record<string, AdminField>;
  values: Record<string, unknown>;
  document: TData;
  collection: CollectionConfig | MediaCollectionConfig;
}) {
  const dataFields = getDataFields({ fields: props.fields });
  const entries = Object.entries(dataFields);
  if (entries.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="space-y-2">
      {entries.map(([key, fieldDef]) => {
        const FieldDisplay = fieldToDisplayComponent(fieldDef.type);
        return (
          <div key={key}>
            <p className="text-xs font-medium text-muted-foreground">{fieldDef.label || key}</p>
            {FieldDisplay ? (
              <FieldDisplay
                field={fieldDef}
                value={props.values[key]}
                document={props.document}
                collection={props.collection}
              />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
