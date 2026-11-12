"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CellComponentProps,
  CollectionConfig,
  CollectionSlug,
  type HiddenDocument,
  TDocument,
  UploadField,
  VexMediaDocument,
} from "@vexcms/core";
import type { ReactNode } from "react";
import { FilePreview } from "../../media/FilePreview";
import { get } from "../../client";
import { GenericId } from "convex/values";
import { Skeleton, VexLink } from "../../ui";
import { AccessDeniedItemRow } from "../../access";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

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
 * Table cell rendering for upload field.
 *
 * Reads `row.original[fieldKey]` which is either:
 * - `VexMediaDocument[]` — populated media docs when the list query was run
 *   with `depth: 1` (the normal case; `find`/`search`'s `buildDepthPopulate`
 *   auto-populates upload fields the same way it auto-populates relationship
 *   fields).
 * - `string[]` — raw media-document ids, a fallback for a row that predates
 *   depth-populate (e.g. a stale cached entry carried over a soft navigation).
 *
 * Shows:
 * - Empty: "—" placeholder.
 * - Populated (array of docs, any length): FilePreview thumbnail + filename
 *   truncated with ellipsis, `+N` badge for 2+ items — read straight from the
 *   row, no query. A denied target (`populateDocs`'s `HiddenDocument`
 *   placeholder) renders `AccessDeniedItemRow` instead of attempting the
 *   preview on a doc that carries none of `FilePreview`'s required fields.
 * - Unpopulated fallback (array of raw ids): a full-width skeleton while a
 *   single `get` query (fired only in this case) resolves the first id.
 *
 * Matches the `UploadCell` design: inline-flex with FilePreview (26px) + filename + badge.
 *
 * @param props - Component props.
 * @param props.value - Array of media document IDs.
 * @returns An em-dash placeholder when empty, a skeleton while an
 *   unpopulated fallback row's referenced media document is fetching, or a
 *   thumbnail + filename (with a `+N` badge for additional items).
 */
export function UploadFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<UploadField, TData, CollectionConfig>,
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
  const isPopulated =
    Array.isArray(rawValue) &&
    rawValue.length > 0 &&
    typeof rawValue[0] === "object" &&
    rawValue[0] !== null &&
    "_id" in (rawValue[0] as object);

  // Fallback-only query, fired exclusively for an unpopulated raw-id row.
  // Called unconditionally (before the empty-value early return below), same
  // reasoning as the prior single-query version: calling a hook after an
  // early return would make the hook count depend on `value`, throwing
  // "Rendered fewer hooks than expected" for a cell whose upload changed
  // between renders. Opts out through `get`'s own `skip` sentinel instead.
  const fallbackId = !isPopulated ? (rawValue?.[0] as string | undefined) : undefined;
  const { data: fallbackDoc } = useQuery({
    ...get({
      id: fallbackId as GenericId<CollectionSlug>,
      collection: fieldDef.to,
      skip: fallbackId === undefined,
    }),
  });

  if (!rawValue || rawValue.length === 0) {
    return wrap(<span className="text-muted-foreground">—</span>);
  }

  const firstMediaDoc = isPopulated
    ? (rawValue[0] as VexMediaDocument | HiddenDocument)
    : (fallbackDoc as VexMediaDocument | undefined);

  if (!firstMediaDoc) {
    // Unpopulated fallback row, still fetching: full-width skeleton instead
    // of a "Loading..." text swap, filling the column up to a sensible max.
    // `title` carries the full raw id list, same as the prior text fallback —
    // the shared Cell contract (fieldCellContract.ts) expects an over-length
    // value's full form to remain reachable via a `title` attribute even
    // while the real content hasn't resolved yet.
    return wrap(
      <Skeleton className="h-[26px] w-full max-w-48" title={rawValue.join(", ")} />,
    );
  }

  if (isHiddenDocument(firstMediaDoc)) {
    const targetCollection = config.mediaCollections.find((c) => c.slug === fieldDef.to);
    return wrap(
      <AccessDeniedItemRow
        resource={firstMediaDoc.resource}
        action={firstMediaDoc.action}
        label={targetCollection?.labels.singular ?? fieldDef.to}
      />,
    );
  }

  return wrap(
    <span className="inline-flex min-w-0 items-center gap-2">
      <FilePreview mediaDoc={firstMediaDoc} size={26} radius={2} />
      <span
        className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap"
        title={firstMediaDoc.filename}
      >
        {firstMediaDoc.filename}
      </span>
      {rawValue.length > 1 && <span className="vex-badge muted font-mono">+{rawValue.length - 1}</span>}
    </span>,
  );
}
