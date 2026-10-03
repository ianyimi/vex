import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { GlobalSlug, CollectionSlug } from "../../types/generated";
import { CRUD_ACTIONS, DRAFT_ACTIONS } from "../../access";
import { GenericGlobalsMutationServerArgs } from "./types";
import { prepareEdit } from "../prepareEdit";
import { createVersion } from "../../versions/model";
import { VERSION_STATUSES } from "../../versions";

/** System keys stripped from flat input before writing to DB. */
const STRIPPED_KEYS = new Set(["_id", "_creationTime", "_slug"]);

/**
 * Server-side args for `updateGlobal`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 */
export interface UpsertGlobalServerArgs<
  DataModel extends GenericDataModel,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
> extends GenericGlobalsMutationServerArgs<DataModel, TGlobalSlug> {
  /** The global slug to upsert. Must match a registered global in config. */
  slug: TGlobalSlug;
  /**
   * User field data. May be the full flat document (system keys `_id`,
   * `_creationTime`, `_slug` are stripped server-side) or just the field
   * values. The `GlobalEditView` component sends the flat form values here.
   */
  data: Record<string, unknown>;
}

/**
 * Upserts a global document in `vex_globals`.
 *
 * **Non-versioned global** (`versions.drafts` is `false`, the default):
 * unchanged from before this spec — strips system keys from `data`, merges
 * onto the stored document, validates against the global's Zod schema, and
 * patches only the changed fields (inserts on first save).
 *
 * **Versioned global** (`versions.drafts` is `true`): the two-row draft model
 * (design-review §1, §9) applies with `vex_globals` as the shared table — a
 * published row and, while a draft is active, a draft row, BOTH carrying the
 * same `slug`, distinguished by `vex_status`/`vex_publishedId` exactly as a
 * versioned collection's own table distinguishes them. Every write is a
 * draft save: it authorizes `saveDraft` with `changes: <incoming payload>`
 * (never the stored row — the correction this whole re-scope makes) and
 * records history via `createVersion({ collection: "vex_globals",
 * documentId: slug, ... })`. Unlike a collection's flat row, a global's
 * `data: v.any()` blob never carries `_id`/`vex_*` columns, so there is
 * nothing for `extractUserFields` to strip before a snapshot — `data`
 * itself (or the Zod-validated merge of it) IS the clean snapshot.
 *
 * Throws `ConvexError` on Zod validation failure with a structured `errors`
 * payload. Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 * @param props - `{ ctx, slug, data, config }`.
 * @returns The `_id` of the written `vex_globals` row, as a string — for a
 *   versioned global, the draft row's.
 *
 * @example
 * ```ts
 * import { upsertGlobal } from "@vexcms/core/server";
 *
 * const draftId = await upsertGlobal({
 *   ctx,
 *   slug: "siteSettings",
 *   data: { siteName: "New Name" },
 *   config,
 * });
 * ```
 */
export async function upsertGlobal<
  DataModel extends GenericDataModel,
  TSlug extends GlobalSlug = GlobalSlug,
>(props: UpsertGlobalServerArgs<DataModel, TSlug>): Promise<string> {
  const globalConfig = props.config.globals.find((g) => g.slug === props.slug);
  if (!globalConfig) {
    throw new ConvexError(`No global registered with slug "${props.slug}"`);
  }

  const userFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props.data)) {
    if (!STRIPPED_KEYS.has(k)) userFields[k] = v;
  }

  const rows = await props.ctx.db
    .query("vex_globals")
    .withIndex("by_slug", (q) => q.eq("slug", props.slug as never))
    .collect();
  const toStored = (row: Record<string, unknown>) => ({
    _id: row._id,
    _creationTime: row._creationTime,
    ...(row.data as Record<string, unknown>),
  });

  if (!globalConfig.versions.drafts) {
    const row = rows[0];
    const { patch } = await prepareEdit({
      ctx: props.ctx,
      config: props.config,
      target: { kind: "global", config: globalConfig },
      action: row ? CRUD_ACTIONS.update : CRUD_ACTIONS.create,
      access: props.access,
      auth: props.auth,
      storedDoc: row ? (toStored(row) as never) : undefined,
      incoming: userFields,
      partial: false,
      validateKeys: "changed",
    });
    if (row) {
      await props.ctx.db.patch(
        row._id as never,
        {
          data: { ...(row.data as Record<string, unknown>), ...patch },
        } as never,
      );
      return row._id as string;
    }
    const id = await props.ctx.db.insert("vex_globals", { slug: props.slug, data: patch } as never);
    return id as string;
  }

  const publishedRow = rows.find((r) => r.vex_status !== VERSION_STATUSES.draft.key);
  const draftRow = rows.find((r) => r.vex_status === VERSION_STATUSES.draft.key);
  const targetRow = draftRow ?? publishedRow;

  const { patch } = await prepareEdit({
    ctx: props.ctx,
    config: props.config,
    target: { kind: "global", config: globalConfig },
    action: DRAFT_ACTIONS.saveDraft,
    access: props.access,
    auth: props.auth,
    storedDoc: targetRow ? (toStored(targetRow) as never) : undefined,
    incoming: userFields,
    partial: true,
    validateKeys: "changed",
  });

  const nextData = { ...((targetRow?.data as Record<string, unknown>) ?? {}), ...patch };

  if (!targetRow) {
    const id = await props.ctx.db.insert("vex_globals", {
      slug: props.slug,
      data: nextData,
      vex_status: VERSION_STATUSES.draft.key,
    } as never);
    await createVersion({
      ctx: props.ctx,
      collection: "vex_globals" as CollectionSlug,
      documentId: props.slug,
      status: VERSION_STATUSES.draft.key,
      snapshot: nextData,
    });
    return id as string;
  }

  let draftId: string;
  if (draftRow) {
    await props.ctx.db.patch(draftRow._id as never, { data: nextData } as never);
    draftId = draftRow._id as string;
  } else {
    // `publishedRow` exists with no draft yet — snapshot the published state
    // BEFORE bootstrapping the draft row, so the pre-edit value is recoverable.
    await createVersion({
      ctx: props.ctx,
      collection: "vex_globals" as CollectionSlug,
      documentId: props.slug,
      status: "published",
      snapshot: publishedRow!.data as Record<string, unknown>,
      publishedAt: publishedRow!.vex_publishedAt as number | undefined,
    });
    draftId = (await props.ctx.db.insert("vex_globals", {
      slug: props.slug,
      data: nextData,
      vex_status: "draft",
      vex_publishedId: publishedRow!._id,
    } as never)) as string;
  }

  await createVersion({
    ctx: props.ctx,
    collection: "vex_globals" as CollectionSlug,
    documentId: props.slug,
    status: "draft",
    snapshot: nextData,
  });

  return draftId;
}
