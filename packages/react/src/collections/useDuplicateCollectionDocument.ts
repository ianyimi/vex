"use client";

import {
  cloneDocumentForDuplicate,
  VERSION_STATUSES,
  vexConvexApi,
  type CollectionConfig,
} from "@vexcms/core";
import { adminHref } from "../admin/adminHref";
import { useVexConfig } from "../config/VexConfigContext";
import { useVexMutation } from "../hooks";
import { useVexNavigate } from "../config/useVexNavigate";
import { useReleaseUnsavedChangesGuard } from "../documents/useUnsavedChangesGuard";

/** Props for {@link useDuplicateCollectionDocument}. */
export interface UseDuplicateCollectionDocumentProps {
  /** The collection `document` belongs to — supplies `fields` for the clone and `versions.drafts` for the forced-draft call. */
  collection: CollectionConfig;
  /**
   * The currently-loaded document to duplicate, or `undefined` before it has loaded —
   * `duplicate()` is a no-op until then. Typed as `useVexDocument().saved`'s own shape (not
   * `VexDocument`) — the caller reads this straight off `useVexDocument()`, which only knows a
   * plain field-keyed record, not the full server row.
   */
  document: Record<string, unknown> | undefined;
  /**
   * Called with the clone when the first create attempt is rejected (most commonly a
   * unique-field conflict). A callback, not hook-owned state (decision: Step 4
   * post-implementation note's `CollectionMoreActionsMenu` dialog, moved to
   * `CollectionDuplicateMenuItem`'s own `useEditActionsMenuDialog().open(...)` call) — the create
   * rejects asynchronously, after `CollectionDuplicateMenuItem` has already unmounted (base-ui
   * tears down `DropdownMenuContent` and every item in it on select), so this hook's own state
   * would vanish with it. The caller owns where the fallback renders.
   */
  onConflict: (clone: Record<string, unknown>) => void;
}

/** Return value of {@link useDuplicateCollectionDocument}. */
export interface UseDuplicateCollectionDocumentResult {
  /** Starts a duplicate attempt. Never throws — a rejection calls `onConflict` instead. */
  duplicate: () => void;
  /** Whether the first (clone-and-create) attempt is in flight. */
  isPending: boolean;
}

/**
 * Drives decision 6/7/9's two-step duplicate flow: clone the loaded document, try a server
 * `create` with it, and navigate to the new document on success. On a rejected create, calls
 * `props.onConflict` with the same clone instead of surfacing a toast —
 * `CollectionDuplicateMenuItem` opens the all-fields fallback dialog from there, prefilled with
 * the clone (`CreateDocumentForm` with `fieldsMode: "all"`, `initialValues: clone`,
 * `submitOnOpen: true`), so the SAME failing create re-runs there and `AppForm`'s
 * `focusFirstFieldError` lands the user on the exact input.
 *
 * @param props - The collection and document being duplicated, plus `onConflict`.
 * @returns `{ duplicate, isPending }` — see {@link UseDuplicateCollectionDocumentResult}.
 * @throws Never — `duplicate()` itself never throws; a create rejection is routed to
 *   `props.onConflict`, not re-thrown.
 */
export function useDuplicateCollectionDocument(
  props: UseDuplicateCollectionDocumentProps,
): UseDuplicateCollectionDocumentResult {
  const config = useVexConfig();
  const navigate = useVexNavigate();
  const release = useReleaseUnsavedChangesGuard();
  const { mutateAsync, isPending } = useVexMutation({
    collection: props.collection.slug,
    mutationFn: vexConvexApi.create,
    operation: "create",
    getChanges: ({ args, result }) => [{ after: { ...args.data, _id: result } }],
    // `false`, not omitted: omitting `errorToast` falls back to a generic "Request
    // failed" toast (`useVexMutation`'s own default) — a rejection here opens the
    // fallback dialog instead, which has its own `CreateDocumentForm`/`errorToast`.
    errorToast: false,
  });

  function duplicate(): void {
    if (!props.document) return;
    const clone = cloneDocumentForDuplicate({
      fields: props.collection.fields,
      document: props.document,
    });
    const isVersioned = props.collection.versions.drafts;
    void mutateAsync({
      collection: props.collection.slug,
      data: clone,
      ...(isVersioned ? { status: VERSION_STATUSES.draft.key } : {}),
    })
      .then((id) => {
        release();
        navigate(adminHref({ type: "document", slug: props.collection.slug, id }, config.basePath));
      })
      .catch(() => {
        props.onConflict(clone);
      });
  }

  return { duplicate, isPending };
}
