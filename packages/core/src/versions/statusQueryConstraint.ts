import type { VexConfig } from "../config";
import { resolveCollectionIndexes } from "../collections/resolveCollectionIndexes";
import { queryConstraintsToConvexFilter } from "../access/compileQueryConstraints";
import { composeConvexQueryRanges } from "../access/pickConvexQueryIndex";
import type { ConvexQueryFilterFn, ConvexQueryIndexRangeFn, ConvexQueryIndex } from "../access/convexTypes";
import { createQueryIndexConstraintBuilder, readQueryIndexConstraints } from "../access";
import { VERSION_STATUSES } from "./constants";

/**
 * Decides whether a query against `collection` must be narrowed to
 * published-only rows.
 *
 * Purely a data-integrity question — see {@link composeStatusQueryConstraint} for
 * why the narrowing it drives runs independently of `access.bypass`. `false`
 * for a non-versioned collection (nothing to narrow), for a caller
 * explicitly requesting drafts, or when `config` wasn't supplied.
 *
 * @param props - Input props.
 * @param props.config - The resolved `VexConfig`, to look up `collection`'s
 *   `versions`.
 * @param props.collection - The collection slug being queried.
 * @param props.drafts - The caller's `drafts` arg (`FindServerArgs.drafts` /
 *   `GetServerArgs.drafts` / `SearchServerArgs.drafts` — one contract,
 *   shared).
 * @returns `true` when the published-only constraint must apply.
 */
export function requiresPublishedOnly(props: {
  config?: VexConfig;
  collection: string;
  drafts?: boolean;
}): boolean {
  if (props.drafts === true) return false;
  const collection = props.config?.collections.find((c) => c.slug === props.collection);
  return collection?.versions?.drafts === true;
}

/**
 * Looks up the `draftStatus` a project declared on one of `collection`'s
 * indexes. Reads the index `resolveCollectionIndexes` resolved under that
 * name, so the precedence matches the schema.
 *
 * `defineCollection` already rejects a `draftStatus`/`index.draftStatus`
 * declared without `versions.drafts: true` (`collections/config.ts`), so
 * finding one here always means the collection is genuinely versioned —
 * this function does not re-check `versions.drafts` itself.
 *
 * @returns true | "both" | undefined
 * @internal
 */
function resolveIndexDraftStatus(props: {
  config?: VexConfig;
  collection: string;
  indexName: string;
}): true | "both" | undefined {
  const collection = props.config?.collections.find((c) => c.slug === props.collection);
  if (!collection) return undefined;
  return resolveCollectionIndexes({ collection }).find((index) => index.name === props.indexName)?.draftStatus;
}

/**
 * Physical name of a `draftStatus` index's `vex_status`-prefixed twin.
 * Deterministic — any caller holding `indexName` can derive it without a
 * lookup — and never a selectable `IndexNameFor` member: `resolveCollectionIndexes`
 * never emits it, identical treatment to the system `by_
 * status`/`by_published` indexes.
 * @param indexName the name of the convex index
 * @returns new indexName with the draftStatus
 * @internal
 */
function draftStatusTwinName(indexName: string): string {
  return `${indexName}__draftStatus`;
}

const warnedMissingDraftStatusIndex = new Set<string>();

/**
 * Warns once per (collection, index) pair that a published-only read fell
 * back to `.filter()` because the winning index declares no `draftStatus`.
 * Dev-only, modeled on `pickConvexQueryIndex`'s `warnDisplacedAccessIndex`.
 * @internal
 */
function warnMissingDraftStatusIndex(props: { collection: string; indexName: string }): void {
  if (process.env.NODE_ENV === "production") return;
  const key = `${props.collection}\u0000${props.indexName}`;
  if (warnedMissingDraftStatusIndex.has(key)) return;
  warnedMissingDraftStatusIndex.add(key);
  console.warn(
    `[vexcms] "${props.collection}" read through index "${props.indexName}" for a ` +
      `published-only query, but that index declares no draftStatus — the status condition ` +
      `fell back to .filter(), scanning every row the index returns instead of narrowing to ` +
      `published rows. Declare { draftStatus: true } (or "both") on this index to narrow the read.`,
  );
}

const warnedFilteredDraftStatusIndex = new Set<string>();

/**
 * Warns once per (collection, index) pair that a `drafts: true` read fell
 * back to `.filter()` because the winning index declares `draftStatus:
 * true` — only its `vex_status`-prefixed physical form exists, so this read
 * cannot narrow through it. Dev-only.
 * @internal
 */
function warnFilteredDraftStatusIndex(props: { collection: string; indexName: string }): void {
  if (process.env.NODE_ENV === "production") return;
  const key = `${props.collection}\u0000${props.indexName}`;
  if (warnedFilteredDraftStatusIndex.has(key)) return;
  warnedFilteredDraftStatusIndex.add(key);
  console.warn(
    `[vexcms] "${props.collection}" read through index "${props.indexName}" with drafts: ` +
      `true, but that index declares { draftStatus: true } — only its vex_status-prefixed ` +
      `physical form exists, so this read cannot narrow through it. The RBAC/caller range ` +
      `fell back to .filter(). Declare { draftStatus: "both" } to keep both read modes ` +
      `index-narrowed.`,
  );
}

/**
 * Folds the framework's published/draft status composition onto whatever
 * `resolveQueryIndex` / `pickConvexQueryIndex` / `resolveQueryConstraint`
 * already resolved for the caller's RBAC rule, honoring Convex's
 * one-`withIndex`-per-query limit AND, when the winning index declares a
 * `draftStatus` (Step 13's per-index config), the one-physical-field-order
 * limit a `vex_status`-prefixed index imposes.
 *
 * Never a permission rule. The published-only half runs whenever
 * `requiresPublishedOnly` says so, including when the caller bypassed RBAC
 * entirely (`props.resolvedIndex`/`props.accessFilter` may both be
 * `undefined` in that case) — hiding non-published rows on a versioned
 * collection is data integrity (design-review.md §3.1), not authorization,
 * so it has no dependency on `access.bypass` at all. MUST run AFTER
 * `pickConvexQueryIndex` — every branch reads `props.resolvedIndex.name` to look
 * up THAT index's own `draftStatus`, never the collection's in the
 * abstract.
 *
 * Four cases, crossing "does this read want published-only or everything"
 * with "does the winning index declare a draftStatus" — see the Why above
 * for the full worked reasoning per case:
 *
 * 1. Published-only, no draftStatus on the winning index (or none chosen) —
 *    unchanged original design: claim the free `by_status` slot, or fold
 *    `vex_status === "published"` into `.filter()`. Warns once when an
 *    index WAS chosen but declares no draftStatus.
 * 2. Published-only, winning index HAS a draftStatus — rides the SAME
 *    (prefixed) physical index for free via `composeConvexQueryRanges`. No `.filter()`.
 * 3. `drafts: true`, winning index has `draftStatus: "both"` — the
 *    unprefixed physical index already exists untouched; no-op.
 * 4. `drafts: true`, winning index has `draftStatus: true` — no unprefixed
 *    physical form exists; drop the range and re-apply it as a `.filter()`
 *    ANDed with `accessFilter`. Warns once, suggesting `"both"`.
 *
 * @param props - Input props.
 * @param props.config - The resolved `VexConfig`.
 * @param props.collection - The collection slug being queried.
 * @param props.drafts - The caller's `drafts` arg.
 * @param props.resolvedIndex - `pickConvexQueryIndex({ accessIndex, callerIndex
 *   })`'s output, computed BEFORE this function runs.
 * @param props.accessFilter - The RBAC filter `resolveQueryConstraint`
 *   already resolved for `resolvedIndex` as arbitrated (the SAME
 *   `indexAlreadyApplied` the caller already used).
 * @returns The index to apply and the filter to apply.
 */
export function composeStatusQueryConstraint(props: {
  config?: VexConfig;
  collection: string;
  drafts?: boolean;
  resolvedIndex: ConvexQueryIndex | undefined;
  accessFilter: ConvexQueryFilterFn | undefined;
}): {
  resolvedIndex: ConvexQueryIndex | undefined;
  accessFilter: ConvexQueryFilterFn | undefined;
} {
  const publishedOnly = requiresPublishedOnly({
    config: props.config,
    collection: props.collection,
    drafts: props.drafts,
  });
  const draftStatus = props.resolvedIndex
    ? resolveIndexDraftStatus({
        config: props.config,
        collection: props.collection,
        indexName: props.resolvedIndex.name,
      })
    : undefined;
  const publishedRange: ConvexQueryIndexRangeFn = (q) => q.eq("vex_status", VERSION_STATUSES.published.key);

  if (publishedOnly) {
    if (draftStatus === undefined) {
      if (props.resolvedIndex === undefined) {
        return {
          resolvedIndex: { name: "by_status", range: publishedRange },
          accessFilter: props.accessFilter,
        };
      }
      warnMissingDraftStatusIndex({
        collection: props.collection,
        indexName: props.resolvedIndex.name,
      });
      const statusFilter: ConvexQueryFilterFn = (q) =>
        q.eq(q.field("vex_status"), VERSION_STATUSES.published.key);
      return {
        resolvedIndex: props.resolvedIndex,
        accessFilter: props.accessFilter
          ? (q) => q.and(props.accessFilter!(q), statusFilter(q))
          : statusFilter,
      };
    }
    const physicalName =
      draftStatus === "both"
        ? draftStatusTwinName(props.resolvedIndex!.name)
        : props.resolvedIndex!.name;
    return {
      resolvedIndex: {
        name: physicalName,
        range: composeConvexQueryRanges({ first: publishedRange, second: props.resolvedIndex!.range }),
      },
      accessFilter: props.accessFilter,
    };
  }

  if (draftStatus === "both" || draftStatus === undefined) {
    return { resolvedIndex: props.resolvedIndex, accessFilter: props.accessFilter };
  }

  // draftStatus === true, drafts: true: only the prefixed physical index
  // exists under `name`, so the range cannot ride it. Whatever that range
  // carried must move to `.filter()`: the access rule's constraints (omitted
  // from `accessFilter` because the access index won), the caller's own
  // `withIndex` range (when the caller's index won), or both merged (same
  // name). Compiling the dropped range itself covers all three — recomputing
  // only the RBAC constraint would silently lose a caller range.
  warnFilteredDraftStatusIndex({
    collection: props.collection,
    indexName: props.resolvedIndex!.name,
  });
  const rangeFilter = rangeToFilter(props.resolvedIndex!.range);
  return {
    resolvedIndex: { name: props.resolvedIndex!.name, range: undefined },
    accessFilter:
      props.accessFilter && rangeFilter
        ? (q) => q.and(props.accessFilter!(q), rangeFilter(q))
        : (props.accessFilter ?? rangeFilter),
  };
}

/**
 * Re-expresses an index range as an equivalent `.filter()` predicate, for a
 * query that can no longer push the range into `.withIndex()`. Runs the range
 * against a recording builder and compiles the recorded constraints — the same
 * two compile targets access rules use, so both agree by construction.
 *
 * @param range - The range to convert; `undefined` = unconstrained.
 * @returns A filter thunk, or `undefined` when the range constrains nothing.
 */
function rangeToFilter(range: ConvexQueryIndexRangeFn | undefined): ConvexQueryFilterFn | undefined {
  if (!range) return undefined;
  const recorded = range(createQueryIndexConstraintBuilder() as never);
  const constraints = readQueryIndexConstraints(recorded as never);
  if (constraints.length === 0) return undefined;
  return (q) => queryConstraintsToConvexFilter({ constraints, q });
}
