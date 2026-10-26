"use client";

import { useEffect, useRef } from "react";
import { valuesEqual } from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { changedValues } from "../components/form/changedValues";

/** A save waiting for the live document to catch up before the form resets. */
interface PendingReset {
  /** The changed values the save wrote. */
  changes: Record<string, unknown>;
  /** The live document at save time — the "still stale" baseline. */
  before: Record<string, unknown> | null | undefined;
}

/**
 * Defers an edit view's post-save `form.reset()` until the live document
 * reflects the save.
 *
 * Resetting right after the mutation resolves reverts every saved field to the
 * PRE-save document for a beat: `reset()` reads the form's `defaultValues`,
 * which `useFieldsForm` rebuilds from the document prop each render, and that
 * prop is still the old row until the Convex subscription (or the newly
 * activated draft row's query) delivers. Plain inputs survive the flicker
 * visually; a stateful editor (the Plate richtext field) applies it as real
 * content, and under autosave the revert-then-restore became an endless
 * save loop of alternating versions.
 *
 * A changed field counts as caught up once the document holds the saved value,
 * or holds anything other than its pre-save value — the latter covers a
 * server-side `beforeChange` hook that normalized the value, so the form never
 * waits forever on a value the server will not echo back verbatim.
 *
 * At reset time the form must still hold exactly the saved changes; keystrokes
 * typed while the save was in flight stay dirty for the next (auto)save instead
 * of being discarded.
 *
 * @param props.form - The edit view's form instance.
 * @param props.document - The live stored row (never a history snapshot being
 *   viewed) — the form's defaults come from it once a save clears the view.
 * @returns `resetWhenSaved(changes)` — call after a successful save with the
 *   changed values it wrote.
 */
export function useResetWhenSaved(props: {
  form: AnyFormApi;
  document: Record<string, unknown> | null | undefined;
}): (changes: Record<string, unknown>) => void {
  const { form, document } = props;
  const pendingRef = useRef<PendingReset | null>(null);
  const documentRef = useRef(document);
  documentRef.current = document;

  // Resets once every changed field has left its pre-save value (or now holds
  // the saved one), and only if the form still holds exactly those changes.
  function settle(live: Record<string, unknown> | null | undefined): void {
    const pending = pendingRef.current;
    if (!pending) return;
    const caughtUp = Object.entries(pending.changes).every(
      ([key, saved]) =>
        valuesEqual(live?.[key], saved) ||
        !valuesEqual(live?.[key], pending.before?.[key]),
    );
    if (!caughtUp) return;
    pendingRef.current = null;
    if (valuesEqual(changedValues(form), pending.changes)) {
      form.reset();
    }
  }

  useEffect(() => {
    settle(document);
    // `form` is stable for the view's lifetime; the check re-runs per document.
  }, [document]);

  return (changes) => {
    pendingRef.current = { changes, before: documentRef.current };
    // Already caught up (or an empty write): nothing later would re-trigger the effect.
    settle(documentRef.current);
  };
}
