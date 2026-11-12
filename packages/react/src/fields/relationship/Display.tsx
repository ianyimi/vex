"use client";

import {
  isDisplayValueEmpty,
  type DisplayComponentProps,
  type HiddenDocument,
  type RelationshipField,
  type TDocument,
  type VexClientConfig,
  type VexDocument,
} from "@vexcms/core";
import { Badge } from "../../ui/badge";
import { useVexConfig } from "../../config/VexConfigContext";
import { AccessDeniedChip } from "../../access";

/**
 * True when a populated field's item is a `populateDocs`-produced
 * {@link HiddenDocument} placeholder rather than a real target doc.
 *
 * @param value - The populated field's item to check.
 * @returns Whether `value` is a {@link HiddenDocument}.
 */
function isHiddenDocument(value: unknown): value is HiddenDocument {
  return (
    typeof value === "object" && value !== null && (value as Record<string, unknown>).code === "ACCESS_DENIED"
  );
}

/**
 * `isTitleField`-equivalent lookup: resolves the target collection's own
 * `useAsTitle` field for a populated relationship doc. Moved verbatim from
 * `ListViewPeek.tsx`'s own prior copy (polish round — the peek's Fields tab now
 * resolves every field through `fieldToDisplayComponent` instead of its
 * own hand-coded per-type branches).
 *
 * @param doc - The populated related document.
 * @param config - The client config, searched for the target collection matching `targetSlug`.
 * @param targetSlug - The related collection's slug.
 * @returns The target's `useAsTitle` field value (or `_id` when the collection has none or the field itself is missing), stringified.
 */
function titleOfPopulatedDoc(doc: VexDocument, config: VexClientConfig, targetSlug: string): string {
  const targetCollection = config.collections.find((c) => c.slug === targetSlug);
  const titleField = targetCollection?.admin.useAsTitle ?? "_id";
  const value = (doc as Record<string, unknown>)[titleField];
  return value === undefined || value === null ? doc._id : String(value);
}

/**
 * Relationship field read-only display, registered as
 * `reactAdapter.fields.relationship.display`.
 *
 * Renders one chip per related doc — the resolved target title (when the
 * value arrived populated, i.e. seeded from already-loaded rows) or the
 * raw id alone (when only an unpopulated `get` is available) — plus the
 * raw target id on every chip's `title` attribute, so the id is always
 * reachable even when a title is shown. A denied target (`populateDocs`'s
 * `HiddenDocument` placeholder) renders `AccessDeniedChip` instead, a
 * compact lock badge sized to sit among the other chips. Moved from
 * `ListViewPeek.tsx`'s own prior `RelationshipFieldValue`.
 *
 * @param props - Component props.
 * @returns One chip per related doc, or an em-dash for an empty relationship.
 */
export function RelationshipFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<RelationshipField, TData>,
) {
  const config = useVexConfig();
  const raw = Array.isArray(props.value) ? props.value : [];
  if (isDisplayValueEmpty(raw)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const targetCollection = config.collections.find((c) => c.slug === props.field.collection.slug);
  return (
    <div className="flex flex-wrap gap-1">
      {raw.map((item) => {
        if (isHiddenDocument(item)) {
          return (
            <AccessDeniedChip
              key={item._id}
              resource={item.resource}
              action={item.action}
              label={targetCollection?.labels.singular ?? props.field.collection.slug}
            />
          );
        }
        const isPopulated = typeof item === "object" && item !== null && "_id" in (item as object);
        if (isPopulated) {
          const doc = item as VexDocument;
          return (
            <Badge key={doc._id} variant="secondary" title={doc._id}>
              {titleOfPopulatedDoc(doc, config, props.field.collection.slug)}
            </Badge>
          );
        }
        const id = String(item);
        return (
          <Badge key={id} variant="secondary" title={id}>
            {id}
          </Badge>
        );
      })}
    </div>
  );
}
