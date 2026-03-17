import {
  queryGeneric,
  type GenericQueryCtx,
  type GenericDataModel,
} from "convex/server";
import { v, type ObjectType, type PropertyValidators } from "convex/values";

/**
 * Drafts mode for vexQuery.
 * - "snapshot": Fetch the transient preview snapshot (written by admin on form changes)
 * - true: Fetch the latest draft version (from versioning system)
 * - false/undefined: Fetch published content only (default in production)
 *
 * In dev mode (NODE_ENV !== "production"), vexQuery automatically behaves as
 * if `drafts: "snapshot"` when a preview snapshot exists, without the caller
 * needing to pass the option.
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
   * In dev mode, this is automatically set to "snapshot" if the caller
   * didn't pass a `drafts` option.
   */
  drafts: VexDraftsMode;
}

/**
 * Creates a Convex query with built-in draft/snapshot content support.
 *
 * Wraps Convex's `queryGeneric()` to:
 * 1. Automatically add an optional `_vexDrafts` arg (string | boolean)
 * 2. Pass an extended context with `drafts` mode to the handler
 * 3. In dev mode, auto-resolve to "snapshot" when no explicit option is passed
 * 4. Preserve full type safety for args and return types
 *
 * The handler receives a `VexQueryCtx` which includes `ctx.drafts`.
 * Use this to decide what content to return.
 *
 * @example
 * ```ts
 * import { vexQuery, getPreviewSnapshot } from "@vexcms/core";
 * import { v } from "convex/values";
 *
 * export const getPost = vexQuery({
 *   args: { slug: v.string() },
 *   handler: async (ctx, args) => {
 *     const post = await ctx.db
 *       .query("posts")
 *       .withIndex("by_slug", (q) => q.eq("slug", args.slug))
 *       .first();
 *
 *     if (!post) return null;
 *
 *     if (ctx.drafts === "snapshot") {
 *       const snapshot = await getPreviewSnapshot({
 *         ctx,
 *         collection: "posts",
 *         documentId: post._id,
 *       });
 *       if (snapshot) {
 *         return { ...post, ...snapshot };
 *       }
 *     }
 *
 *     return post;
 *   },
 * });
 * ```
 */
export function vexQuery<Args extends PropertyValidators, Output>(props: {
  args: Args;
  handler: (
    ctx: VexQueryCtx,
    args: ObjectType<Args>,
  ) => Output | Promise<Output>;
}) {
  const mergedArgs = {
    ...props.args,
    _vexDrafts: v.optional(v.union(v.literal("snapshot"), v.boolean())),
  };

  return queryGeneric({
    args: mergedArgs,
    handler: async (ctx: GenericQueryCtx<any>, args: any) => {
      const { _vexDrafts, ...userArgs } = args;

      let drafts: VexDraftsMode;
      if (_vexDrafts !== undefined) {
        drafts = _vexDrafts as VexDraftsMode;
      } else if (process.env.NODE_ENV !== "production") {
        drafts = "snapshot";
      } else {
        drafts = false;
      }

      const vexCtx: VexQueryCtx = Object.assign(Object.create(Object.getPrototypeOf(ctx)), ctx, {
        drafts,
      });

      return props.handler(vexCtx, userArgs as ObjectType<Args>);
    },
  });
}
