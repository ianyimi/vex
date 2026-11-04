"use client";

import { type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  isDisplayValueEmpty,
  type AdminDataField,
  type CollectionConfig,
  type MediaCollectionConfig,
  type VexDocument,
} from "@vexcms/core";
import { fieldToDisplayComponent } from "../../../../fields";
import { ScrollSection } from "../../../../ui/ScrollSection";
import { PeekCopyButton, peekFieldCopyText } from "./ListViewPeekCopyButton";

/**
 * One Fields-tab row: label, mono key, value, and a copy button.
 *
 * @param props.disabled - Forwarded to the copy button — disabled for an empty value.
 * @returns The field row, with a copy button that toasts `Copied {label}` on success or an error on failure.
 */
function PeekFieldRow(props: {
  label: string;
  fieldKey: string;
  copyText: string;
  disabled?: boolean;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{props.label}</p>
        <p className="font-mono text-[11px] text-muted-foreground/70">{props.fieldKey}</p>
        <div className="mt-1 text-sm">{props.children}</div>
      </div>
      <PeekCopyButton label={props.label} text={props.copyText} disabled={props.disabled} />
    </div>
  );
}

/**
 * The `ListViewPeek` Fields tab — one {@link PeekFieldRow} per readable field,
 * split out of `ListPeekPanel`'s own body verbatim
 * (Phase 3 component-folder split, no behavior change). Receives the
 * already-loaded, POPULATED `document` (same shape `props.rows` holds) and
 * the same `visibleFieldEntries`/`canReadField` gating `ListPeekPanel`
 * already resolved — this component does no system-field access-gating work of
 * its own, only renders what it's handed.
 *
 * @param props.document - The populated document (`props.rows`'s own depth), never `null`/`undefined` — the caller only mounts this tab once a document has resolved.
 * @param props.visibleFieldEntries - `[key, field]` entries the caller may read, in declaration order (`useVisibleFields`'s own return).
 * @param props.canReadField - Resolves whether a system key (`_creationTime`) is readable — gates the "Created" row.
 * @param props.collection - Forwarded to each field's `Display` component.
 * @returns The Fields tab's scrollable row list: ID, Created (when readable), then every visible field.
 */
export function ListViewPeekFieldsTab<TDocument extends VexDocument = VexDocument>(props: {
  document: TDocument;
  visibleFieldEntries: Array<[string, AdminDataField]>;
  canReadField: (field: string) => boolean;
  collection: CollectionConfig | MediaCollectionConfig;
}): ReactNode {
  const document = props.document;

  // `_creationTime` can be ABSENT once a role's field map stops
  // listing it (`new Date(undefined)
  // .toISOString()` threw "RangeError: Invalid time value" before this
  // guard existed). The "Created" row now shows only when the value is
  // BOTH present AND actually readable (`canReadField("_creationTime")`
  // — `_id` is the only permanently ungateable key) — the `typeof`
  // check stays as defense-in-depth regardless of what `canReadField`
  // says, since a genuinely missing value must never reach `new Date`.
  const canReadCreationTime = props.canReadField("_creationTime");
  const creationIso =
    typeof document._creationTime === "number" && canReadCreationTime
      ? new Date(document._creationTime).toISOString()
      : undefined;
  const creationRelative =
    typeof document._creationTime === "number" && canReadCreationTime
      ? formatDistanceToNow(new Date(document._creationTime), { addSuffix: true })
      : undefined;

  return (
    <ScrollSection className="h-full">
      <PeekFieldRow label="ID" fieldKey="_id" copyText={document._id}>
        <span className="font-mono text-xs break-all">{document._id}</span>
      </PeekFieldRow>
      {creationIso !== undefined ? (
        <PeekFieldRow label="Created" fieldKey="_creationTime" copyText={creationIso}>
          <div className="space-y-0.5">
            <p>{creationIso}</p>
            <p className="text-xs text-muted-foreground">
              {document._creationTime} · {creationRelative}
            </p>
          </div>
        </PeekFieldRow>
      ) : null}
      {props.visibleFieldEntries.map(([key, fieldDef]) => {
        const value = (document as Record<string, unknown>)[key];
        const FieldDisplay = fieldToDisplayComponent(fieldDef.type);
        const isEmpty = isDisplayValueEmpty(value);
        return (
          <PeekFieldRow
            key={key}
            label={fieldDef.label}
            fieldKey={key}
            copyText={peekFieldCopyText(value)}
            disabled={isEmpty}
          >
            {FieldDisplay ? (
              <FieldDisplay field={fieldDef} value={value} document={document} collection={props.collection} />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </PeekFieldRow>
        );
      })}
    </ScrollSection>
  );
}
