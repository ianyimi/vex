import type { FunctionVisibility, GenericDataModel, MutationBuilder } from "convex/server";
import { Triggers } from "convex-helpers/server/triggers";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import type { VexConfig } from "../config";
import { flattenGlobalRow } from "./globals/utils";

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
      if (change.operation === "delete") {
        await afterDelete?.({
          id: change.id as never,
          oldDoc: change.oldDoc as never,
          collection,
          ctx,
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
      });
    });
  }

  // One shared `vex_globals` trigger, dispatching by `newDoc.slug`, registered
  // only when at least one global actually declares `afterChange` — a global
  // has no delete hook, so a `"delete"` change (always `publish` removing a
  // draft row, Step 9) is always skipped.
  const globalsWithAfterChange = (props.config.globals ?? []).filter((g) => g.hooks.afterChange);
  if (globalsWithAfterChange.length > 0) {
    triggers.register("vex_globals" as never, async (ctx, change) => {
      if (change.operation === "delete") return;
      const global = globalsWithAfterChange.find((g) => g.slug === change.newDoc.slug);
      if (!global) return;
      await global.hooks.afterChange!({
        operation: change.operation === "insert" ? "create" : "update",
        id: change.id as string,
        oldDoc: change.oldDoc ? flattenGlobalRow(change.oldDoc) : null,
        newDoc: flattenGlobalRow(change.newDoc),
        global,
        ctx,
      } as never);
    });
  }

  return {
    mutation: customMutation(props.mutation, customCtx(triggers.wrapDB)) as MutationBuilder<DataModel, Visibility>,
    internalMutation: customMutation(props.internalMutation, customCtx(triggers.wrapDB)) as MutationBuilder<
      DataModel,
      "internal"
    >,
  };
}
