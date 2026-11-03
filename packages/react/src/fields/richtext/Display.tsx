"use client";

import type { ComponentType } from "react";
import {
  isDisplayValueEmpty,
  richTextToPlainText,
  type DisplayComponentProps,
  type RichTextField,
  type TDocument,
  type VexRenderComponentProps,
} from "@vexcms/core";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * Rich text field read-only display, registered as
 * `reactAdapter.fields.richtext.display`.
 *
 * Reuses the project's CONFIGURED editor adapter's own `renderComponent` —
 * the same `VexEditorAdapter` extension point (`config.editor.renderComponent`,
 * e.g. `@vexcms/richtext-plate`'s `RichText`, a server-safe `PlateStatic`
 * tree) a front-end page would use to render the stored document formatted
 * (headings, bold/italic, lists, links, …), never the flat-text excerpt
 * `richTextFieldCell`/`richTextToPlainText` show in the data table.
 *
 * Falls back to `richTextToPlainText` (still better than nothing) when no
 * editor adapter is configured — mirrors `RichTextFieldAdmin`'s own
 * no-adapter handling, just without the loud error box: a read-only
 * display showing plain text degrades gracefully, an editable form
 * missing its control does not.
 *
 * **No construction-order gate** (developer decision, after a round of
 * investigation that could not pin a reproducible application-level
 * cause): a prior `ui/heavyEditorGate.ts` mutex serialized every heavy
 * editor's first construction, based on a live hang (CPU-profiled,
 * `fields` collection's `test@proton.me` row — both a `json` and a
 * `richtext` field populated) that pointed at a Suspense-reconnect loop
 * repeatedly re-mounting the json field's `JsonEditor`. That fix was
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
 * @returns The adapter's `renderComponent` output, a plain-text fallback, or an em-dash for an empty value.
 */
export function RichTextFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<RichTextField, TData>,
) {
  const config = useVexConfig();

  if (isDisplayValueEmpty(props.value)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const document = props.value ?? [];
  if (config.editor?.renderComponent) {
    const RenderComponent = config.editor.renderComponent as ComponentType<VexRenderComponentProps>;
    return (
      <div className="text-sm">
        <RenderComponent content={document} />
      </div>
    );
  }
  return <p className="text-sm whitespace-pre-wrap break-words">{richTextToPlainText({ document })}</p>;
}
