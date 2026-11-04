"use client";

import { type ReactNode } from "react";
import { ADMIN_FIELDS, type AdminDataField } from "@vexcms/core";
import { Skeleton } from "../../../../ui/skeleton";
import { ScrollSection } from "../../../../ui/ScrollSection";
import { JsonEditor } from "../../../../ui/JsonEditor";
import { PeekCopyButton } from "./ListViewPeekCopyButton";

/**
 * System keys that are gateable
 * in a collection's `FieldPermissionMap` for reads, that
 * ALSO need explicit handling here — `_id` deliberately excluded
 * (not a valid field-map key, always readable). `updatedAt`
 * is ALSO excluded, despite being gateable: `defineCollection` injects it
 * as a REAL top-level `dataFields` entry (`kind: "data"`, `commitTs`
 * type) for every collection unless `timestamps: false` — confirmed
 * directly, `getDataFields` returns it — so it already flows through the
 * EXISTING `visibleFieldEntries` pipeline passed in below: its own
 * Fields-tab row already hides itself when unreadable, this strip loop
 * already omits it via `visibleKeys`, and the hidden-count the caller
 * computed already counts it. Handling it here too would double-count it.
 * `_creationTime` (every document) and `vex_status` (versioned
 * collections only — NEVER a `dataFields` entry, confirmed the same way)
 * are true system properties outside that pipeline entirely, so THEY
 * need this explicit list.
 */
const GATEABLE_SYSTEM_FIELD_KEYS = ["_creationTime", "vex_status"] as const;

/**
 * The `ListViewPeek` JSON tab — the document's RAW (depth-0) shape,
 * split out of `ListPeekPanel`'s own body
 * verbatim (Phase 3 component-folder split, no behavior change).
 *
 * @param props.rawDocument - The depth-0 fetch's own document (a relationship/upload field holds the raw stored id(s), not populated docs) — `undefined` while that fetch is still in flight, independent of the rest of the panel.
 * @param props.dataFields - The collection's data fields, keyed — used to strip an `admin.hidden`/`admin.condition`-hidden field from the JSON, mirroring the Fields tab's own `visibleFieldEntries` set.
 * @param props.visibleFieldEntries - `[key, field]` entries the caller may read, in declaration order — also checked for a `commitTs`-typed field to decide whether the nanoseconds-vs-milliseconds notice shows.
 * @param props.canReadField - Resolves whether a {@link GATEABLE_SYSTEM_FIELD_KEYS} key is readable — defense-in-depth on top of the server's own `stripDeniedFields`.
 * @returns The JSON tab: a "Copy JSON" header, an optional timestamp-units notice, and a read-only `JsonEditor` (or its loading skeleton while `rawDocument` is still in flight).
 */
export function ListViewPeekJsonTab(props: {
  rawDocument: Record<string, unknown> | null | undefined;
  dataFields: Record<string, AdminDataField>;
  visibleFieldEntries: Array<[string, AdminDataField]>;
  canReadField: (field: string) => boolean;
}): ReactNode {
  // Mirrors the stripping `get`'s server function already applies
  // (`stripDeniedFields`, before the document ever reaches the client —
  // a permission-denied field is never present in `rawDocument` to
  // begin with). This loop additionally drops fields `admin.hidden`/
  // `admin.condition` say shouldn't render for this document, which the
  // server does NOT strip (a display concern, not a security one) —
  // keeping the JSON tab in exact lockstep with the Fields tab's own
  // field set and order: never hiding or reordering beyond that.
  //
  // `rawDocument === undefined` while its own depth-0 fetch is still
  // in flight (the seeded-from-`props.rows` fast path has no cheap
  // depth-0 seed; a deep-linked peek's `useSuspenseVexDocQuery` already
  // shares this exact query key with a server prefetch, so THIS case
  // resolves instantly there) — `jsonText` stays `undefined` and the
  // JSON tab shows its own loading state below, independent of the
  // rest of the panel (which opened instantly from `document`).
  const visibleKeys = new Set(props.visibleFieldEntries.map(([key]) => key));
  let jsonText: string | undefined;
  if (props.rawDocument != null) {
    const jsonDoc: Record<string, unknown> = { ...props.rawDocument };
    for (const key of Object.keys(props.dataFields)) {
      if (!visibleKeys.has(key)) delete jsonDoc[key];
    }
    // `get`'s own server function already strips an unreadable system
    // key before `rawDocument` ever reaches the client (the SAME
    // `stripDeniedFields` pipeline `find`/`search` use, confirmed by
    // `get/server.test.ts`'s own "strips _creationTime, updatedAt, and
    // vex_status when a map explicitly denies them" case) — this loop
    // is defense-in-depth, not the real security boundary, matching
    // `_id` never needing one at all (always readable).
    for (const key of GATEABLE_SYSTEM_FIELD_KEYS) {
      if (!props.canReadField(key)) delete jsonDoc[key];
    }
    jsonText = JSON.stringify(jsonDoc, null, 2);
  }
  const hasCommitTsField = props.visibleFieldEntries.some(
    ([, fieldDef]) => fieldDef.type === ADMIN_FIELDS.commitTs.type,
  );

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 pt-2">
        <span id="list-peek-json-label" className="text-xs font-medium text-muted-foreground">
          JSON
        </span>
        <PeekCopyButton label="JSON" text={jsonText ?? ""} disabled={jsonText === undefined} />
      </div>
      {hasCommitTsField ? (
        <p className="px-3 pb-1 text-xs text-muted-foreground">
          Timestamp fields are shown in milliseconds — Convex stores them as nanoseconds.
        </p>
      ) : null}
      <ScrollSection className="h-full px-3 py-2">
        {jsonText === undefined ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <JsonEditor id="list-peek-json" value={jsonText} onChange={() => {}} readOnly aria-labelledby="list-peek-json-label" />
        )}
      </ScrollSection>
    </>
  );
}
