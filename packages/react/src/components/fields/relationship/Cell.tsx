"use client";

import { useEffect, useState } from "react";

import type { CellComponentProps, RelationshipField, TDocument } from "@vexcms/core";
import { useVexConfig } from "../../../context/VexConfigContext";
import { resolveRelationshipPreview } from "./preview";

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
 *   renders `doc[useAsTitle] ?? doc._id` as plain text.
 * - > 1 docs → `"{count} {pluralLabel}"` using `targetCollection.labels.plural`.
 * - Unpopulated IDs → `"{count} item(s)"` fallback.
 *
 * **Hydration note:** always renders `—` during SSR and the initial hydration
 * render. The Convex `queryClient` is a module-level singleton that persists
 * across soft navigations; it can push cached subscription data synchronously
 * into TanStack Query's cache during React hydration (via `useSyncExternalStore`),
 * causing a server/client mismatch. By rendering a fixed placeholder until
 * after mount, the first client render always matches the server output.
 *
 * @param props - Standard cell component props.
 */
export function RelationshipFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<RelationshipField, TData>,
) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { row, fieldDef, fieldKey } = props;
  const config = useVexConfig();

  // SSR and initial hydration render — consistent placeholder prevents mismatch.
  if (!isMounted) {
    return <span className="text-[13px] text-muted-foreground">—</span>;
  }

  const rawValue = row.original[fieldKey] as unknown[] | undefined;

  if (!rawValue || rawValue.length === 0) {
    return <span className="text-[13px] text-muted-foreground">—</span>;
  }

  const isPopulated =
    typeof rawValue[0] === "object" && rawValue[0] !== null && "_id" in (rawValue[0] as object);

  if (!isPopulated) {
    return (
      <span className="text-[13px] text-muted-foreground">
        {rawValue.length} item{rawValue.length !== 1 ? "s" : ""}
      </span>
    );
  }

  const docs = rawValue as TDocument[];
  const targetCollection = config.collections.find((c) => c.slug === fieldDef.collection.slug);

  if (docs.length === 1) {
    const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
    return (
      <Preview
        doc={docs[0]}
        fieldKey={fieldKey}
        config={(targetCollection ?? props.collection) as never}
      />
    );
  }

  const pluralLabel = targetCollection?.labels.plural ?? fieldDef.collection.slug;
  return (
    <span className="text-[13px] text-foreground">
      {docs.length} {pluralLabel}
    </span>
  );
}
