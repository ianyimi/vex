"use client";

import {
  cloneDocumentForDuplicate,
  resolveDuplicateTitle,
  VERSION_STATUSES,
  type CollectionConfig,
  type VexVersionStatus,
} from "@vexcms/core";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";
import { useVexNavigate } from "../../config/useVexNavigate";
import { useReleaseUnsavedChangesGuard } from "../../documents/useUnsavedChangesGuard";

/** Props for {@link useDuplicateCollectionDocument}. */
export interface UseDuplicateCollectionDocumentProps {
  /**
   * The collection `document` belongs to — supplies `fields`/`admin.useAsTitle` for the clone
   * and `versions.drafts` for the forced-draft create. `undefined` before `config.collections`
   * resolves `props.slug` (the caller's own `collection!` would otherwise have to dereference
   * it before its own not-found guard) — `clone`/`forceStatus` stay `undefined` until then.
   */
  collection: CollectionConfig | undefined;
  /**
   * The currently-loaded document to duplicate, or `undefined` before it has loaded — `clone`
   * is `undefined` until then. Typed as `useVexDocument().saved`'s own shape (not `VexDocument`)
   * — the caller reads this straight off `useVexDocument()`, which only knows a plain
   * field-keyed record, not the full server row.
   */
  document: Record<string, unknown> | undefined;
}

/** Return value of {@link useDuplicateCollectionDocument}. */
export interface UseDuplicateCollectionDocumentResult {
  /**
   * The duplicate's prefill — `props.document` cloned via `cloneDocumentForDuplicate`, its title
   * renamed. `undefined` until `props.document` has loaded. Pass as `ListViewCreateDocumentForm`'s
   * `initialValues`.
   */
  clone: Record<string, unknown> | undefined;
  /**
   * The duplicate dialog's "copied from" note — names the source document's current title when
   * `collection.admin.useAsTitle` resolves to one, else a generic fallback.
   */
  note: string;
  /**
   * Forces a draft on a versioned collection — a duplicate is unreviewed new content regardless
   * of `collection.versions.defaultStatus`. `undefined` for a non-versioned collection. Pass as
   * `ListViewCreateDocumentForm`'s `forceStatus`.
   */
  forceStatus: VexVersionStatus | undefined;
  /**
   * Releases the unsaved-changes guard and navigates to the new document. Pass as
   * `ListViewCreateDocumentForm`'s `onCreated`.
   */
  onCreated: (id: string) => void;
}

/**
 * Drives the duplicate dialog's prefill and post-create navigation. The dialog always opens
 * (decision: developer feedback — no more eager create-then-fallback-on-conflict): this hook
 * clones the loaded document (title renamed via `resolveDuplicateTitle`/`cloneDocumentForDuplicate`)
 * for `ListViewCreateDocumentForm`'s `initialValues`, and releases the unsaved-changes guard plus
 * navigates once the user reviews/edits the required fields and submits. The create itself — and
 * any unique-field conflict — is the form's own concern; this hook never calls `create` directly.
 *
 * @param props - The collection and document being duplicated.
 * @returns `{ clone, note, forceStatus, onCreated }` — see {@link UseDuplicateCollectionDocumentResult}.
 */
export function useDuplicateCollectionDocument(
  props: UseDuplicateCollectionDocumentProps,
): UseDuplicateCollectionDocumentResult {
  const config = useVexConfig();
  const navigate = useVexNavigate();
  const release = useReleaseUnsavedChangesGuard();

  const useAsTitle = props.collection?.admin.useAsTitle;
  const clone =
    props.collection && props.document
      ? cloneDocumentForDuplicate({ fields: props.collection.fields, document: props.document, useAsTitle })
      : undefined;
  const sourceTitle = props.document
    ? resolveDuplicateTitle({ useAsTitle, document: props.document })
    : undefined;
  const note = sourceTitle
    ? `All other fields are copied from ${sourceTitle}.`
    : "All other fields are copied from the duplicated document.";

  function onCreated(id: string): void {
    if (!props.collection) return;
    release();
    navigate(adminHref({ type: "document", slug: props.collection.slug, id }, config.basePath));
  }

  return {
    clone,
    note,
    forceStatus: props.collection?.versions.drafts ? VERSION_STATUSES.draft.key : undefined,
    onCreated,
  };
}
