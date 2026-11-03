"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { valuesEqual, DEFAULT_AUTOSAVE_DEBOUNCE_MS } from "@vexcms/core";

/** Current state of an {@link useAutosave} instance. */
export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/** Return value of {@link useAutosave}. */
export interface UseAutosaveResult {
  /** Current autosave state. */
  status: AutosaveStatus;
  /** `Date.now()` of the last successful save, or `null` before the first one. */
  lastSavedAt: number | null;
  /** The error from the most recent failed save, or `null`. */
  error: Error | null;
  /**
   * `true` whenever there is work not yet durably saved: a change still
   * sitting in the debounce window (`status` is still `"idle"` or
   * `"saved"` there — see {@link AutosaveStatus}), a save currently in
   * flight (`status === "saving"`), or the last save attempt failed
   * (`status === "error"`). `false` once a save succeeds AND the caller's
   * `onSave` has reset its form to match, dropping `props.values` back to
   * an empty diff (spec decision 5) — use this, not `status` alone, to decide
   * whether navigating away would lose work.
   */
  hasUnsavedChanges: boolean;
}

/**
 * Persists `props.values` via `props.onSave` whenever they settle into a new
 * state, debounced — never on a fixed interval, and never merging ("no
 * coalescing") a change that arrives while a save is already in flight into
 * that in-flight request. A change during an in-flight save instead waits
 * for it to finish, then retries independently with the latest values.
 *
 * Fully generic: it never imports a form type or `@vexcms/core`'s versions
 * API. `CollectionEditView` and `GlobalEditView` both wire it the same way —
 * `values` is `changedValues(form)` (or, before a global's first save, the
 * raw form defaults, matching the manual Save Draft handler each view
 * already has), and `onSave` calls that same view's own `saveDraft`
 * mutation. Nothing about this hook is collection- or global-specific.
 *
 * Comparison is against the values from the LAST SUCCESSFUL save (seeded
 * from `props.values` at mount, so mounting never itself counts as a
 * change), via `valuesEqual.eq` (content equality — the same
 * comparator `useLiveFieldMerge` already uses for this exact "did this
 * actually change" question, since a fresh `changedValues(form)` object is
 * a new reference on every render even when its contents match).
 *
 * A failed save does NOT update the last-saved baseline, so the next settle
 * retries the same diff rather than silently dropping it.
 *
 * @param props - Hook props.
 * @param props.values - The current value snapshot to keep saved. Typically
 *   `changedValues(form)` — only the fields the user has actually edited.
 * @param props.onSave - Persists `values`. Any rejection is caught and
 *   surfaced via `error`/`status`, never left as an unhandled rejection.
 * @param props.enabled - Whether autosave is active at all. Defaults to
 *   `true`. Flipping to `false` mid-debounce cancels the pending save.
 * @param props.debounceMs - Milliseconds of no further change before saving.
 *   Defaults to `DEFAULT_AUTOSAVE_DEBOUNCE_MS`.
 * @returns The current {@link UseAutosaveResult}.
 *
 * @example
 * ```tsx
 * // CollectionEditView
 * const { status } = useAutosave({
 *   values: changedValues(form),
 *   onSave: (changes) =>
 *     saveDraftMutation({ collection: collection.slug, id: activeDocumentId, data: changes })
 *       .then((draftId) => setActiveDocumentId(draftId)),
 *   enabled: isVersioned && collection.versions.autosave.enabled && canEdit,
 * });
 *
 * // GlobalEditView
 * const { status } = useAutosave({
 *   values: globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>),
 *   onSave: (changes) => saveDraftMutation({ global: global.slug, data: changes }),
 *   enabled: hasDrafts && global.versions.autosave.enabled && canEdit,
 * });
 * ```
 */
export function useAutosave<TValues extends Record<string, unknown>>(props: {
  values: TValues;
  onSave: (values: TValues) => Promise<void>;
  enabled?: boolean;
  debounceMs?: number;
}): UseAutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Seeded with the current values, so mounting is never itself a change.
  const lastSavedValuesRef = useRef<TValues>(props.values);
  // Assigned every render so `runSave` — including its in-flight retry —
  // always reads the newest values.
  const latestValuesRef = useRef<TValues>(props.values);
  latestValuesRef.current = props.values;
  // Read through a ref so `runSave` stays stable: an inline `onSave` (the
  // edit views pass arrow functions) would otherwise rebuild it every render.
  const onSaveRef = useRef(props.onSave);
  onSaveRef.current = props.onSave;
  const isSavingRef = useRef(false);
  const hasPendingChangeRef = useRef(false);

  const runSave = useCallback(async (): Promise<void> => {
    isSavingRef.current = true;
    setStatus("saving");
    const toSave = latestValuesRef.current;
    try {
      await onSaveRef.current(toSave);
      lastSavedValuesRef.current = toSave;
      setStatus("saved");
      setLastSavedAt(Date.now());
      setError(null);
    } catch (caught) {
      // The baseline is NOT advanced: the next settle retries the same diff.
      setStatus("error");
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      isSavingRef.current = false;
      // A change landed while this save was in flight. If the user then
      // stopped typing, no debounce timer will fire again — retry it here as
      // its own independent `onSave` call (never merged into the one above).
      if (hasPendingChangeRef.current) {
        hasPendingChangeRef.current = false;
        if (
          Object.keys(latestValuesRef.current).length > 0 &&
          !valuesEqual(latestValuesRef.current, lastSavedValuesRef.current)
        ) {
          void runSave();
        }
      }
    }
  }, []);

  useEffect(() => {
    if (props.enabled === false) return;
    // Content equality, not `===`: a fresh `changedValues(form)` object every
    // render must not count as a change.
    if (valuesEqual(props.values, lastSavedValuesRef.current)) return;
    // An empty change set means nothing is unsaved — e.g. right after the caller
    // resets its form on a successful save, `changedValues(form)` drops to `{}`.
    // Saving it would write an empty draft and a spurious history row.
    if (Object.keys(props.values).length === 0) return;
    if (isSavingRef.current) {
      hasPendingChangeRef.current = true;
      return;
    }
    const timeoutId = setTimeout(() => {
      void runSave();
    }, props.debounceMs ?? DEFAULT_AUTOSAVE_DEBOUNCE_MS);
    // A further change (or `enabled` → false, or unmount) cancels this attempt.
    return () => clearTimeout(timeoutId);
  }, [props.values, props.enabled, props.debounceMs, runSave]);

  // Mirrors the skip conditions in the effect above: a non-empty diff that
  // doesn't yet match the last successful save is unsaved work, regardless
  // of `status` (the debounce window keeps `status` at `"idle"`/`"saved"`).
  // The empty-diff check matters right after a successful save: the
  // caller's `onSave` resets its form so `props.values` drops to `{}`,
  // which differs from the non-empty `lastSavedValuesRef.current` by
  // `valuesEqual` but means "nothing unsaved", not "save `{}`".
  const hasUnsavedChanges =
    status === "saving" ||
    status === "error" ||
    (Object.keys(props.values).length > 0 &&
      !valuesEqual(props.values, lastSavedValuesRef.current));

  return { status, lastSavedAt, error, hasUnsavedChanges };
}
