"use client";

import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useFrameworkComponents } from "../config/useFrameworkComponents";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

/**
 * What {@link useUnsavedChangesGuard} shares with the rest of the edit view
 * tree via {@link UnsavedChangesGuardContext}.
 */
export interface UnsavedChangesGuardContextValue {
  /**
   * One-shot bypass: call right before an app-initiated navigation (a
   * successful save, delete or duplicate) so it isn't itself intercepted.
   * Re-arms automatically the next time the computed dirty/autosave state
   * goes back to blocking.
   */
  release: () => void;
  /**
   * Routes a programmatic navigation attempt through the SAME blocking
   * state and the SAME mounted `UnsavedChangesDialog` as an in-app link
   * click or back/forward (spec decision 2) — `useVexNavigate`'s only way to
   * consult the guard, since it has no access to the guard's internal
   * `proceedRef`/`open` state otherwise.
   *
   * @param proceed - Performs the actual navigation. Called synchronously,
   *   right away, when the guard isn't currently blocking; otherwise held
   *   until — and only called if — the user clicks Leave.
   */
  attemptNavigation: (proceed: () => void) => void;
}

/**
 * Carries the active edit view's guard so a built-in that triggers its own
 * post-success navigation — `vex.save`, `vex.delete` (Step 4) and
 * `vex.duplicate` (Step 6), via `useVexNavigate` — can bypass or consult it
 * for that one navigation. `undefined` outside an edit view (e.g. a
 * `viewSuite` harness that doesn't mount the guard) — consumers treat that
 * as "never blocking".
 */
export const UnsavedChangesGuardContext = createContext<
  UnsavedChangesGuardContextValue | undefined
>(undefined);

/**
 * Reads the nearest edit view's guard `release()` so a built-in can bypass
 * the guard for its own post-success navigation.
 *
 * @returns The nearest edit view's `release()`, or a no-op outside one.
 */
export function useReleaseUnsavedChangesGuard(): () => void {
  return useContext(UnsavedChangesGuardContext)?.release ?? (() => {});
}

/** Result of {@link useUnsavedChangesGuard}. */
export interface UseUnsavedChangesGuardResult {
  /** Mount once in the edit view's returned tree; renders nothing while not blocking. */
  dialog: ReactNode;
  /** See {@link UnsavedChangesGuardContextValue.release}. */
  release: () => void;
  /** See {@link UnsavedChangesGuardContextValue.attemptNavigation}. */
  attemptNavigation: (proceed: () => void) => void;
}

/**
 * Blocks in-app navigation away from an edit view with unsaved work
 * (decisions 1–4, A): in-app links, router pushes and back/forward show the
 * styled `UnsavedChangesDialog` (Stay / Leave); closing the tab or a hard
 * reload shows the browser's own native prompt, which cannot carry custom
 * UI, via `beforeunload`.
 *
 * "Dirty" (decision 4, B): when `props.autosaveEnabled` is `false`,
 * blocking follows `props.isDirty` alone (the edit view's
 * `!form.state.isDefaultValue`). When `true`, blocking follows ONLY
 * `props.hasUnsavedChanges` — regardless of `props.isDirty` — since every
 * other edit on an autosaved document is already persisted, and `status`
 * alone under-reports: `useAutosave().hasUnsavedChanges` stays `true`
 * through the debounce window, where `status` is still `"idle"`/`"saved"`.
 *
 * @param props - Hook props.
 * @param props.isDirty - `!form.state.isDefaultValue` from the edit view's
 *   own `form.Subscribe`/`useStore`.
 * @param props.hasUnsavedChanges - The edit view's
 *   `useAutosave().hasUnsavedChanges`. Ignored when `props.autosaveEnabled`
 *   is `false`.
 * @param props.autosaveEnabled - Whether THIS document has autosave on —
 *   the SAME expression the edit view passes to `useAutosave({ enabled })`
 *   (`isVersioned && collection.versions.autosave.enabled && canEdit`).
 * @returns {@link UseUnsavedChangesGuardResult}.
 */
export function useUnsavedChangesGuard(props: {
  isDirty: boolean;
  hasUnsavedChanges?: boolean;
  autosaveEnabled: boolean;
}): UseUnsavedChangesGuardResult {
  const { navigationBlocker } = useFrameworkComponents();

  const blocking = props.autosaveEnabled ? !!props.hasUnsavedChanges : props.isDirty;

  const [released, setReleased] = useState(false);
  // Mirrors `released` synchronously: `release()` is followed by a
  // `navigate()` in the same tick, before React re-renders with the new state.
  const releasedRef = useRef(false);
  // Re-arm synchronously during render once blocking clears, so a LATER
  // dirty/unsaved-change state is guarded again.
  if (!blocking && released) {
    releasedRef.current = false;
    setReleased(false);
  }
  const when = blocking && !released;

  const proceedRef = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);

  /**
   * The one function behind both `navigationBlocker`'s interception and
   * `useVexNavigate`'s guard consultation (spec decision 2).
   *
   * @param proceed - Continues the blocked navigation.
   */
  function attemptNavigation(proceed: () => void): void {
    if (!when || releasedRef.current) {
      proceed();
      return;
    }
    proceedRef.current = proceed;
    setOpen(true);
  }

  // Rules of Hooks: called unconditionally even when `navigationBlocker` is
  // `undefined` — the adapter being absent just means in-app navigation is
  // never intercepted (`useVexNavigate` and `beforeunload` still fire).
  navigationBlocker?.useBlocker({ when, onBlock: attemptNavigation });

  useEffect(() => {
    if (!when) return;
    function handler(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);

  /**
   * Synchronously bypasses the guard for ONE upcoming navigation: the ref lets a
   * `navigate()` in the same tick through, the state drops `when` on the next
   * render, and any already-open dialog closes so a stale Leave click never
   * resolves a `proceed` from before the release.
   */
  function release(): void {
    releasedRef.current = true;
    setReleased(true);
    proceedRef.current = null;
    setOpen(false);
  }

  const dialog = createElement(UnsavedChangesDialog, {
    open,
    onOpenChange: (next: boolean) => {
      if (!next) {
        proceedRef.current = null;
        setOpen(false);
      }
    },
    onLeave: () => {
      const proceed = proceedRef.current;
      proceedRef.current = null;
      setOpen(false);
      proceed?.();
    },
  });

  return { dialog, release, attemptNavigation };
}
