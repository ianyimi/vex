"use client";

import {
  isDisplayValueEmpty,
  type DisplayComponentProps,
  type RelationshipField,
  type TDocument,
  type VexClientConfig,
  type VexDocument,
} from "@vexcms/core";
import { Badge } from "../../ui/badge";
import { useVexConfig } from "../../config/VexConfigContext";

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
 * reachable even when a title is shown. Moved from `ListViewPeek.tsx`'s own
 * prior `RelationshipFieldValue`.
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
  const items = raw.map((item) => {
    const isPopulated = typeof item === "object" && item !== null && "_id" in (item as object);
    if (isPopulated) {
      const doc = item as VexDocument;
      return { id: doc._id, title: titleOfPopulatedDoc(doc, config, props.field.collection.slug) };
    }
    const id = String(item);
    return { id, title: id };
  });
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <Badge key={item.id} variant="secondary" title={item.id}>
          {item.title}
        </Badge>
      ))}
    </div>
  );
}
