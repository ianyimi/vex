import type { FunctionVisibility, GenericDataModel, GenericMutationCtx, MutationBuilder } from "convex/server";
import { Triggers } from "convex-helpers/server/triggers";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import type { VexConfig } from "../config";
import { flattenGlobalRow } from "../globals/utils";

/**
 * Reads `db.vars` off a mutation `ctx.db` — Convex's own commit-timestamp
 * API, not part of the public `GenericDatabaseWriter` type this file
 * otherwise treats `db` as. Narrowed with `in` rather than cast, so a
 * caller never throws when `.vars` is absent (an older Convex version, or
 * `db` wasn't the real mutation ctx's own writer).
 *
 * @param db - The mutation ctx's `db`, typed `unknown` because the caller
 *   may pass either the real writer or a trigger-wrapped stand-in.
 * @returns `db.vars` when `db` is a non-null object exposing a `vars`
 *   property, otherwise `undefined`.
 */
function dbVars(db: unknown): unknown {
  if (db !== null && typeof db === "object" && "vars" in db) {
    return db.vars;
  }
  return undefined;
}

/**
 * Reads `ctx.db.vars.commitTs` when present — the trigger-wrapped `ctx.db`
 * (convex-helpers' `writerWithTriggers`) replaces `db` with a plain object
 * exposing only `insert`/`patch`/`replace`/`delete`/`query`/`get`/
 * `normalizeId`, so `.vars` is NOT re-exposed inside a trigger callback.
 * Narrowed with `in` rather than cast, so a callback never throws; a hook's
 * `commitTs` prop is typed `unknown` precisely because it may be absent.
 *
 * @param db - The trigger callback's `ctx.db`.
 * @returns `db.vars.commitTs` when reachable, otherwise `undefined`.
 */
function triggerCommitTs(db: unknown): unknown {
  const vars = dbVars(db);
  if (vars !== null && typeof vars === "object" && "commitTs" in vars) {
    return vars.commitTs;
  }
  return undefined;
}

/**
 * Builds a `convex-helpers` `Triggers<DataModel>` instance and wraps an app's
 * raw `mutation`/`internalMutation` builders so writes made through the
 * result fire each written collection's `afterChange`/`afterDelete` hooks and
 * each written global's `afterChange` hook.
 *
 * Hooks fire only for writes made through the returned builders — never for
 * the Convex dashboard, `npx convex import`, or a mutation still built on the
 * raw `_generated/server` builder.
 *
 * @example
 * ```ts
 * // convex/triggers.ts
 * import { createVexMutations } from "@vexcms/core/server";
 * import config from "~/vex.config.server";
 * import { mutation, internalMutation } from "./_generated/server";
 *
 * export const { mutation: wrappedMutation, internalMutation: wrappedInternalMutation } =
 *   createVexMutations({ config, mutation, internalMutation });
 * export { wrappedMutation as mutation, wrappedInternalMutation as internalMutation };
 *
 * // convex/vex.ts
 * import { mutation, query } from "./triggers"; // not "./_generated/server"
 * export const { create, update, remove } = collectionsApi({ config, query, mutation, getAuth });
 * ```
 *
 * @param props - The app's `VexConfig`, and the raw `mutation`/`internalMutation` builders to wrap.
 * @returns Trigger-wrapped `mutation`/`internalMutation` builders with the same signatures as `props`.
 */
export function createVexMutations<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(props: {
  config: VexConfig;
  mutation: MutationBuilder<DataModel, Visibility>;
  internalMutation: MutationBuilder<DataModel, "internal">;
}): {
  mutation: MutationBuilder<DataModel, Visibility>;
  internalMutation: MutationBuilder<DataModel, "internal">;
} {
  const triggers = new Triggers<DataModel>();

  for (const collection of props.config.collections) {
    const { afterChange, afterDelete } = collection.hooks;
    if (!afterChange && !afterDelete) continue;

    triggers.register(collection.slug as never, async (ctx, change) => {
      // The trigger-wrapped `ctx.db` (convex-helpers' `writerWithTriggers`)
      // does not re-expose `.vars` — only the real mutation ctx's `db` does.
      // Optional-chained so a trigger callback never throws; `commitTs`'s own
      // type (`unknown`) already documents it as "may not be a usable value".
      const commitTs = triggerCommitTs(ctx.db);
      if (change.operation === "delete") {
        await afterDelete?.({
          id: change.id as never,
          oldDoc: change.oldDoc as never,
          collection,
          ctx,
          commitTs,
        });
        return;
      }
      await afterChange?.({
        operation: change.operation === "insert" ? "create" : "update",
        id: change.id as never,
        oldDoc: (change.oldDoc ?? null) as never,
        newDoc: change.newDoc as never,
        collection,
        ctx,
        commitTs,
      });
    });
  }

  // One shared `vex_globals` trigger, dispatching by `newDoc.slug`, registered
  // only when at least one global actually declares `afterChange` — a global
  // has no delete hook, so a `"delete"` change (always `publish` removing a
  // draft row) is always skipped.
  const globalsWithAfterChange = (props.config.globals ?? []).filter((g) => g.hooks.afterChange);
  if (globalsWithAfterChange.length > 0) {
    triggers.register("vex_globals" as never, async (ctx, change) => {
      if (change.operation === "delete") return;
      const global = globalsWithAfterChange.find((g) => g.slug === change.newDoc.slug);
      if (!global) return;
      const commitTs = triggerCommitTs(ctx.db);
      await global.hooks.afterChange!({
        operation: change.operation === "insert" ? "create" : "update",
        id: change.id as string,
        oldDoc: change.oldDoc ? flattenGlobalRow(change.oldDoc) : null,
        newDoc: flattenGlobalRow(change.newDoc),
        global,
        ctx,
        commitTs,
      } as never);
    });
  }

  // `Triggers#wrapDB` replaces `ctx.db` with its own writer object for the
  // WHOLE mutation body built on the returned `mutation`/`internalMutation`
  // — not just inside a registered trigger callback above — and that
  // writer doesn't carry `.vars` forward. Every `stampCommitTsFields` call
  // site (`api/create|update/server.ts`, `versions/publish|unpublish|
  // saveDraft.ts`) reads `ctx.db.vars.commitTs` straight off the mutation's
  // own `ctx.db`; without re-attaching it here, every write made through a
  // project's `createVexMutations`-wrapped builder (the documented way to
  // get `afterChange`/`afterDelete` hooks) throws the moment it tries to
  // stamp a `commitTs()` field.
  const wrapDBKeepingVars = (ctx: GenericMutationCtx<DataModel>): GenericMutationCtx<DataModel> => {
    const wrapped = triggers.wrapDB(ctx);
    return { ...wrapped, db: { ...wrapped.db, vars: dbVars(ctx.db) } } as GenericMutationCtx<DataModel>;
  };

  return {
    mutation: customMutation(props.mutation, customCtx(wrapDBKeepingVars)) as MutationBuilder<
      DataModel,
      Visibility
    >,
    internalMutation: customMutation(props.internalMutation, customCtx(wrapDBKeepingVars)) as MutationBuilder<
      DataModel,
      "internal"
    >,
  };
}
