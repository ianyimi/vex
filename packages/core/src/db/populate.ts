import { getAll } from "convex-helpers/server/relationships";
import type { GenericDataModel, GenericDocument, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";
import type { CollectionSlug } from "../types/generated";
import type { HiddenDocument, Populated, PopulateShape, VexApiAuth } from "./types";
import { isHiddenDocument } from "./isHiddenDocument";
import { VERSION_STATUSES, VERSION_SYSTEM_FIELDS } from "../versions/constants";
import type { VexConfig } from "../config";
import { convertCommitTsFieldsToMs, findCollectionConfig, resolveCollectionSlug } from "./documents";
import { ADMIN_FIELDS } from "../fields";
import { CRUD_ACTIONS, hasPermission, resolveFieldPermissions, stripDeniedFields } from "../access";
import type { VexAccessConfig } from "../access";

/**
 * Resolves the collection a populated relationship target's `id` belongs
 * to — used both to look up that collection's `commitTs` field keys below
 * AND as the `resource` a target's own read rule is checked against — a
 * non-throwing wrapper over `resolveCollectionSlug` (which hard-errors on an
 * unresolvable id, a stronger guarantee than populate needs: a target id
 * this function can't place just skips ms-conversion/RBAC, the same
 * graceful degrade `config` being entirely omitted already has).
 *
 * @returns The resolved `CollectionSlug`, or `undefined` when `id` can't be
 *   placed on any collection declared in `config`.
 */
function tryResolveTargetCollectionSlug<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config: VexConfig;
  id: GenericId<CollectionSlug>;
}): CollectionSlug | undefined {
  try {
    return resolveCollectionSlug(props);
  } catch {
    return undefined;
  }
}

/**
 * Walks `docs` and replaces each relationship field listed in `populate` with
 * the resolved target doc(s). Returns a shallow-copied array; original docs
 * are not mutated.
 *
 * Each target collection's own read rule (and field-permission map) is
 * applied exactly as a direct `get` on that collection would — resolved
 * ONCE per field per call (not once per row: every id a given field
 * references, across every doc in `docs`, shares one target collection and
 * one resolved read decision), then evaluated per target document since a
 * row-scoped rule reads that document's own data. A target the caller's
 * resolved read decision denies becomes a {@link HiddenDocument} placeholder
 * in its place; a target the caller may read, but not every field of,
 * keeps its denied fields stripped — same two outcomes a direct `get` on
 * the target collection would produce. `access` is the ALREADY-RESOLVED
 * config the top-level call itself checked against (`undefined` when RBAC
 * is unconfigured or the top-level call set `access.bypass: true`) — bypass
 * is never re-decided per target collection, it simply propagates: a
 * bypassed top-level call populates every target in full, exactly as
 * before this check existed.
 *
 * The `TPopulate` generic is the caller-supplied populate shape. The return
 * type `Populated<TCollectionSlug, TPopulate>[]` is what TypeScript sees at call sites
 * — the `as unknown as` cast at the bottom bridges runtime
 * `Record<string, unknown>[]` to the compile-time `Populated` shape. All
 * callers (`find`, `get`, `search` server functions) benefit without writing
 * their own casts.
 *
 * @param ctx - The Convex query context (any DataModel).
 * @param docs - Documents to populate.
 * @param populate - Relationship fields to resolve, optionally nested.
 * @param drafts - Is this request want to read drafts? default `false`
 * @param config - The resolved `VexConfig`, used only to look up a populated
 *   relationship target's `commitTs`-typed fields so their resolved
 *   `bigint` is converted to a plain ms `number` before the target doc is
 *   attached. Omitted (no conversion attempted) when the caller has no
 *   `config` to resolve field types from. Also required to resolve a
 *   target's own collection slug for the read-rule check below — omitted,
 *   RBAC is skipped the same way bypass skips it (nothing to check a rule
 *   against).
 * @param access - The top-level call's own ALREADY-RESOLVED access config
 *   (`resolveReadCall`/`resolveAccessCall`'s `access` return) — `undefined`
 *   when access is bypassed or unconfigured, which populates every target
 *   in full, same as before this check existed.
 * @param auth - The caller, forwarded from the top-level call. Unused when
 *   `access` is `undefined`.
 * @returns Same docs with relationship Id arrays replaced by Doc arrays (or
 *   {@link HiddenDocument} placeholders for a denied target), typed as
 *   `Populated<TCollectionSlug, TPopulate>[]`.
 */
export async function populateDocs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
>(
  ctx: GenericQueryCtx<DataModel>,
  docs: Record<string, unknown>[],
  populate: TPopulate,
  drafts?: boolean,
  config?: VexConfig,
  access?: VexAccessConfig,
  auth?: VexApiAuth,
): Promise<Populated<TCollectionSlug, TPopulate>[]> {
  const out: Record<string, unknown>[] = docs.map((doc) => ({ ...doc }));
  await populateContainers({
    ctx,
    containers: out,
    populate: populate as Record<string, unknown>,
    drafts,
    config,
    access,
    auth,
  });

  // Single cast: the runtime walk produces the correct shape that
  // Populated<TCollectionSlug, TPopulate>[] describes, but TypeScript can't verify
  // a mapped type transformation from a runtime Object.entries loop.
  return out as unknown as Populated<TCollectionSlug, TPopulate>[];
}

/**
 * Shared guts of `populateDocs`, generalized over "containers" rather than
 * top-level docs — the SAME function recurses into a `group()` object, a
 * `blocks()` block item, or an `array()` item, since each is just another
 * object some of whose keys may hold id arrays. Mutates `containers`
 * in place (every caller already owns a clone at this level — the public
 * `populateDocs` clones once at the top; nested callers below clone each
 * container object/array they pull out before mutating it).
 *
 * Detects a `variant()` field's own entry structurally —
 * `"discriminator" in opts && "variants" in opts` — rather than via a
 * `kind`-tagged check like the `record` branch above it: `opts` here is
 * `buildPopulateMapEntry`'s `{ kind: "variant", discriminator, variants }`
 * shape (`db/depth.ts`'s runtime equivalent), merged onto the caller's own
 * populate request before reaching this loop, and only a variant entry
 * carries both of these keys at once. {@link populateVariantContainer}'s
 * own doc comment covers where `discriminator`/`variants` come from and how
 * they route the recursion.
 *
 * @param props.containers - Container objects to populate, batched across
 *   every parent doc/block/array-item — the field-per-call batching
 *   `populateDocs`'s own doc comment describes applies at EVERY nesting
 *   level this way, never once per row.
 * @param props.populate - A `PopulateShape`-compatible object (or one of
 *   its nested container shapes) at this level.
 */
async function populateContainers<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  containers: Record<string, unknown>[];
  populate: Record<string, unknown>;
  drafts?: boolean;
  config?: VexConfig;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
}): Promise<void> {
  const { ctx, containers, populate, drafts, config, access, auth } = props;
  const user = auth?.user ?? null;
  const organization = auth?.organization;

  for (const [fieldKey, opts] of Object.entries(populate)) {
    if (typeof opts === "object" && opts !== null && (opts as { kind?: unknown }).kind === "record") {
      await populateRecordContainers({
        ctx,
        containers,
        fieldKey,
        opts: (opts as { populate: unknown }).populate,
        drafts,
        config,
        access,
        auth,
      });
      continue;
    }
    const isLeaf = opts === true || (typeof opts === "object" && opts !== null && "populate" in opts);
    if (!isLeaf) {
      if (typeof opts === "object" && opts !== null && "discriminator" in opts && "variants" in opts) {
        await populateVariantContainer({
          ctx,
          containers,
          fieldKey,
          discriminator: opts.discriminator as string,
          variants: opts.variants as Record<string, Record<string, unknown>>,
          drafts,
          config,
          access,
          auth,
        });
      } else if (typeof opts === "object" && opts !== null) {
        await populateNestedContainer({
          ctx,
          containers,
          fieldKey,
          opts: opts as Record<string, unknown>,
          drafts,
          config,
          access,
          auth,
        });
      }
      continue;
    }

    const idsByContainerIndex: unknown[][] = [];
    const scalarValueByContainerIndex = new Map<number, string>();
    const allIds: GenericId<CollectionSlug>[] = [];
    let hasArrayValue = false;
    for (let i = 0; i < containers.length; i++) {
      const value = containers[i][fieldKey];
      if (Array.isArray(value)) {
        hasArrayValue = true;
        idsByContainerIndex[i] = value;
        for (const id of value) allIds.push(id as GenericId<CollectionSlug>);
      } else if (typeof value === "string") {
        scalarValueByContainerIndex.set(i, value);
      }
    }
    if (!hasArrayValue && scalarValueByContainerIndex.size === 0) continue;

    const firstScalarValue =
      scalarValueByContainerIndex.size > 0 ? [...scalarValueByContainerIndex.values()][0] : undefined;
    let targetSlug: CollectionSlug | undefined;
    let commitTsKeys: string[] = [];
    const sampleId = allIds[0] ?? firstScalarValue;
    if (config && sampleId !== undefined) {
      targetSlug = tryResolveTargetCollectionSlug({ ctx, config, id: sampleId as GenericId<CollectionSlug> });
      const targetCollection = targetSlug
        ? findCollectionConfig({ config, slug: targetSlug })
        : undefined;
      if (targetCollection) {
        commitTsKeys = Object.entries(targetCollection.fields)
          .filter(([, f]) => f.type === ADMIN_FIELDS.commitTs.type)
          .map(([key]) => key);
      }
    }
    const resource = targetSlug;

    const scalarIdByContainerIndex = new Map<number, GenericId<CollectionSlug>>();
    const unvalidatedScalarIds: GenericId<CollectionSlug>[] = [];
    for (const [i, value] of scalarValueByContainerIndex) {
      if (targetSlug) {
        const normalized = ctx.db.normalizeId(targetSlug, value);
        if (normalized !== null) {
          scalarIdByContainerIndex.set(i, normalized as GenericId<CollectionSlug>);
          allIds.push(normalized as GenericId<CollectionSlug>);
        }
        continue;
      }
      const candidateId = value as GenericId<CollectionSlug>;
      scalarIdByContainerIndex.set(i, candidateId);
      unvalidatedScalarIds.push(candidateId);
    }

    const uniqueIds = [...new Set(allIds)];
    const uniqueUnvalidatedIds = [...new Set(unvalidatedScalarIds)];

    const fetched = uniqueIds.length > 0 ? await getAll(ctx.db, uniqueIds) : [];
    const fetchedUnvalidated = await Promise.all(
      uniqueUnvalidatedIds.map(async (id) => {
        try {
          return await ctx.db.get(id);
        } catch {
          return null;
        }
      }),
    );
    const idRawPairs: [GenericId<CollectionSlug>, unknown][] = [
      ...uniqueIds.map((id, i): [GenericId<CollectionSlug>, unknown] => [id, fetched[i]]),
      ...uniqueUnvalidatedIds.map((id, i): [GenericId<CollectionSlug>, unknown] => [id, fetchedUnvalidated[i]]),
    ];
    const processedById = new Map<string, Record<string, unknown> | HiddenDocument>();
    for (const [id, raw] of idRawPairs) {
      if (raw === null || raw === undefined) continue;

      if (!drafts) {
        const status = (raw as Record<string, unknown>)[VERSION_SYSTEM_FIELDS.status.slug];
        if (!(status === undefined || status === VERSION_STATUSES.published.key)) continue;
      }

      let resolved: Record<string, unknown> = raw as Record<string, unknown>;
      if (access !== undefined && resource !== undefined) {
        const allowed = hasPermission({
          access,
          user,
          organization,
          resource,
          action: CRUD_ACTIONS.read,
          data: resolved,
        });
        if (!allowed) {
          processedById.set(id, {
            _id: resolved._id as GenericId<CollectionSlug>,
            code: "ACCESS_DENIED",
            resource,
            action: "read",
          } satisfies HiddenDocument);
          continue;
        }
        resolved = stripDeniedFields(
          resolved,
          resolveFieldPermissions({
            access,
            user,
            organization,
            resource,
            action: CRUD_ACTIONS.read,
            data: resolved,
          }),
        );
      }
      if (commitTsKeys.length > 0) {
        resolved = convertCommitTsFieldsToMs({ doc: resolved as GenericDocument, keys: commitTsKeys });
      }
      processedById.set(id, resolved);
    }

    if (typeof opts === "object" && opts !== null && "populate" in opts && opts.populate) {
      const allowedDocs: Record<string, unknown>[] = [];
      for (const value of processedById.values()) {
        if (!isHiddenDocument(value)) allowedDocs.push(value);
      }
      if (allowedDocs.length > 0) {
        await populateContainers({
          ctx,
          containers: allowedDocs,
          populate: opts.populate as Record<string, unknown>,
          drafts,
          config,
          access,
          auth,
        });
      }
    }

    for (let i = 0; i < containers.length; i++) {
      const ids = idsByContainerIndex[i];
      if (ids) {
        containers[i][fieldKey] = ids
          .map((id) => processedById.get(id as string))
          .filter((value): value is Record<string, unknown> | HiddenDocument => value !== undefined);
        continue;
      }
      const scalarId = scalarIdByContainerIndex.get(i);
      if (scalarId !== undefined) {
        const resolved = processedById.get(scalarId as string);
        if (resolved !== undefined) containers[i][fieldKey] = resolved;
      }
    }
  }
}

/**
 * Routes a non-leaf populate entry (a plain object without its own
 * `populate` key) into the right nested recursion: a `blocks()` field's
 * value is an array of block objects — grouped by `blockType` and matched
 * against `opts`'s own block-slug keys — while a `group()` field's value
 * (or an `array()` field's own items) is populated directly against `opts`.
 *
 * Distinguishes the two purely from the DATA shape (presence of a
 * `blockType` string key on an array item), the same way the top-level
 * leaf pass resolves a target's collection from the id itself rather than
 * from static field config — `blockType` is a framework-injected,
 * always-present key on every block item (never user-definable on a
 * `blocks()` field), so a false negative is not possible; a `group()`
 * declaring its OWN field literally named `blockType` is the only way to
 * misroute, and is rejected by nothing today.
 *
 * Clones every container object (and, for an array value, the array
 * itself) it descends into before mutating it, so a parent container that
 * was not itself freshly cloned (true of a `group()`/array item pulled
 * straight off the ORIGINAL input doc) is never mutated in place.
 */
async function populateNestedContainer<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  containers: Record<string, unknown>[];
  fieldKey: string;
  opts: Record<string, unknown>;
  drafts?: boolean;
  config?: VexConfig;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
}): Promise<void> {
  const { ctx, containers, fieldKey, opts, drafts, config, access, auth } = props;
  const blockItemsByType = new Map<string, Record<string, unknown>[]>();
  const groupItems: Record<string, unknown>[] = [];
  let sawBlocks = false;

  for (const container of containers) {
    const value = container[fieldKey];
    if (Array.isArray(value)) {
      const clonedArray = value.map((item) =>
        typeof item === "object" && item !== null ? { ...(item as Record<string, unknown>) } : item,
      );
      container[fieldKey] = clonedArray;
      for (const item of clonedArray) {
        if (typeof item !== "object" || item === null) continue;
        const record = item as Record<string, unknown>;
        if (typeof record.blockType === "string") {
          sawBlocks = true;
          const bucket = blockItemsByType.get(record.blockType) ?? [];
          bucket.push(record);
          blockItemsByType.set(record.blockType, bucket);
        } else {
          groupItems.push(record);
        }
      }
    } else if (typeof value === "object" && value !== null) {
      const cloned = { ...(value as Record<string, unknown>) };
      container[fieldKey] = cloned;
      groupItems.push(cloned);
    }
  }

  if (sawBlocks) {
    for (const [blockType, blockOpts] of Object.entries(opts)) {
      if (typeof blockOpts !== "object" || blockOpts === null) continue;
      const items = blockItemsByType.get(blockType);
      if (!items || items.length === 0) continue;
      await populateContainers({
        ctx,
        containers: items,
        populate: blockOpts as Record<string, unknown>,
        drafts,
        config,
        access,
        auth,
      });
    }
  } else if (groupItems.length > 0) {
    await populateContainers({ ctx, containers: groupItems, populate: opts, drafts, config, access, auth });
  }
}

/**
 * Routes a DISCRIMINATED `variant()` field's populate entry — distinguished
 * from the generic `populateNestedContainer` dispatch (which recovers a
 * `blocks()` item's own type from its data-level `blockType` key) because a
 * variant's active branch is named by a CONFIGURABLE property (`discriminator`),
 * not a fixed framework key, so the discriminator name itself travels on the
 * populate-map entry (`buildPopulateMapEntry`'s `{ kind: "variant",
 * discriminator, variants }` shape, `db/depth.ts`'s runtime equivalent) and is
 * read back here.
 *
 * Buckets every container's OWN variant-field value (a single object, never
 * an array) by its discriminator value, then recurses `populateContainers`
 * once per bucket against that variant's own sub-populate shape — the same
 * batching-per-field, never-per-row discipline every other pass in this file
 * keeps.
 */
async function populateVariantContainer<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  containers: Record<string, unknown>[];
  fieldKey: string;
  discriminator: string;
  variants: Record<string, Record<string, unknown>>;
  drafts?: boolean;
  config?: VexConfig;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
}): Promise<void> {
  const { ctx, containers, fieldKey, discriminator, variants, drafts, config, access, auth } = props;
  const byVariantKey = new Map<string, Record<string, unknown>[]>();

  for (const container of containers) {
    const value = container[fieldKey];
    if (typeof value !== "object" || value === null) continue;
    const key = (value as Record<string, unknown>)[discriminator];
    if (typeof key !== "string" || !(key in variants)) continue;
    const cloned = { ...(value as Record<string, unknown>) };
    container[fieldKey] = cloned;
    const bucket = byVariantKey.get(key) ?? [];
    bucket.push(cloned);
    byVariantKey.set(key, bucket);
  }

  for (const [key, variantPopulate] of Object.entries(variants)) {
    const items = byVariantKey.get(key);
    if (!items || items.length === 0) continue;
    await populateContainers({ ctx, containers: items, populate: variantPopulate, drafts, config, access, auth });
  }
}

/**
 * Populates one keyValue field's record entries — `container[fieldKey]` is a
 * `Record<string, unknown>`, one entry per record key, each independently
 * populatable per `opts` (the record's shared value field's own depth-populate
 * result: `true`, `{ populate }`, a plain container object, or a nested
 * `{ kind: "record", populate }`).
 *
 * Clones every container's record object before mutating it, same
 * convention as `populateNestedContainer`. Flattens every (container, key)
 * pair into one synthetic one-column container (`{ __value: entryValue }`)
 * so the existing `populateContainers` dispatch — leaf id batching, nested
 * container recursion, or a further `kind: "record"` level — runs UNCHANGED
 * against `{ __value: opts }`, then writes each resolved `__value` back onto
 * its own record entry.
 */
async function populateRecordContainers<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  containers: Record<string, unknown>[];
  fieldKey: string;
  opts: unknown;
  drafts?: boolean;
  config?: VexConfig;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
}): Promise<void> {
  const { ctx, containers, fieldKey, opts, drafts, config, access, auth } = props;
  const entries: { container: Record<string, unknown>; key: string }[] = [];
  const synthetic: Record<string, unknown>[] = [];

  for (const container of containers) {
    const record = container[fieldKey];
    if (typeof record !== "object" || record === null) continue;
    const cloned: Record<string, unknown> = { ...(record as Record<string, unknown>) };
    container[fieldKey] = cloned;
    for (const key of Object.keys(cloned)) {
      entries.push({ container: cloned, key });
      synthetic.push({ __value: cloned[key] });
    }
  }
  if (synthetic.length === 0) return;

  await populateContainers({
    ctx,
    containers: synthetic,
    populate: { __value: opts },
    drafts,
    config,
    access,
    auth,
  });

  for (let i = 0; i < entries.length; i++) {
    entries[i]!.container[entries[i]!.key] = synthetic[i]!.__value;
  }
}
