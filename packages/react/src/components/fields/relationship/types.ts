import { VexDocument } from "@vexcms/core";

export type { RelationshipPreviewProps } from "@vexcms/core";

/**
 * A single option shown in the relationship field picker combobox.
 *
 * `id` is the Convex document ID stored as the field value. The full doc is
 * also kept so the resolved preview component can render against it without
 * a second fetch.
 */
export interface RelationshipOption<
  TDocument extends VexDocument = VexDocument,
> {
  /** The Convex document ID — stored as the field value. */
  id: string;
  /** The full target document, returned by `useRelationshipPickerOptions`. */
  doc: TDocument;
}
