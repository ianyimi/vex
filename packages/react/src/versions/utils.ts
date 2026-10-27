import type { TDocument } from "@vexcms/core";
import { VERSION_STATUSES } from "@vexcms/core";

/**
 * Collapses published/draft row pairs — and stands a draft-only row alone —
 * into one row per logical document, for admin list views on versioned
 * collections (design-review.md §3.3).
 *
 * A versioned collection's `find` query, called with `drafts: true`
 * (Step 13), can return up to two rows per logical document: the published
 * row and, when an edit is in progress, its draft row pointing back at it
 * via `vex_publishedId`. A document created with
 * `collection.versions.defaultStatus: "draft"` (Step 9) and never published
 * has only ONE row for the same document — a draft with no
 * `vex_publishedId` at all, since there is nothing published yet for it to
 * point at.
 *
 * The suppression rule driving the grouping below: a draft row is folded
 * into (hidden behind) another row ONLY when its `vex_publishedId` resolves
 * to a row ALSO present in `documents` — i.e. it is some OTHER row's
 * counterpart, and that other row already represents the document in the
 * collapsed list. A draft-only row's `vex_publishedId` is `undefined`, so
 * it never resolves to anything else in the batch and is therefore never
 * suppressed — it groups under its own `_id` and stands alone as its own
 * row. One rule answers both halves of the admin list's contract: an
 * in-progress edit on a published document renders as ONE row (not two),
 * and a document that has never been published also renders as ONE row
 * (not zero) — neither case needs special-casing beyond this shared
 * grouping key.
 *
 * Admin-only — the public read path filters to published rows and never
 * sees a draft row at all, paired or standalone (decision 7 / Step 13).
 *
 * @typeParam TData - The document shape; preserved on the returned rows.
 * @param props - Input props.
 * @param props.documents - Raw `find` results for ONE versioned collection,
 *   fetched with `drafts: true` so both rows of an in-progress pair, and any
 *   draft-only row, are present.
 * @returns One row per logical document — the draft's fields when a draft
 *   exists (paired or standalone), otherwise the published row's — each
 *   carrying `hasUnpublishedChanges`: `true` only for a genuine
 *   published+draft pair, `false` for a standalone published row OR a
 *   draft-only row. Combined with the returned row's own `vex_status`
 *   (`"draft"` whenever a draft exists, paired or not), a caller derives
 *   the row's full display state without a third flag:
 *   `vex_status !== "draft"` → published, no pending edits;
 *   `vex_status === "draft" && hasUnpublishedChanges` → published, with a
 *   pending draft; `vex_status === "draft" && !hasUnpublishedChanges` →
 *   never published, draft only (`CollectionListView`'s Status column
 *   renders exactly this three-way split).
 */
export function collapseVersionedPairs<TData extends TDocument = TDocument>(props: {
  documents: TData[];
}): (TData & { hasUnpublishedChanges: boolean })[] {
  const groups = new Map<string, { published?: TData; draft?: TData }>();

  for (const doc of props.documents) {
    const publishedId = doc.vex_publishedId as string | undefined;
    const key = publishedId ?? String(doc._id);
    const group = groups.get(key) ?? {};
    if (doc.vex_status === VERSION_STATUSES.draft.key) {
      group.draft = doc;
    } else {
      group.published = doc;
    }
    groups.set(key, group);
  }

  const result: (TData & { hasUnpublishedChanges: boolean })[] = [];
  for (const group of groups.values()) {
    result.push({
      ...(group.draft ?? group.published)!,
      hasUnpublishedChanges: group.draft !== undefined && group.published !== undefined,
    });
  }
  return result;
}
