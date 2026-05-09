"use client";

import type { CellComponentProps, RelationshipField } from "@vexcms/core";
import { resolveRelationshipPreview } from "./preview";

/**
 * Relationship field cell component for the data-table list view.
 *
 * Per Decision 11, dispatches through the resolved preview component
 * (field-level override > target collection's preview > default). The default
 * renders `doc[useAsTitle] ?? doc._id` from the *parent* doc — useful only when
 * the relationship field key matches `useAsTitle`, which it generally doesn't.
 * Most consumers will set `admin.components.preview` on the parent collection
 * to render whatever the cell should show (chip, count, etc.).
 *
 * @param props - Standard cell component props.
 */
export function RelationshipFieldCell(
  props: CellComponentProps<RelationshipField>,
) {
  const { row, fieldDef, fieldKey, collection } = props;
  const Preview = resolveRelationshipPreview({
    fieldDef,
    targetCollection: undefined, // cell context: doc is the parent, not target
  });
  return <Preview doc={row.original} fieldKey={fieldKey} config={collection as never} />;
}
