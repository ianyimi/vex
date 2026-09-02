import {
  queryGeneric,
  type QueryBuilder,
  type GenericQueryCtx,
  type GenericDataModel,
  type RegisteredQuery,
} from "convex/server";
import { v, type ObjectType, type PropertyValidators } from "convex/values";

/**
 * Drafts mode for vexQuery.
 * - "snapshot": Fetch the transient preview snapshot (written by admin on form changes)
 * - true: Fetch the latest draft version (from versioning system)
 * - false: Fetch published content only
 */
export type VexDraftsMode = "snapshot" | boolean;

/**
 * Context passed to vexQuery handlers.
 * Extends the standard Convex QueryCtx with draft-awareness.
 */
export interface VexQueryCtx<DataModel extends GenericDataModel = GenericDataModel>
  extends GenericQueryCtx<DataModel> {
  /**
   * The resolved drafts mode.
   * - "snapshot": caller wants preview snapshot data
   * - true: caller wants latest draft version
   * - false: caller wants published content only
   *
   * Defaults to "snapshot" when not explicitly passed by the caller.
   */
  drafts: VexDraftsMode;
}

function wrapHandler<DataModel extends GenericDataModel, Args extends PropertyValidators, Output>(
  handler: (ctx: VexQueryCtx<DataModel>, args: ObjectType<Args>) => Output | Promise<Output>,
) {
  return async (ctx: GenericQueryCtx<any>, args: any): Promise<Awaited<Output>> => {
    const { _vexDrafts, ...userArgs } = args;

    const drafts: VexDraftsMode = _vexDrafts !== undefined
      ? (_vexDrafts as VexDraftsMode)
      : "snapshot";

    const vexCtx = Object.assign(
      Object.create(Object.getPrototypeOf(ctx)),
      ctx,
      { drafts },
    ) as VexQueryCtx<DataModel>;

    return handler(vexCtx, userArgs as ObjectType<Args>) as Promise<Awaited<Output>>;
  };
}

/**
 * Create a typed vexQuery builder from your project's query builder.
 *
 * Call this once in your project to get a `vexQuery` function that
 * preserves full return type inference from your DataModel.
 *
 * @example
 * ```ts
 * // convex/vex/helpers.ts
 * import { createVexQuery } from "@vexcms/core";
 * import { query } from "../_generated/server";
 *
 * export const vexQuery = createVexQuery(query);
 * ```
 *
 * Then use it in your query files:
 * ```ts
 * // convex/pages.ts
 * import { vexQuery } from "./vex/helpers";
 * import { getPreviewSnapshot } from "@vexcms/core";
 *
 * export const getBySlug = vexQuery({
 *   args: { slug: v.string() },
 *   handler: async (ctx, args) => {
 *     const page = await ctx.db
 *       .query("pages")
 *       .withIndex("by_slug", (q) => q.eq("slug", args.slug))
 *       .first();
 *     if (!page) return null;
 *     if (ctx.drafts === "snapshot") {
 *       const snapshot = await getPreviewSnapshot({ ctx, collection: "pages", documentId: page._id });
 *       if (snapshot) return { ...page, ...snapshot };
 *     }
 *     return page;
 *   },
 * });
 * ```
 */
export function createVexQuery<DataModel extends GenericDataModel>(
  _queryBuilder: QueryBuilder<DataModel, "public">,
) {
  return <Args extends PropertyValidators, Output>(props: {
    args: Args;
    handler: (
      ctx: VexQueryCtx<DataModel>,
      args: ObjectType<Args>,
    ) => Output | Promise<Output>;
  }): RegisteredQuery<"public", ObjectType<Args & { _vexDrafts: typeof v.optional<any> }>, Awaited<Output>> => {
    const mergedArgs = {
      ...props.args,
      _vexDrafts: v.optional(v.union(v.literal("snapshot"), v.boolean())),
    };

    return queryGeneric({
      args: mergedArgs,
      handler: wrapHandler<DataModel, Args, Output>(props.handler),
    }) as RegisteredQuery<"public", ObjectType<Args & { _vexDrafts: typeof v.optional<any> }>, Awaited<Output>>;
  };
}

/**
 * Generic vexQuery for use without project-specific types.
 * Prefer `createVexQuery(query)` for full type inference.
 *
 * @deprecated Use `createVexQuery(query)` instead for proper return type inference.
 */
export function vexQuery<Args extends PropertyValidators, Output>(props: {
  args: Args;
  handler: (
    ctx: VexQueryCtx,
    args: ObjectType<Args>,
  ) => Output | Promise<Output>;
}): RegisteredQuery<"public", ObjectType<Args & { _vexDrafts: typeof v.optional<any> }>, Awaited<Output>> {
  const mergedArgs = {
    ...props.args,
    _vexDrafts: v.optional(v.union(v.literal("snapshot"), v.boolean())),
  };

  return queryGeneric({
    args: mergedArgs,
    handler: wrapHandler(props.handler),
  }) as RegisteredQuery<"public", ObjectType<Args & { _vexDrafts: typeof v.optional<any> }>, Awaited<Output>>;
}
