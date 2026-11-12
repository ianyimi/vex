"use client";

import type { ReactNode } from "react";

import {
  type CellComponentProps,
  type HiddenDocument,
  type RelationshipField,
  type TDocument,
} from "@vexcms/core";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";
import { AccessDeniedItemRow } from "../../access";
import { VexLink } from "../../ui";
import { resolveRelationshipPreview } from "./preview";

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
 * Relationship field cell for the collection list-view data table.
 *
 * Reads `row.original[fieldKey]` which is either:
 * - `TDocument[]` — populated docs when the list query was run with `depth: 1`.
 * - `string[]` — raw Convex IDs when the query was not depth-populated (fallback).
 *
 * **Rendering rules:**
 * - 0 docs → em-dash placeholder.
 * - 1 doc → resolved preview component (`resolveRelationshipPreview` precedence:
 *   field-level override > target collection's preview > default). The default
 *   renders `doc[useAsTitle] ?? doc._id` as plain text. A denied target
 *   (`HiddenDocument` placeholder) renders `AccessDeniedItemRow` instead.
 * - > 1 docs → `"{count} {pluralLabel}"` using `targetCollection.labels.plural`.
 * - Unpopulated IDs → `"{count} item(s)"` fallback.
 *
 * **No hydration gate:** renders the same output on the server and on every
 * client render — `row.original[fieldKey]` comes from `useVexListQuery`'s
 * TanStack Query result, seeded by the server's own `initialData` under the
 * identical query key (`CollectionListView.serverParity.test.tsx` pins this
 * parity). An earlier `isMounted` gate here (always rendering `—` until after
 * mount) was removed: it caused the exact layout shift/visible swap it was
 * meant to avoid, and the SSR-parity infrastructure it predated already
 * guarantees the first client render matches the server's markup.
 *
 * @param props - Standard cell component props.
 * @returns The resolved preview, an item count, or an em-dash for an empty
 *   relationship — identical on server and client.
 */
export function RelationshipFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<RelationshipField, TData>,
) {
  const { row, fieldDef, fieldKey } = props;
  const config = useVexConfig();
  const href = adminHref(
    { type: "document", slug: props.collection.slug, id: props.row.original._id },
    config.basePath,
  );
  const wrap = (content: ReactNode) =>
    props.isTitleField ? <VexLink href={href}>{content}</VexLink> : content;

  const rawValue = row.original[fieldKey] as unknown[] | undefined;

  if (!rawValue || rawValue.length === 0) {
    return wrap(<span className="text-[13px] text-muted-foreground">—</span>);
  }

  const isPopulated =
    typeof rawValue[0] === "object" && rawValue[0] !== null && "_id" in (rawValue[0] as object);

  if (!isPopulated) {
    return wrap(
      <span className="text-[13px] text-muted-foreground" title={rawValue.join(", ")}>
        {rawValue.length} item{rawValue.length !== 1 ? "s" : ""}
      </span>,
    );
  }

  const docs = rawValue as (TDocument | HiddenDocument)[];
  const targetCollection = config.collections.find((c) => c.slug === fieldDef.collection.slug);

  if (docs.length === 1) {
    const doc = docs[0];
    if (isHiddenDocument(doc)) {
      return wrap(
        <AccessDeniedItemRow
          resource={doc.resource}
          action={doc.action}
          label={targetCollection?.labels.singular ?? fieldDef.collection.slug}
        />,
      );
    }
    const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
    return wrap(
      <Preview doc={doc} fieldKey={fieldKey} config={(targetCollection ?? props.collection) as never} />,
    );
  }

  const pluralLabel = targetCollection?.labels.plural ?? fieldDef.collection.slug;
  return wrap(
    <span className="text-[13px] text-foreground">
      {docs.length} {pluralLabel}
    </span>,
  );
}
