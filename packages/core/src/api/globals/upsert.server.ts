import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { GlobalSlug } from "../../types/generated";
import { getGlobalInputSchema } from "../../globals/utils";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { GenericGlobalsMutationServerArgs } from "./types";
import { resolveAccessCall } from "../utils";
import { flattenGlobalRow } from "./utils";

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
 * Upserts a global document in `vex_globals`. Strips system keys from `data`,
 * merges the remaining user fields onto the stored document, validates that
 * merged result against the global's Zod schema, then patches only the
 * changed fields into the stored `data` blob — an omitted field is left
 * untouched, never deleted. Inserts a new row (from a complete payload) if
 * none exists yet for the slug.
 *
 * Throws `ConvexError` on Zod validation failure with structured `errors` payload.
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * **Authorization.** A global is a singleton, so the verb depends on whether it
 * has ever been saved: the first write authorizes as `create`, every later one
 * as `update` — never `read`. That distinction is the whole check: a role
 * holding only `read` on a global must not be able to overwrite it.
 * `access.action` overrides both, as everywhere else. A per-field permission
 * map denies on the first changed key it forbids; a field resent unchanged is
 * not a violation.
 *
 * The check runs before Zod validation, so a denied caller cannot probe the
 * global's field shape through validation error messages.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 * @param args - `{ ctx, slug, data, globalConfig }`.
 * @returns The `_id` of the upserted document as a string.
 *
 * @example
 * ```ts
 * import { updateGlobal } from "@vexcms/core/server";
 *
 * const id = await updateGlobal({
 *   ctx,
 *   slug: "siteSettings",
 *   data: { siteName: "New Name" },
 *   globalConfig: config.globals.find((g) => g.slug === "siteSettings")!,
 * });
 * ```
 *
 * Globals deliberately carry no auto-maintained `updatedAt`, unlike every
 * collection (`defineCollection` injects one, and `create`/`update` stamp it).
 * `vex_globals` is a single `{ slug, data }` table shared by every registered
 * global — there is no per-global `defineTable` generated from
 * `GlobalConfig.fields`, so there is no column to stamp. Every global's user
 * fields live inside the one `data: v.any()` blob, validated only by a
 * per-global Zod schema at the API layer, never by a Convex column.
 *
 * Stashing the timestamp inside `data` instead is not equivalent: both
 * `STRIPPED_KEYS` and `getGlobalInputSchema`'s Zod schema would have to learn
 * about a field no `GlobalConfigInput` declares, entangling a per-collection
 * concern with the globals system's separate flat-document machinery. That is
 * a design of its own, not a one-line addition.
 */
export async function upsertGlobal<
  DataModel extends GenericDataModel,
  TSlug extends GlobalSlug = GlobalSlug,
>(args: UpsertGlobalServerArgs<DataModel, TSlug>): Promise<string> {
  const { ctx, slug, data } = args;

  const globalConfig = args.config.globals.find((g) => g.slug === args.slug);
  if (!globalConfig) {
    throw new ConvexError(`No global registered with slug "${args.slug}"`);
  }

  const existingGlobal = await ctx.db
    .query("vex_globals")
    .withIndex("by_slug", (q) => q.eq("slug", slug as never))
    .first();

  const userFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!STRIPPED_KEYS.has(k)) userFields[k] = v;
  }

  const storedDoc = existingGlobal ? flattenGlobalRow(existingGlobal) : undefined;

  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: existingGlobal ? CRUD_ACTIONS.update : CRUD_ACTIONS.create,
      resource: args.slug,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: storedDoc ?? userFields,
      changes: userFields,
    });
  }

  // Validate against field config's Zod schema
  const schema = getGlobalInputSchema({ global: globalConfig });
  const storedData = existingGlobal ? (existingGlobal.data as Record<string, unknown>) : undefined;
  const merged = storedData ? { ...storedData, ...userFields } : userFields;
  const result = schema.safeParse(merged);
  if (!result.success) {
    throw new ConvexError({
      message: "Global validation failed",
      errors: result.error.message,
    });
  }

  if (existingGlobal) {
    await ctx.db.patch(existingGlobal._id as never, {
      data: { ...(existingGlobal.data as Record<string, unknown>), ...result.data },
    } as never);
    return existingGlobal._id as string;
  }

  const id = await ctx.db.insert("vex_globals", {
    slug,
    data: result.data,
  } as never);
  return id as string;
}
