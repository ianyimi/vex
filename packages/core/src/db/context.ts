import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { VexMutationCtx, VexQueryCtx } from "../types/generated";

/**
 * Narrows a generically-typed Convex context to the project's own.
 *
 * THE one place this conversion is written. Every public server function stays
 * generic over `DataModel`, inferred from the `ctx` the caller passes, while
 * every config callback (`validate`, a `{ server }` preview resolver, hooks) is
 * typed against the fixed `VexDataModel` from `vex generate` — a callback has no
 * type argument to infer a model from, and giving it one would collapse `ctx.db`
 * to `GenericDataModel`.
 *
 * The conversion cannot be expressed as a subtype relation. `GenericQueryCtx` is
 * INVARIANT in its data model: `db.get()` produces model-typed documents while
 * `db.insert()`/`db.patch()` consume them, so neither direction is substitutable
 * — constraining the parameter (`DataModel extends VexDataModel`) does not help,
 * and was measured not to (TS2322 on the assignment, with `DataModel` still
 * unresolved). At runtime there is exactly one context per deployment and it is
 * the project's own, so the conversion is sound; it is only unprovable to the
 * checker.
 *
 * @param ctx - The context a public server function received.
 * @returns The same object, typed as the project's context.
 */
export function toVexQueryCtx<DataModel extends GenericDataModel>(
  ctx: GenericQueryCtx<DataModel>,
): VexQueryCtx {
  return ctx as unknown as VexQueryCtx;
}

/**
 * Mutation counterpart of {@link toVexQueryCtx}.
 *
 * @param ctx - The context a public server function received.
 * @returns The same object, typed as the project's mutation context.
 * @see {@link toVexQueryCtx} for why the conversion cannot be a subtype relation.
 */
export function toVexMutationCtx<DataModel extends GenericDataModel>(
  ctx: GenericMutationCtx<DataModel>,
): VexMutationCtx {
  return ctx as unknown as VexMutationCtx;
}
