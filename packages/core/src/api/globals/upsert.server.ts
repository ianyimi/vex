import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { GlobalSlug, CollectionSlug } from "../../types/generated";
import { CRUD_ACTIONS } from "../../access";
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
 * **Versioned global** (`versions.drafts` is `true`): writes the PUBLISHED
 * row directly — the slug's row whose `vex_status !== "draft"` — exactly as
 * `update()` writes a versioned collection's published row. Inserts it with
 * `vex_status: "published"` and `vex_publishedAt: Date.now()` when no
 * published row exists yet; records a `"published"`-status history row via
 * `createVersion({ collection: "vex_globals", documentId: slug, ... })`.
 * NEVER touches a global's draft row — `saveDraft`
 * (`api/versions/saveDraft.server.ts`) is the only path that writes it.
 *
 * Throws `ConvexError` on Zod validation failure with a structured `errors`
 * payload. Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 * @param props - `{ ctx, slug, data, config }`.
 * @returns The `_id` of the written `vex_globals` row, as a string — the
 *   published row's, for both a versioned and non-versioned global.
 *
 * @example
 * ```ts
 * import { upsertGlobal } from "@vexcms/core/server";
 *
 * const id = await upsertGlobal({
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
      changes: userFields,
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

  // Versioned global: writes the PUBLISHED row directly — the slug's row
  // whose `vex_status !== "draft"` — and never touches the draft row, if
  // one is active. `saveDraft` (`api/versions/saveDraft.server.ts`) is the
  // only path that writes a global's draft row.
  const publishedRow = rows.find((r) => r.vex_status !== VERSION_STATUSES.draft.key);

  const { patch } = await prepareEdit({
    ctx: props.ctx,
    config: props.config,
    target: { kind: "global", config: globalConfig },
    action: publishedRow ? CRUD_ACTIONS.update : CRUD_ACTIONS.create,
    access: props.access,
    auth: props.auth,
    storedDoc: publishedRow ? (toStored(publishedRow) as never) : undefined,
    changes: userFields,
    partial: false,
    validateKeys: "changed",
  });

  if (publishedRow) {
    const nextData = { ...((publishedRow.data as Record<string, unknown>) ?? {}), ...patch };
    await props.ctx.db.patch(publishedRow._id as never, { data: nextData } as never);
    await createVersion({
      ctx: props.ctx,
      collection: "vex_globals" as CollectionSlug,
      documentId: props.slug,
      status: VERSION_STATUSES.published.key,
      snapshot: nextData,
      publishedAt: publishedRow.vex_publishedAt as number | undefined,
    });
    return publishedRow._id as string;
  }

  const publishedAt = Date.now();
  const id = await props.ctx.db.insert("vex_globals", {
    slug: props.slug,
    data: patch,
    vex_status: VERSION_STATUSES.published.key,
    vex_publishedAt: publishedAt,
  } as never);
  await createVersion({
    ctx: props.ctx,
    collection: "vex_globals" as CollectionSlug,
    documentId: props.slug,
    status: VERSION_STATUSES.published.key,
    snapshot: patch,
    publishedAt,
  });
  return id as string;
}
