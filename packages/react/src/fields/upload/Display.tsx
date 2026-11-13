"use client";

import {
  isDisplayValueEmpty,
  type DisplayComponentProps,
  isHiddenDocument,
  type TDocument,
  type UploadField,
  type VexMediaDocument,
} from "@vexcms/core";
import { Badge } from "../../ui/badge";
import { FilePreview } from "../../media/FilePreview";
import { AccessDeniedChip } from "../../access";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * Upload field read-only display, registered as
 * `reactAdapter.fields.upload.display`.
 *
 * Renders one chip per attached media doc — a thumbnail plus filename when
 * the value arrived populated (seeded from already-loaded rows, the normal
 * case), or the raw media id alone otherwise — with the raw id always on
 * the chip's `title` attribute. Same "chip/title plus id" shape as
 * `RelationshipFieldDisplay`, deliberately NOT `UploadFieldCell`'s
 * single-item-plus-badge-count list-cell layout (a read-only display has
 * no fixed column width to summarize into) and NOT `UploadFieldCell`'s
 * own unpopulated-fallback query (showing every attached file, not just
 * the first, without fanning out N queries for a read-only panel). A
 * denied target (`populateDocs`'s `HiddenDocument` placeholder) renders
 * `AccessDeniedChip` instead of attempting `FilePreview` on a doc that
 * carries none of its required fields.
 *
 * @param props - Component props.
 * @returns One chip per attached file, or an em-dash for an empty upload field.
 */
export function UploadFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<UploadField, TData>,
) {
  const config = useVexConfig();
  const raw = Array.isArray(props.value) ? props.value : [];
  if (isDisplayValueEmpty(raw)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const targetCollection = config.mediaCollections.find((c) => c.slug === props.field.to);
  return (
    <div className="flex flex-wrap gap-1">
      {raw.map((item) => {
        if (isHiddenDocument(item)) {
          return (
            <AccessDeniedChip
              key={item._id}
              resource={item.resource}
              action={item.action}
              label={targetCollection?.labels.singular ?? props.field.to}
            />
          );
        }
        const isPopulated = typeof item === "object" && item !== null && "_id" in (item as object);
        const doc = isPopulated ? (item as VexMediaDocument) : undefined;
        const id = doc ? doc._id : String(item);
        const title = doc?.filename ?? id;
        return (
          <Badge key={id} variant="secondary" title={id} className="gap-1.5">
            {doc ? <FilePreview mediaDoc={doc} size={16} radius={2} /> : null}
            {title}
          </Badge>
        );
      })}
    </div>
  );
}
