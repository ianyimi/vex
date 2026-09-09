"use client";

import { useQuery } from "@tanstack/react-query";
import {
  addLeadingSlash,
  CellComponentProps,
  CollectionConfig,
  CollectionSlug,
  TDocument,
  UploadField,
  VexMediaDocument,
} from "@vexcms/core";
import type { ReactNode } from "react";
import { FilePreview } from "../../media/FilePreview";
import { get } from "@vexcms/core/client";
import { GenericId } from "convex/values";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Table cell rendering for upload field.
 *
 * Shows:
 * - Empty: "—" placeholder.
 * - Single value (array of 1): FilePreview thumbnail + filename truncated with ellipsis, no badge.
 * - Multiple values (array of 2+): FilePreview thumbnail + filename truncated with ellipsis, `+N` badge.
 *
 * Matches the `UploadCell` design: inline-flex with FilePreview (26px) + filename + badge.
 *
 * @param props - Component props.
 * @param props.value - Array of media document IDs.
 * @returns An em-dash placeholder when empty, a loading label while the
 *   referenced media document is fetching, or a thumbnail + filename (with a
 *   `+N` badge for additional items).
 */
export function UploadFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<UploadField, TData, CollectionConfig>,
) {
  const { value } = props;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const href = `${basePath}/${props.collection.slug}/${props.row.original._id}`;
  const wrap = (content: ReactNode) =>
    props.isTitleField ? <VexLink href={href}>{content}</VexLink> : content;

  // `useQuery` runs on every render, before the empty-value early return
  // below, and opts out through `get`'s own `skip` sentinel when there is no
  // id yet. Calling it after the early return instead made the hook count
  // depend on `value`, so a cell whose upload was added or cleared between
  // renders threw "Rendered fewer hooks than expected" — React recovered by
  // re-rendering the root synchronously, but the table lost its concurrent
  // render and logged the error.
  const firstId = value?.[0];
  const { data: doc } = useQuery({
    ...get({
      id: firstId as GenericId<CollectionSlug>,
      collection: props.fieldDef.to,
      skip: firstId === undefined,
    }),
  });
  const mediaDoc = doc as VexMediaDocument;

  if (!value || value.length === 0) {
    return wrap(<span className="text-muted-foreground">—</span>);
  }

  if (!mediaDoc) {
    return wrap(
      <span className="text-muted-foreground" title={value.join(", ")}>
        Loading...
      </span>,
    );
  }

  return wrap(
    <span className="inline-flex min-w-0 items-center gap-2">
      <FilePreview mediaDoc={mediaDoc} size={26} radius={2} />
      <span
        className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap"
        title={mediaDoc.filename}
      >
        {mediaDoc.filename}
      </span>
      {value.length > 1 && <span className="vex-badge muted font-mono">+{value.length - 1}</span>}
    </span>,
  );
}
