"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ViewedVersion } from "../versions";

/**
 * View-local UI state `useVexDocument` deliberately excludes (S5, decision 18): which history
 * version is being previewed, how to re-point the view at a new row id after a mutation returns
 * one, how to settle the form once a save round-trips, and the live-preview panel's open state.
 * One instance per mounted edit view — `CollectionEditForm`/`GlobalEditView` own the real state
 * and pass it down as `value`; built-ins only ever read it.
 */
export interface DocumentEditRuntimeState {
  /** The history version currently shown in the form, or `null` for the live document. */
  viewedVersion: ViewedVersion | null;
  /** Shows a version's snapshot in the form, or `null` to return to the live document. Never saves. */
  onViewVersion: (view: ViewedVersion | null) => void;
  /**
   * Re-points the view at a different row id — called after `saveDraft`/`publish` returns one
   * (the first draft save on a published document bootstraps a new row). Omitted for a global,
   * which has no separate row id to re-point.
   */
  onDocumentIdChange?: (id: string) => void;
  /** Defers the form's post-save reset until the live row reflects the write — see `useResetWhenSaved`. */
  onSaved: (changes: Record<string, unknown>) => void;
  /** Live-preview panel state for this resource, or `undefined` when no `livePreview` config resolves. */
  livePreview?: {
    isOpen: boolean;
    toggle: () => void;
    isSplit: boolean;
  };
}

/** Context carrying {@link DocumentEditRuntimeState}; `undefined` outside an edit view. */
export const DocumentEditRuntimeContext = createContext<DocumentEditRuntimeState | undefined>(
  undefined,
);

/**
 * Provides {@link DocumentEditRuntimeState} to every built-in and third-party contribution rendered
 * beneath one edit view.
 *
 * @param props.value - The edit view's own runtime state.
 * @param props.children - The edit view's slotted header/fields/sidebar tree.
 * @returns `children` wrapped in the runtime context provider.
 */
export function DocumentEditRuntimeProvider(props: {
  value: DocumentEditRuntimeState;
  children: ReactNode;
}) {
  return (
    <DocumentEditRuntimeContext.Provider value={props.value}>
      {props.children}
    </DocumentEditRuntimeContext.Provider>
  );
}

/**
 * Reads the nearest {@link DocumentEditRuntimeState}.
 *
 * @returns The current edit view's runtime state.
 * @throws {Error} Outside a `DocumentEditRuntimeProvider`.
 */
export function useDocumentEditRuntime(): DocumentEditRuntimeState {
  const value = useContext(DocumentEditRuntimeContext);
  if (!value) {
    throw new Error("useDocumentEditRuntime must be used within a DocumentEditRuntimeProvider");
  }
  return value;
}
