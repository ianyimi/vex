"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The S5 document-context shape every edit-view slot contribution reads via
 * `useVexDocument()`. Deliberately excludes live, per-keystroke form values —
 * those come from `useVexForm` so a contribution that only needs `isDirty` or
 * `canEdit` doesn't re-render on every field change.
 */
export type VexDocumentState = {
  /** Whether the document belongs to a collection or a global. */
  kind: "collection" | "global";
  /** The collection or global slug. */
  slug: string;
  /** The document id. Absent on a collection's "create new" route. */
  id?: string;
  /**
   * The last-saved document, as returned by the server. `undefined` before
   * the initial load resolves (or on a collection's "create new" route).
   */
  saved: Record<string, unknown> | undefined;
  /** Whether the mounted form currently differs from `saved`. */
  isDirty: boolean;
  /**
   * The document's publish status, for a versioned collection or global.
   * Mirrors core's `VERSION_STATUSES` keys (`packages/core/src/versions/constants.ts`).
   * Absent when the collection/global isn't versioned.
   */
  status?: "draft" | "published";
  /** Whether the current user can edit this document (`useVexPermissions().hasPermission`). */
  canEdit: boolean;
};

/**
 * Holds the current edit view's document state for the subtree it wraps —
 * the single provenance `useVexDocument()` reads from. Default value is
 * `null`, so a consumer rendered outside any provider gets a clear thrown
 * error instead of a silently stale document.
 */
export const VexDocumentContext = createContext<VexDocumentState | null>(null);

/**
 * Mounts `VexDocumentContext` for the subtree it wraps. `CollectionEditView`
 * and `GlobalEditView` (step 4) are the only callers — each recomputes
 * `VexDocumentState` from its own loaded document, form and permission state
 * and wraps its seven `SlotOutlet`s with this provider.
 *
 * @param props - The resolved document state to provide, and the subtree that consumes it.
 * @returns The context provider wrapping `props.children`.
 */
export function VexDocumentProvider(props: {
  value: VexDocumentState;
  children: ReactNode;
}) {
  return (
    <VexDocumentContext.Provider value={props.value}>
      {props.children}
    </VexDocumentContext.Provider>
  );
}

/**
 * S5 context hook — exposes the current edit view's document state to a
 * built-in or third-party `edit.*` slot contribution. Backed by
 * `VexDocumentContext`, mounted by `CollectionEditView`/`GlobalEditView`.
 *
 * Experimental: breaking changes are still possible before this stabilizes.
 * @returns The current `VexDocumentState`.
 * @throws When rendered outside a `VexDocumentProvider`.
 */
export function useVexDocument(): VexDocumentState {
  const value = useContext(VexDocumentContext);
  if (value === null) {
    throw new Error("useVexDocument() must be used within a VexDocumentProvider.");
  }
  return value;
}
