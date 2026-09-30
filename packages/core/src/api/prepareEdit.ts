import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { CollectionConfig } from "../collections/types";
import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "./types";
import type { TDocument } from "./convex";
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission } from "../access";
import { getCollectionInputSchema, validateFields } from "../collections";
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
  /** The collection this write targets. Its `slug` is the permission resource. */
  collection: CollectionConfig;
  /** The permission action this write checks under (`CRUD_ACTIONS.update`, `DRAFT_ACTIONS.saveDraft`, `DRAFT_ACTIONS.publish`). */
  action:
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
 * `updatedAt` — those steps differ per caller (see this file's own docstring)
 * and stay in `update()`/`saveDraft()`/`publish()` themselves.
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
      resource: props.collection.slug,
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

  let transformedFields = mergedFields;
  if (props.collection.hooks?.beforeChange) {
    transformedFields = await props.collection.hooks.beforeChange({
      operation: "update",
      doc: mergedFields,
      ctx: props.ctx,
      collection: props.collection,
    });
  }

  const changedKeys = new Set(Object.keys(props.incoming));
  for (const key of Object.keys(transformedFields)) {
    if (!deepEqual(transformedFields[key], mergedFields[key])) changedKeys.add(key);
  }

  const parsed = getCollectionInputSchema({
    collection: props.collection,
    partial: props.partial,
  }).safeParse(transformedFields);
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }

  const writeKeys =
    props.validateKeys === "all" ? new Set(Object.keys(transformedFields)) : changedKeys;
  await validateFields({
    collection: props.collection,
    doc: transformedFields,
    keys: writeKeys,
    ctx: toVexMutationCtx(props.ctx),
    config: props.config,
  });

  const patch: Record<string, unknown> = {};
  for (const key of writeKeys) patch[key] = transformedFields[key];

  return { transformedFields, changedKeys, patch };
}
