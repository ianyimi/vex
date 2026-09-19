import type { GenericDataModel, GenericMutationCtx } from "convex/server";

/**
 * Base shape shared by every lifecycle hook's props across this framework —
 * collection hooks (`collections/hooks.ts`), and, once built, global and
 * media collection hooks (`globals/hooks.ts`, `media/hooks.ts`). Every hook
 * receives the mutation `ctx`, typed against the project's real `DataModel`.
 *
 * Each domain extends this with its own props (`doc`, `collection`/`global`,
 * etc.) rather than redeclaring `ctx` — see `collections/hooks.ts`'s
 * `BeforeChangeProps` for the pattern.
 *
 * @typeParam TDataModel - The project's generated Convex `DataModel`.
 *   Defaults to `GenericDataModel`; each domain's own `xHook` factory (e.g.
 *   `beforeChangeHook`) accepts it as an explicit type argument so `ctx` is
 *   fully typed.
 */
export interface BaseHookProps<TDataModel extends GenericDataModel = GenericDataModel> {
  ctx: GenericMutationCtx<TDataModel>;
}
