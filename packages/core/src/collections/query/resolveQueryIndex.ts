import type { GenericDocument } from "convex/server";

import type { VexConfig } from "../../config";
import { resolveCollectionIndexes, type ResolvedCollectionIndex } from "../resolveCollectionIndexes";
import { VexError } from "../../errors";
import { CRUD_ACTIONS, hasPermission, isFieldAllowed, PERMISSION_SCOPES, resolveFieldPermissions, VexAccessError } from "../../access";
import type { VexAccessConfig } from "../../access";
import type { VexApiAuth } from "../../db/types";
import type { CollectionTableSort } from "../types";
import type { VexWhereNode } from "../../db/queryArgs";
import { queryConstraintsToConvexIndexRange } from "../../access/compileQueryConstraints";
import type { ConvexQueryIndexRangeFn } from "../../access/convexTypes";

/**
 * {@link resolveQueryIndex}'s result — the one index `find` feeds into its
 * existing `pickConvexQueryIndex` arbitration, plus the `where` left over
 * once Decision 36's equality pushdown has removed whatever it pushed into
 * the index's own range.
 */
export interface ResolvedQueryIndex<S extends string = string> {
  /** The index to apply, or `undefined` for an unnarrowed scan. */
  indexName?: string;
  /**
   * Range covering the equalities pushed from `where`'s top-level `and`
   * part, in `indexName`'s field order. `undefined` when nothing was
   * pushed — `indexName` alone still orders the scan.
   */
  range?: ConvexQueryIndexRangeFn;
  /** The `.order()` to apply. */
  order: "asc" | "desc";
  /**
   * `where`, minus the parts `range` already covers. `find` compiles THIS
   * (not the original `where`) into its `.filter()` — re-checking a pushed
   * equality there would be redundant. Identical to the input `where` when
   * nothing was pushed.
   */
  remainder?: VexWhereNode<S>;
}

/**
 * Resolves a portable `{ field, order }` sort to the Convex index that
 * serves it, pushing down any `where` equalities that index's leading
 * fields can absorb (Design Decision 36). Clients — URLs, saved views,
 * `find` callers — still never name an index directly (Design Decision 5).
 *
 * Pushdown only runs when `sort` is supplied — list views always send
 * `defaultView.sort` (Decisions 4/9/45), and a sort-less call is rare enough that
 * a plain no-index passthrough (pure insertion-order scan) is simpler
 * than reasoning about what "ascending" means once an index picks
 * the enumeration order.
 *
 * `_creationTime` needs no index of its own: Convex's default `.order()`
 * already walks it, so a `_creationTime` sort may ONLY use an index that
 * is FULLY consumed by `where` equalities — any field the index declares
 * past the matched prefix would otherwise reorder the scan by that field
 * instead of creation time. A non-`_creationTime` sort instead requires
 * the matched equality prefix to be followed IMMEDIATELY by `sort.field`
 * in the SAME index (Decision 36's "leading fields matched by equalities …
 * followed by the sort field") — the degenerate zero-equality case
 * (`fields[0] === sort.field`) included.
 *
 * Only `eq` conditions in `where`'s TOP-LEVEL `and` part (or a single
 * unwrapped condition, treated as one) are eligible — an `or` group, a
 * `not`, a nested `and`, or a `gt`/`gte`/`lt`/`lte` comparison can never be
 * pushed, matching Decision 36's "Everything else stays in `.filter()`"
 * examples (OR groups, ranges, a sort incompatible with the index).
 *
 * Before any of this, a non-`_creationTime` `sort.field` is checked for
 * read access: sort order alone would leak a hidden field's values (Design
 * Decision 26). The check only runs when `props.access` is supplied —
 * `find` passes the SAME resolved `access`/`auth`/`action` it uses for
 * `readableDocuments`, so a bypassed or unconfigured read (both resolve
 * `access` to `undefined`) stays permissive here too.
 *
 * Access-rule index precedence (`pickConvexQueryIndex`) is unaffected —
 * this function only ever resolves the CALLER's half of the index slot;
 * arbitration against an access-contributed index happens exactly as
 * before, one layer up in `find/server.ts`.
 *
 * @param props - Input props.
 * @param props.config - The resolved `VexConfig`, to look up `collection`'s
 *   fields and indexes. Omitted (a bypassed caller) resolves permissively:
 *   `sort.order` passes through with no `indexName`, and `where` passes
 *   through unpushed as `remainder` — the same posture `whereFieldNames` /
 *   `requiresPublishedOnly` take when `config` is absent.
 * @param props.collection - The collection slug being queried.
 * @param props.where - The caller's plain `where`, for pushdown. Builder
 *   callbacks are not pushable (there is nothing to deep-match equalities
 *   against); `find` only forwards the plain-node form here.
 * @param props.sort - The portable sort. `undefined` resolves to
 *   `{ order: "asc" }` with no index and no pushdown — today's default
 *   insertion order, unchanged by a `where` that happens to be present.
 * @param props.drafts - The caller's EFFECTIVE `drafts` intent (`find`
 *   passes `resolveReadCall`'s `wantsDrafts`, not the raw `args.drafts`),
 *   used only to break a tie between multiple same-prefix-length indexes.
 * @param props.access - Resolved access config from `resolveReadCall`;
 *   `undefined` (bypassed/unconfigured) skips the field-read check on
 *   `sort.field` entirely.
 * @param props.auth - The caller, for the field-permission role walk.
 * @param props.action - The read action the field-read check runs under
 *   (`"read"` or `DRAFT_ACTIONS.readDrafts`, whichever `resolveReadCall`
 *   resolved). Defaults to `CRUD_ACTIONS.read`.
 * @param props.resource - The permission subject for the field-read check.
 *   Defaults to `collection`.
 * @returns See {@link ResolvedQueryIndex}.
 * @throws {VexAccessError} When `props.access` is set and the caller cannot
 *   read `sort.field`.
 * @throws {VexError} `code: "UNINDEXED_SORT"` when `sort.field` is set, is
 *   not `"_creationTime"`, and no declared index can serve it — at ANY
 *   equality prefix, including the empty one. Names the field and the
 *   index to declare; mirrors `defineCollection`'s config-time message for
 *   the same condition (`validateSavedListViewConfig`, Design Decision 6).
 */
export function resolveQueryIndex<S extends string = string>(props: {
  config?: VexConfig;
  collection: string;
  where?: VexWhereNode<S>;
  sort?: CollectionTableSort<string>;
  drafts?: boolean;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
  action?: string;
  resource?: string;
}): ResolvedQueryIndex<S> {
  const { sort } = props;
  if (sort === undefined) {
    return { order: "asc", remainder: props.where };
  }

  let requireFullConsumption: boolean;
  if (sort.field === "_creationTime") {
    requireFullConsumption = true;
  } else {
    // A caller who may read SOME documents of this collection but not THIS
    // field gets a hard reject (Design Decision 26). A caller denied the
    // whole read action (a flat `false`/predicate, `scope: "any"` false)
    // is unaffected here — that denial is enforced as always, downstream,
    // by `readableDocuments`, which filters to an empty result rather than
    // throw; throwing here too would turn every deny-all sorted read into
    // an error instead of the established empty read.
    if (
      props.access !== undefined &&
      hasPermission({
        access: props.access,
        user: props.auth?.user ?? null,
        organization: props.auth?.organization,
        resource: props.resource ?? props.collection,
        action: props.action ?? CRUD_ACTIONS.read,
        scope: PERMISSION_SCOPES.any,
      })
    ) {
      const resolved = resolveFieldPermissions({
        access: props.access,
        user: props.auth?.user ?? null,
        organization: props.auth?.organization,
        resource: props.resource ?? props.collection,
        action: props.action ?? CRUD_ACTIONS.read,
        scope: PERMISSION_SCOPES.any,
      });
      if (!isFieldAllowed(resolved, sort.field)) {
        throw new VexAccessError({
          resource: props.resource ?? props.collection,
          action: props.action ?? CRUD_ACTIONS.read,
          field: sort.field,
          message: `sort.field "${sort.field}" is not readable on collection "${props.collection}".`,
        });
      }
    }
    requireFullConsumption = false;
  }

  const collection = props.config?.collections.find((c) => c.slug === props.collection);
  if (collection === undefined) {
    return { order: sort.order, remainder: props.where };
  }

  const indexes = resolveCollectionIndexes({ collection });

  const parts: VexWhereNode<S>[] =
    props.where === undefined ? [] : "and" in props.where ? [...props.where.and] : [props.where];

  const equalities = new Map<string, { value: unknown; part: VexWhereNode<S> }>();
  for (const part of parts) {
    if ("field" in part && part.op === "eq" && !equalities.has(part.field)) {
      equalities.set(part.field, { value: part.value, part });
    }
  }

  const prefixLenOf = (index: ResolvedCollectionIndex): number => {
    let len = 0;
    for (const field of index.fields) {
      if (!equalities.has(field)) break;
      len++;
    }
    return len;
  };

  const candidates = indexes
    .map((index) => ({ index, prefixLen: prefixLenOf(index) }))
    .filter(({ index, prefixLen }) =>
      requireFullConsumption
        ? prefixLen === index.fields.length && prefixLen > 0
        : index.fields[prefixLen] === sort.field,
    );

  if (candidates.length === 0) {
    if (requireFullConsumption) {
      return { order: sort.order, remainder: props.where };
    }
    throw new VexError({
      code: "UNINDEXED_SORT",
      collection: props.collection,
      field: sort.field,
      message: `sort.field "${sort.field}" leads no index on collection "${props.collection}" — declare index: "by_${sort.field}" on the field (or a collection-level indexes entry starting with it) to make it sortable.`,
    });
  }

  const maxPrefixLen = Math.max(...candidates.map((c) => c.prefixLen));
  const maxCandidates = candidates.filter((c) => c.prefixLen === maxPrefixLen);

  let winner: ResolvedCollectionIndex;
  if (maxCandidates.length === 1) {
    winner = maxCandidates[0]!.index;
  } else {
    const preferred =
      props.drafts === true
        ? maxCandidates.find((c) => c.index.draftStatus === "both")
        : maxCandidates.find((c) => c.index.draftStatus !== undefined);
    winner = (preferred ?? maxCandidates[0]!).index;
  }

  const matchedFields = winner.fields.slice(0, maxPrefixLen);
  const range: ConvexQueryIndexRangeFn | undefined =
    matchedFields.length === 0
      ? undefined
      : queryConstraintsToConvexIndexRange<GenericDocument>({
          constraints: matchedFields.map((field) => ({
            field,
            op: "eq" as const,
            value: equalities.get(field)!.value as never,
          })),
        });
  const consumedParts = new Set(matchedFields.map((field) => equalities.get(field)!.part));
  const remainingParts = parts.filter((part) => !consumedParts.has(part));
  const remainder: VexWhereNode<S> | undefined =
    remainingParts.length === 0
      ? undefined
      : remainingParts.length === 1
        ? remainingParts[0]
        : { and: remainingParts };

  return { indexName: winner.name, range, order: sort.order, remainder };
}
