"use client";

import { useId } from "react";
import { type DisplayComponentProps, type JsonField, type TDocument } from "@vexcms/core";
import { JsonEditor } from "../../ui/JsonEditor";

/**
 * JSON field read-only display, registered as `reactAdapter.fields.json.display`.
 *
 * Renders the SAME `JsonEditor` the `json` admin field's own `Field.tsx`
 * uses for editing (CodeMirror-backed, syntax-highlighted, formatted) —
 * `readOnly`, dimmed, with a no-op `onChange` (a read-only editor never
 * dispatches a change transaction, but `JsonEditor`'s `onChange` prop
 * isn't optional). Used both for a top-level `json` field in the peek's
 * Fields tab and, recursively, for a `json` field nested inside a
 * `group`/`array`/`blocks` value.
 *
 * **No construction-order gate** (developer decision, after a round of
 * investigation that could not pin a reproducible application-level
 * cause): a prior `ui/heavyEditorGate.ts` mutex serialized every heavy
 * editor's first construction, based on a live hang (CPU-profiled,
 * `fields` collection's `test@proton.me` row — both a `json` and a
 * `richtext` field populated) that pointed at a Suspense-reconnect loop
 * repeatedly re-mounting this component's `JsonEditor`. That fix was
 * removed: the edit view mounts both a real CodeMirror and a real
 * Plate editor together with NO gate and never hangs, and the peek's
 * own hang did not reproduce on a freshly cold-restarted dev server —
 * gated or ungated — across an exhaustive pass (both the Fields and
 * JSON tabs, the default and shared posts views, post3, and the
 * original `test@proton.me` repro). The CPU profile evidence itself
 * still stands as a real artifact; the working theory is dev-server/HMR
 * state accumulated over a long session rather than a bug in this
 * component. If it recurs, profile a PRODUCTION build
 * (`next build && next start`) first, to separate a genuine bug from
 * dev/HMR accumulation, before reaching for a mutex again.
 *
 * @param props - Component props.
 * @returns The read-only `JsonEditor`, showing `props.value` formatted (or `"null"` when absent).
 */
export function JsonFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<JsonField, TData>,
) {
  const id = useId();
  const text = JSON.stringify(props.value ?? null, null, 2);
  return <JsonEditor id={id} value={text} onChange={() => {}} readOnly />;
}
