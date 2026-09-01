import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import type { VexConfig } from "@vexcms/core";
import config from "~/vex.config";

/**
 * Extended query context with VexConfig.
 * Allows accessing collection config via ctx.vexConfig instead of passing it as a parameter.
 */
export interface VexQueryCtx extends GenericQueryCtx<DataModel> {
  vexConfig: VexConfig;
}

/**
 * Extended mutation context with VexConfig.
 */
export interface VexMutationCtx extends GenericMutationCtx<DataModel> {
  vexConfig: VexConfig;
}

/**
 * Injects vexConfig into the query context.
 * Use this to wrap query handlers that need access to collection config.
 *
 * @example
 * ```ts
 * export const myQuery = query({
 *   args: { ... },
 *   handler: withVexConfig(async (ctx, args) => {
 *     // ctx.vexConfig is available here
 *     const collection = findCollectionBySlug(ctx.vexConfig, args.slug);
 *     return ...;
 *   }),
 * });
 * ```
 */
export function withVexConfig<Args, Output>(
  handler: (ctx: VexQueryCtx, args: Args) => Promise<Output>,
): (ctx: GenericQueryCtx<DataModel>, args: Args) => Promise<Output> {
  return async (ctx, args) => {
    const vexCtx: VexQueryCtx = {
      ...ctx,
      vexConfig: config,
    };
    return handler(vexCtx, args);
  };
}

/**
 * Injects vexConfig into the mutation context.
 * Use this to wrap mutation handlers that need access to collection config.
 *
 * @example
 * ```ts
 * export const myMutation = mutation({
 *   args: { ... },
 *   handler: withVexConfigMutation(async (ctx, args) => {
 *     // ctx.vexConfig is available here
 *     const collection = findCollectionBySlug(ctx.vexConfig, args.slug);
 *     return ...;
 *   }),
 * });
 * ```
 */
export function withVexConfigMutation<Args, Output>(
  handler: (ctx: VexMutationCtx, args: Args) => Promise<Output>,
): (ctx: GenericMutationCtx<DataModel>, args: Args) => Promise<Output> {
  return async (ctx, args) => {
    const vexCtx: VexMutationCtx = {
      ...ctx,
      vexConfig: config,
    };
    return handler(vexCtx, args);
  };
}
