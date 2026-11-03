import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "./types";
import type { TDocument } from "../documents/types";
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission } from "../access";
import { ADMIN_FIELDS, assignArrayItemIds, getFieldsInputSchema, validateFields } from "../fields";
import { resolveAccessCall } from "../access/resolveAccessCall";
import { toVexMutationCtx } from "./context";
import { valuesEqual } from "../utils/valuesEqual";
import { CollectionOrGlobal } from "../types";

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
  target: CollectionOrGlobal;
  /**
   * The permission action this write checks under. Also selects schema
   * strictness: `DRAFT_ACTIONS.saveDraft` builds the input schema with
   * `ignoreRequired: true` (`getFieldsInputSchema`) — a draft may leave a
   * required field empty at any nesting depth; every other action validates
   * `required` normally.
   */
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
  storedDoc?: TDocument | undefined;
  /**
   * The document's own id, attached as `_id` on the object passed to each
   * field's `validate()` (`validateFields`'s `doc` param) — `storedDoc`
   * itself is pre-stripped of `_id` by every caller before reaching here
   * (a draft/published row's own `toUserFields`/`removeVexFields`, or a
   * `vex_versions` snapshot, neither of which ever carries one; `update`'s
   * raw `ctx.db.get` result does, but `prepareEdit`'s own merge step below
   * destructures `_id` straight out of `storedDoc` and never forwards it
   * either way). Without this, a validator reading `doc._id` to exclude
   * the document's OWN row from a collision check (`assertUniqueAmongPublished`'s
   * documented pattern) always sees `undefined`, so it can never exclude
   * anything — the document then collides with its own row whenever that
   * field's `validate()` runs despite an unchanged value (`validateKeys:
   * "all"`, i.e. `publish`/`create`'s strict pass). `undefined` for a
   * brand-new `create` — nothing existing to exclude.
   */
  docId?: string;
  /** The caller's raw incoming payload — what `hasPermission`'s `changes` argument checks. */
  changes: Partial<TDocument>;
  /** `true` for lenient validation (`update`, `saveDraft` — a draft may be incomplete); `false` for strict, `create`-strength validation (`publish`). */
  partial?: boolean;
  /** Which fields get their `validate()` hook run: only what changed (`update`, `saveDraft`), or every field (`publish`, matching `create`). */
  validateKeys?: "changed" | "all";
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
      data: props.action === CRUD_ACTIONS.create ? props.changes : props.storedDoc,
      changes: props.changes,
    });
  }

  const { _id, _creationTime, ...fields } = props.storedDoc ?? {};
  const mergedFields = assignArrayItemIds({
    fields: props.target.config.fields,
    data: { ...fields, ...props.changes },
  }) as TDocument;

  const operation = props.action === CRUD_ACTIONS.create ? "create" : "update";
  const docForHooks = Object.fromEntries(
    Object.entries(mergedFields).filter(([key]) => {
      const fieldDef = props.target.config.fields[key];
      return fieldDef === undefined || fieldDef.type !== ADMIN_FIELDS.commitTs.type;
    }),
  ) as TDocument;
  let transformedFields = mergedFields;
  if (props.target.kind === "collection" && props.target.config.hooks.beforeChange) {
    transformedFields = (await props.target.config.hooks.beforeChange({
      operation,
      doc: docForHooks as never,
      ctx: props.ctx,
      commitTs: props.ctx.db.vars.commitTs,
      collection: props.target.config,
    })) as TDocument;
  } else if (props.target.kind === "global" && props.target.config.hooks.beforeChange) {
    transformedFields = (await props.target.config.hooks.beforeChange({
      operation,
      doc: docForHooks as never,
      ctx: props.ctx,
      commitTs: props.ctx.db.vars.commitTs,
      global: props.target.config,
    })) as TDocument;
  }

  const changedKeys = new Set(Object.keys(props.changes));
  for (const key of Object.keys(transformedFields)) {
    if (!valuesEqual(transformedFields[key], mergedFields[key])) changedKeys.add(key);
  }

  const parsed = getFieldsInputSchema({
    fields: props.target.config.fields,
    partial: props.partial ?? false,
    ignoreRequired: props.action === DRAFT_ACTIONS.saveDraft,
    data: transformedFields,
  }).safeParse(transformedFields);
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }

  const writeKeys =
    props.validateKeys === "changed" ? changedKeys : new Set(Object.keys(transformedFields));
  await validateFields({
    fields: props.target.config.fields,
    doc: (props.docId !== undefined
      ? { ...transformedFields, _id: props.docId }
      : transformedFields) as TDocument,
    keys: writeKeys,
    ctx: toVexMutationCtx(props.ctx),
    config: props.config,
  });

  const patch: Record<string, unknown> = {};
  for (const key of writeKeys) patch[key] = transformedFields[key];

  return { transformedFields, changedKeys, patch };
}
