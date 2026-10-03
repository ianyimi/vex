import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { CollectionConfig } from "../collections/types";
import type { GlobalConfig } from "../globals/types";
import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "./types";
import type { TDocument } from "./convex";
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission } from "../access";
import { getFieldsInputSchema, validateFields } from "../fields";
import { deepEqual, resolveAccessCall, toVexMutationCtx } from "./utils";

/**
 * Args for {@link prepareEdit}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface PrepareEditProps<DataModel extends GenericDataModel> {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /**
   * The resolved `VexConfig`. Required: `validateFields` needs it to build the
   * `vex` api each field `validate()` receives. The permission check still
   * skips itself when `config.access` is unset (RBAC off).
   */
  config: VexConfig;
  /** The collection or global this write targets. `config.slug` is the permission resource. */
  target:
    | { kind: "collection"; config: CollectionConfig }
    | { kind: "global"; config: GlobalConfig };
  /** The permission action this write checks under. */
  action:
    | typeof CRUD_ACTIONS.create
    | typeof CRUD_ACTIONS.update
    | typeof DRAFT_ACTIONS.saveDraft
    | typeof DRAFT_ACTIONS.publish;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /**
   * The document to authorize against and merge onto — the CURRENT state of
   * whichever row this write is really targeting (the draft row for
   * `saveDraft`/`publish`, the row `args.id` names for `update`). `undefined`
   * only for a brand-new document with no prior state to merge onto.
   *
   * Caller contract: USER fields plus `_id`/`_creationTime` only — never
   * system columns. `prepareEdit` strips just `_id`/`_creationTime` before
   * merging, and in `validateKeys: "all"` mode `patch` carries every merged
   * key, so a stored doc carrying `vex_*`/`_slug` would leak them into the
   * write. Collections already satisfy this via `extractUserFields`; globals
   * pass `{ _id, _creationTime, ...row.data }`. A consequence of this
   * contract: `beforeChange` sees user fields only — no `vex_status` — on
   * every path.
   */
  storedDoc: TDocument | undefined;
  /** The caller's raw incoming payload — what `hasPermission`'s `changes` argument checks. */
  incoming: Partial<TDocument>;
  /** `true` for lenient validation (`update`, `saveDraft` — a draft may be incomplete); `false` for strict, `create`-strength validation (`publish`). */
  partial: boolean;
  /** Which fields get their `validate()` hook run: only what changed (`update`, `saveDraft`), or every field (`publish`, matching `create`). */
  validateKeys: "changed" | "all";
}

/** Result of {@link prepareEdit}. */
export interface PrepareEditResult {
  /** The full document after merge + `beforeChange`, already validated. */
  transformedFields: TDocument;
  /** Keys whose value actually changed, relative to the pre-`beforeChange` merge. */
  changedKeys: Set<string>;
  /**
   * The fields to write: only `changedKeys`' values when `validateKeys` is
   * `"changed"`, or the full `transformedFields` when it is `"all"` — `publish`
   * always writes every field, matching `create`'s "write everything" shape.
   */
  patch: Record<string, unknown>;
}

/**
 * Runs the write pipeline every field-mutating operation shares —
 * `hasPermission → merge → beforeChange → diff → validate → validateFields` —
 * and returns the prepared fields for the caller to write however its own
 * targeting requires. Does NOT touch `ctx.db`, call `createVersion`, or stamp
 * `updatedAt` — those steps differ per caller and stay in
 * `create()`/`update()`/`saveDraft()`/`publish()`/`upsertGlobal()` themselves.
 *
 * @typeParam DataModel - Convex data model (inferred from `props.ctx`).
 * @param props - See {@link PrepareEditProps}.
 * @returns See {@link PrepareEditResult}.
 * @throws {ConvexError} When Zod validation fails — `{ message, errors }`, naming
 *   every invalid/missing field.
 * @throws {VexAccessError} When the caller is not permitted to make this write.
 */
export async function prepareEdit<DataModel extends GenericDataModel>(
  props: PrepareEditProps<DataModel>,
): Promise<PrepareEditResult> {
  if (props.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: props.action,
      resource: props.target.config.slug,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: props.auth?.user ?? null,
      organization: props.auth?.organization,
      resource,
      action,
      data: props.storedDoc,
      changes: props.incoming,
    });
  }

  const { _id, _creationTime, ...fields } = props.storedDoc ?? {};
  const mergedFields = { ...fields, ...props.incoming } as TDocument;

  const operation = props.action === CRUD_ACTIONS.create ? "create" : "update";
  let transformedFields = mergedFields;
  if (props.target.kind === "collection" && props.target.config.hooks.beforeChange) {
    transformedFields = (await props.target.config.hooks.beforeChange({
      operation,
      doc: mergedFields as never,
      ctx: props.ctx,
      collection: props.target.config,
    })) as TDocument;
  } else if (props.target.kind === "global" && props.target.config.hooks.beforeChange) {
    transformedFields = (await props.target.config.hooks.beforeChange({
      operation,
      doc: mergedFields as never,
      ctx: props.ctx,
      global: props.target.config,
    })) as TDocument;
  }

  const changedKeys = new Set(Object.keys(props.incoming));
  for (const key of Object.keys(transformedFields)) {
    if (!deepEqual(transformedFields[key], mergedFields[key])) changedKeys.add(key);
  }

  const parsed = getFieldsInputSchema({
    fields: props.target.config.fields,
    partial: props.partial,
  }).safeParse(transformedFields);
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }

  const writeKeys =
    props.validateKeys === "all" ? new Set(Object.keys(transformedFields)) : changedKeys;
  await validateFields({
    fields: props.target.config.fields,
    doc: transformedFields,
    keys: writeKeys,
    ctx: toVexMutationCtx(props.ctx),
    config: props.config,
  });

  const patch: Record<string, unknown> = {};
  for (const key of writeKeys) patch[key] = transformedFields[key];

  return { transformedFields, changedKeys, patch };
}
