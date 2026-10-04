import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx, TableNamesInDataModel } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../types/generated";
import { VERSION_STATUSES } from "./constants";
import { findDraftRow } from "./model";
import { removeVexFields } from "./removeVexFields";

/**
 * The one place `saveDraft`'s shared implementation (`versions/saveDraft.ts`)
 * learns how a versioned collection's table differs from `vex_globals`'s
 * single shared table — every other step of the save-a-draft pipeline
 * (bootstrap/patch the draft row, snapshot the published state, record
 * history) is identical code for either kind, driven entirely through this
 * descriptor.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface VersionedTargetRows<DataModel extends GenericDataModel> {
  /** The table the published/draft rows live in. */
  table: TableNamesInDataModel<DataModel>;
  /** The `collection` value `createVersion`/`getLatestVersion` group history rows under. */
  historyCollection: CollectionSlug;
  /**
   * The id `vex_versions` history rows are keyed on — the published row's
   * `_id` for a collection (or the draft-only row's `_id` when the document
   * has never been published), or the global's `slug`. Resolved once, up
   * front, so it never shifts across a bootstrap this call might perform.
   */
  documentId: string;
  /** The currently-stored published row (`vex_status !== "draft"`), if any. */
  publishedRow: Record<string, unknown> | null;
  /** The currently-stored draft row (`vex_status === "draft"`), if any. */
  draftRow: Record<string, unknown> | null;
  /** Extracts the clean user-field document from a stored row — `storedDoc`/snapshot shape. */
  toUserFields: (row: Record<string, unknown>) => Record<string, unknown>;
  /** Builds the DB payload to insert a new draft row. */
  buildDraftInsert: (
    userFields: Record<string, unknown>,
    publishedId?: string,
  ) => Record<string, unknown>;
  /** Builds the DB payload to patch `patch` onto an existing draft `row`. */
  buildDraftPatch: (
    row: Record<string, unknown>,
    patch: Record<string, unknown>,
  ) => Record<string, unknown>;
}

/**
 * Resolves which rows a `saveDraft` call is really targeting, for either a
 * versioned collection document (identified by `id`, the published row's id
 * on every edit after the first, or a draft row's own id) or a versioned
 * global (identified by `slug` — `vex_globals` holds every global's rows in
 * one table, distinguished by `slug` + `vex_status`, exactly like a
 * collection's own table distinguishes its published/draft rows via
 * `vex_status`/`vex_publishedId`).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Either `{ ctx, collection, id }` or `{ ctx, global }`.
 * @returns A {@link VersionedTargetRows} descriptor for `versions/saveDraft.ts`.
 * @throws {ConvexError} When `id` does not resolve to a document in `collection`.
 */
export async function resolveVersionedTarget<DataModel extends GenericDataModel>(
  props: { ctx: GenericMutationCtx<DataModel> } & (
    | { collection: CollectionSlug; id: GenericId<CollectionSlug> }
    | { global: GlobalSlug }
  ),
): Promise<VersionedTargetRows<DataModel>> {
  if ("collection" in props) {
    const table = props.collection as TableNamesInDataModel<DataModel>;
    const targetRow = (await props.ctx.db.get(props.collection, props.id)) as Record<
      string,
      unknown
    > | null;
    if (targetRow === null) {
      throw new ConvexError(
        `No document found for id "${props.id}" in collection "${props.collection}"`,
      );
    }

    let draftRow: Record<string, unknown> | null = null;
    let publishedRow: Record<string, unknown> | null = null;
    if (targetRow.vex_status === VERSION_STATUSES.draft.key) {
      draftRow = targetRow;
      const publishedId = targetRow.vex_publishedId as GenericId<CollectionSlug> | undefined;
      publishedRow =
        publishedId === undefined
          ? null
          : ((await props.ctx.db.get(props.collection, publishedId)) as Record<
              string,
              unknown
            > | null);
    } else {
      publishedRow = targetRow;
      draftRow = (await findDraftRow({
        ctx: props.ctx,
        collection: props.collection,
        publishedId: targetRow._id as GenericId<CollectionSlug>,
      })) as Record<string, unknown> | null;
    }

    const documentId = String(
      (publishedRow?._id as string | undefined) ?? (draftRow?._id as string),
    );

    return {
      table,
      historyCollection: props.collection,
      documentId,
      publishedRow,
      draftRow,
      toUserFields: (row) => removeVexFields({ doc: row }),
      buildDraftInsert: (userFields, publishedId) => ({
        ...userFields,
        vex_status: VERSION_STATUSES.draft.key,
        ...(publishedId !== undefined ? { vex_publishedId: publishedId } : {}),
      }),
      buildDraftPatch: (_row, patch) => patch,
    };
  }

  const table = "vex_globals" as TableNamesInDataModel<DataModel>;
  const rows = (await props.ctx.db
    .query("vex_globals")
    .withIndex("by_slug", (q) => q.eq("slug", props.global as never))
    .collect()) as Record<string, unknown>[];
  const publishedRow = rows.find((r) => r.vex_status !== VERSION_STATUSES.draft.key) ?? null;
  const draftRow = rows.find((r) => r.vex_status === VERSION_STATUSES.draft.key) ?? null;

  return {
    table,
    historyCollection: "vex_globals" as CollectionSlug,
    documentId: props.global,
    publishedRow,
    draftRow,
    toUserFields: (row) => (row.data as Record<string, unknown> | undefined) ?? {},
    buildDraftInsert: (userFields, publishedId) => ({
      slug: props.global,
      data: userFields,
      vex_status: VERSION_STATUSES.draft.key,
      ...(publishedId !== undefined ? { vex_publishedId: publishedId } : {}),
    }),
    buildDraftPatch: (row, patch) => ({
      data: { ...((row.data as Record<string, unknown> | undefined) ?? {}), ...patch },
    }),
  };
}
