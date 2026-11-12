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
import { Skeleton } from "../../../../ui/skeleton";
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
 * (Phase 3 component-folder split, no behavior change). Renders the SAME
 * structure whether `props.document` has resolved or is still pending
 * (`ListPeekPanel`'s own Suspense fallback) — every row (ID, Created when
 * readable, then each visible field) always renders with its real
 * label/key; only the VALUE slot swaps to a `Skeleton` while pending. This
 * is deliberate, not incidental: the fallback used to be a hand-rolled,
 * structurally unrelated placeholder (a handful of generic skeleton bars,
 * no labels/keys/tabs at all) that could never stay in sync with this
 * component's own real layout — collapsing both states into ONE component
 * makes that drift structurally impossible instead of merely tested
 * against.
 *
 * @param props.peekId - The id being peeked — used for the ID row's value while `props.document` is still pending (the id is already known synchronously, before any fetch resolves).
 * @param props.document - The populated document (`props.rows`'s own depth), or `undefined` while `ListPeekSuspended`'s own fetch is still in flight — the caller mounts this tab either way now (never gates it behind a resolved document).
 * @param props.visibleFieldEntries - `[key, field]` entries the caller may read, in declaration order (`useVisibleFields`'s own return) — already populated even while `document` is pending, for every field with no `admin.condition` (the common case).
 * @param props.canReadField - Resolves whether a system key (`_creationTime`) is readable — gates the "Created" row, independent of `document`.
 * @param props.collection - Forwarded to each field's `Display` component.
 * @returns The Fields tab's scrollable row list: ID, Created (when readable), then every visible field — each row's value a `Skeleton` while `props.document` is `undefined`.
 */
export function ListViewPeekFieldsTab<TDocument extends VexDocument = VexDocument>(props: {
  peekId: string;
  document: TDocument | undefined;
  visibleFieldEntries: Array<[string, AdminDataField]>;
  canReadField: (field: string) => boolean;
  collection: CollectionConfig | MediaCollectionConfig;
}): ReactNode {
  const document = props.document;
  const idValue = document !== undefined ? document._id : props.peekId;

  // `_creationTime` can be ABSENT once a role's field map stops
  // listing it (`new Date(undefined)
  // .toISOString()` threw "RangeError: Invalid time value" before this
  // guard existed). The "Created" row shows once the value is BOTH present
  // AND actually readable (`canReadField("_creationTime")` — `_id` is the
  // only permanently ungateable key); while `document` is still pending,
  // `canReadField` alone decides whether the row (with a skeleton value)
  // shows at all — every document carries `_creationTime`, so this is never
  // a visible-then-gone flicker once the real value lands. The `typeof`
  // check stays as defense-in-depth regardless of what `canReadField` says,
  // since a genuinely missing value must never reach `new Date`.
  const canReadCreationTime = props.canReadField("_creationTime");
  const creationIso =
    document !== undefined && typeof document._creationTime === "number" && canReadCreationTime
      ? new Date(document._creationTime).toISOString()
      : undefined;
  const creationRelative =
    document !== undefined && typeof document._creationTime === "number" && canReadCreationTime
      ? formatDistanceToNow(new Date(document._creationTime), { addSuffix: true })
      : undefined;
  const showCreatedRow = document !== undefined ? creationIso !== undefined : canReadCreationTime;

  return (
    <ScrollSection className="h-full">
      <PeekFieldRow label="ID" fieldKey="_id" copyText={idValue}>
        <span className="font-mono text-xs break-all">{idValue}</span>
      </PeekFieldRow>
      {showCreatedRow ? (
        <PeekFieldRow
          label="Created"
          fieldKey="_creationTime"
          copyText={creationIso ?? ""}
          disabled={creationIso === undefined}
        >
          {creationIso !== undefined ? (
            <div className="space-y-0.5">
              <p>{creationIso}</p>
              <p className="text-xs text-muted-foreground">
                {document!._creationTime} · {creationRelative}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          )}
        </PeekFieldRow>
      ) : null}
      {props.visibleFieldEntries.map(([key, fieldDef]) => {
        if (document === undefined) {
          return (
            <PeekFieldRow key={key} label={fieldDef.label} fieldKey={key} copyText="" disabled>
              <Skeleton className="h-4 w-2/3" />
            </PeekFieldRow>
          );
        }
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
