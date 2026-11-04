import type { GenericDataModel, GenericDocument, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import type { VexAccessConfig } from "../../access";
import { readableDocuments } from "../../db/documents";
import type { VexApiAuth } from "../../db/types";
import type { AdminField } from "../../fields";
import { VERSION_SYSTEM_FIELDS } from "../../versions";

/**
 * Attaches each published row's linked draft counterpart back onto it, for
 * a `find`/`search` page already narrowed to "canonical" rows by
 * `canonicalRowFilter` (`versions/statusQueryConstraint.ts`) — a published
 * row, or a draft-only row with no `vex_publishedId`. One row per logical
 * document in, one row per logical document out: a draft-only row passes
 * through untouched (`hasUnpublishedChanges: false`, nothing to merge); a
 * published row with a linked draft is replaced by that DRAFT row's own
 * fields (including the draft's own `_id` — matching the published row's
 * `_id` instead would point `useVexDocQuery`/the edit view at the stale
 * published content rather than the pending edit, exactly like the FORMER
 * client-side `collapseVersionedPairs({ documents })`'s own `group.draft ??
 * group.published` choice used to — that function is gone (unused once this
 * server-side merge replaced it; removed 2026-11-xx, this IS the
 * replacement), with `hasUnpublishedChanges: true`; a published row with no
 * linked draft, or whose draft is itself denied, passes through unchanged.
 *
 * The draft lookup is a single indexed `.unique()` read per row in `docs`,
 * keyed by that row's own `_id` (always present/readable —
 * never by reading `vex_status` off `doc`, which may already be stripped
 * for a caller who can't read it) against `by_published`, bounded by the
 * page size, never by collection size. A draft-only row's `_id` was never
 * published, so nothing's `vex_publishedId` ever points at it — the
 * lookup naturally returns nothing for it, with no separate "is this a
 * published row" branch needed. The two-row model's own invariant (at
 * most one draft per published row, see `versions/model.ts`'s
 * `findDraftRow` doc comment) keeps this a single `.unique()` read. The
 * found draft row is run back through the SAME `readableDocuments`
 * field/row-level check the caller already ran on `docs` — a denied draft
 * counterpart is treated exactly like one that doesn't exist (the
 * published row stands alone), never leaked unchecked.
 *
 * Callers gate this entirely on whether the read is draft-aware and the
 * collection is versioned (`collection.versions.drafts`) — an ordinary
 * read never calls this and pays nothing extra.
 *
 * @param props - Input props.
 * @param props.ctx - The query/mutation ctx used for the draft lookup.
 * @param props.collection - The table name (collection slug) `docs` came from.
 * @param props.docs - Canonical rows already fetched + readable-filtered.
 * @param props.access - From `resolveReadCall`/`resolveAccessCall`, forwarded
 *   unchanged into the draft counterpart's own `readableDocuments` check.
 * @param props.auth - The caller.
 * @param props.action - The read action already resolved for `docs`
 *   (`readDrafts` or `read`) — the draft counterpart is checked under the
 *   SAME action, matching the raw two-row model's single uniform check.
 * @param props.fields - The collection's resolved field map, forwarded into
 *   the draft counterpart's own `readableDocuments` check so a `commitTs`
 *   field on the merged-in DRAFT row is also converted `bigint` → ms
 *   `number` — this read bypasses the caller's own
 *   `readableDocuments` pass entirely (a fresh `ctx.db.query` read), so it
 *   must carry its own `fields` rather than inherit the caller's.
 * @returns `docs`, each carrying `hasUnpublishedChanges`.
 */
export async function mergeDraftCounterparts<
  DataModel extends GenericDataModel,
  TDoc extends GenericDocument = GenericDocument,
>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: string;
  docs: readonly TDoc[];
  access: VexAccessConfig | undefined;
  auth: VexApiAuth | undefined;
  resource: string;
  action: string;
  fields?: Record<string, AdminField>;
}): Promise<(TDoc & { hasUnpublishedChanges: boolean })[]> {
  const merged: (TDoc & { hasUnpublishedChanges: boolean })[] = [];
  for (const doc of props.docs) {
    const raw = doc as unknown as Record<string, unknown>;
    // Looked up unconditionally by `_id` (always present/readable —
    // never gated on `vex_status`, which may already be
    // stripped off `doc` by the time it reaches here for a caller who
    // can't read that field). A draft-only row's `_id` never has anything
    // pointing at it via `by_published` (it was never published), so this
    // naturally falls through to the `draftRow === null` branch below for
    // it — no separate "is this a published row" branch needed.
    const draftRow = await props.ctx.db
      .query(props.collection)
      // @ts-expect-error querying a generic DataModel's table by a runtime-resolved index/field name
      .withIndex("by_published", (q) => q.eq(VERSION_SYSTEM_FIELDS.publishedId.slug, raw._id))
      .unique();
    if (draftRow === null) {
      merged.push({ ...doc, hasUnpublishedChanges: false });
      continue;
    }
    const [readableDraft] = readableDocuments({
      docs: [draftRow as unknown as TDoc],
      access: props.access,
      auth: props.auth,
      resource: props.resource,
      action: props.action,
      whereFields: [],
      fields: props.fields,
    });
    merged.push(
      readableDraft !== undefined
        ? { ...readableDraft, hasUnpublishedChanges: true }
        : { ...doc, hasUnpublishedChanges: false },
    );
  }
  return merged;
}
