import { type GenericDataModel, GenericQueryCtx } from "convex/server";
import { type GenericId } from "convex/values";
import { type VexConfig } from "../config";
import { type CollectionSlug } from "../types";
import { CRUD_ACTIONS, type CustomActionsInput, DRAFT_ACTIONS, VexAccessConfig } from "../access";
import { AccessCallOptions } from "./types";

/**
 * Resolves the access config and action for one server-function call.
 *
 * Single seam for `access.action` / `access.bypass`. Bypass returns `undefined` for
 * `access`, which is the documented "RBAC not configured" path — no separate enforcement
 * branch exists or should be added.
 *
 * @param props.config - Resolved Vex config; `config.access` supplies the matrix.
 * @param props.access - Per-call overrides.
 * @param props.defaultAction - The function's natural verb.
 * @param props.resource - Subject slug: the custom-action lookup key, and the name the
 *   dev warnings report.
 * @returns The access config to enforce (`undefined` when bypassed) and the action to check.
 */
export function resolveAccessCall<A extends string>(props: {
  config?: VexConfig;
  access?: AccessCallOptions<A>;
  defaultAction: A;
  resource: string;
}): { access: VexAccessConfig | undefined; action: A; resource: string } {
  const configured = props.config?.access;
  const bypassed = props.access?.bypass === true;
  const action = props.access?.action ?? props.defaultAction;

  // Dev-only diagnostics. Neither case is unsafe — the undeclared-permission posture is
  // pinned to deny, so an action nothing declares is refused, never granted. They exist
  // because that refusal is otherwise indistinguishable from a deliberate denial, and a
  // one-character typo in an action name is invisible at the call site.
  if (process.env.NODE_ENV !== "production") {
    if (bypassed && configured === undefined) {
      console.warn(
        `[vexcms] access.bypass was set for "${props.resource}" but this call has no access ` +
          `config, so RBAC was already off and the flag changed nothing. Either drop it, or ` +
          `check that the call receives the config you expect.`,
      );
    }

    // Skipped when bypassed: no check runs, so the action is not consulted and warning
    // about it would be noise.
    if (!bypassed && props.access?.action !== undefined && configured !== undefined) {
      // `customActions` stays generic on the resolved config so it can carry the caller's
      // literal declaration for inference, and the wide `VexConfig.access` instantiates
      // that parameter to `{}` — so a runtime lookup by slug has to restate the value
      // shape. Read-only, and `defineAccess` has already validated the entries.
      const declaredForResource = (
        configured.customActions as Record<string, CustomActionsInput> | undefined
      )?.[props.resource];

      const declared = new Set<string>([
        ...Object.values(CRUD_ACTIONS),
        ...Object.values(DRAFT_ACTIONS),
        ...(declaredForResource?.query ?? []),
        ...(declaredForResource?.mutation ?? []),
      ]);

      if (!declared.has(action)) {
        console.warn(
          `[vexcms] Action "${action}" is not declared for "${props.resource}": it is neither ` +
            `a built-in verb nor listed in customActions["${props.resource}"]. No rule can ` +
            `name it, so this call resolves to a denial. Check for a typo.`,
        );
      }
    }
  }

  // Bypass returns `undefined` rather than short-circuiting a check: that is the documented
  // "RBAC not configured" path, so every downstream consumer already handles it and no
  // second enforcement branch can drift from the first.
  return { access: bypassed ? undefined : configured, action, resource: props.resource };
}

/**
 * Resolves the collection slug that owns a document `id` by probing
 * `ctx.db.normalizeId` against every registered collection.
 *
 * A Convex `Id` does not expose its table name at runtime. `get/server.ts`'s
 * D12 comment documents the same constraint for depth-populate, where
 * degrading to "unresolvable" is safe (populate is simply skipped). It is
 * NOT safe here — `get`, `update`, and `remove` gate a real permission
 * check — so this resolves the slug via the `ctx.db.normalizeId(tableName, id)`
 * syscall instead of string-parsing the id. Unlike the D12 trick, this works
 * identically in `convex-test` and production Convex.
 *
 * @param props.ctx - Query or mutation context — only `ctx.db.normalizeId` is used.
 * @param props.config - The resolved `VexConfig`, to enumerate candidate collections.
 * @param props.id - The document id to resolve.
 * @returns The owning collection's slug.
 * @throws {Error} When no registered collection claims the id (e.g. an id for a
 *   non-collection table like `vex_globals`, or a stale id from a deleted collection).
 *   Callers gate the permission check behind this, so an unresolvable id is a hard error,
 *   not a silent skip.
 */
export function resolveCollectionSlug<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config?: VexConfig;
  id: GenericId<CollectionSlug>;
}): CollectionSlug {
  for (const c of props.config?.collections ?? []) {
    if (props.ctx.db.normalizeId(c.slug, props.id) !== null) {
      return c.slug;
    }
  }
  throw new Error("[resolveCollectionSlug]: document id does not match a collection slug");
  // Note: `config.collections` is small and `normalizeId` is a local syscall (no DB round
  // trip), so looping it once per `get`/`update`/`remove` request is cheap.
}
