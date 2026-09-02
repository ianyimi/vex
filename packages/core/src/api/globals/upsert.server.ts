import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { GlobalSlug } from "../../types/generated";
import { getGlobalInputSchema } from "../../globals/utils";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { GenericGlobalsMutationServerArgs } from "./types";
import { resolveAccessCall } from "../utils";

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
 * validates remaining user fields against the global's Zod schema, then writes
 * `{ slug, data: userFields }` to the DB (re-nesting). Patches if a row
 * already exists for the slug; inserts if not.
 *
 * Throws `ConvexError` on Zod validation failure with structured `errors` payload.
 * Server-side only. Import from `@vexcms/core/server`.
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

  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.read,
      resource: args.slug,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource,
      action,
    });
  }

  // Strip any system keys that arrived in the flat payload
  const userFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!STRIPPED_KEYS.has(k)) userFields[k] = v;
  }

  // Validate against field config's Zod schema
  const schema = getGlobalInputSchema({ global: globalConfig });
  const result = schema.safeParse(userFields);
  if (!result.success) {
    throw new ConvexError({
      message: "Global validation failed",
      errors: result.error.message,
    });
  }

  const existingGlobal = await ctx.db
    .query("vex_globals")
    .withIndex("by_slug", (q) => q.eq("slug", slug as never))
    .first();

  if (existingGlobal) {
    await ctx.db.patch(existingGlobal._id as never, { data: result.data } as never);
    return existingGlobal._id as string;
  }

  const id = await ctx.db.insert("vex_globals", {
    slug,
    data: result.data,
  } as never);
  return id as string;
}
