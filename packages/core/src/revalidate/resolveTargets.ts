import type { CrudWriteAction } from "../access";
import type { VexRouteMapper } from "../routes";
import type { VexDocument } from "../api/convex";
import type { CollectionSlug } from "../types";
import type {
  ResolveTargetsResult,
} from "./types";

/** Input to {@link resolveTargets}. */
export interface ResolveTargetsProps {
  /** Document state after the write. Omit for `"delete"`. */
  after?: Partial<VexDocument>;
  /** Document state before the write. Omit for `"create"`. */
  before?: Partial<VexDocument>;
  /** Slug of the collection the write occurred against. */
  collection: CollectionSlug;
  /** The project's route map, from `vex.config.ts`'s `routes.map`. */
  map: VexRouteMapper;
  /** CRUD operation that triggered the write. */
  operation: CrudWriteAction;
}

/**
 * Resolves the deduped, order-stable list of public paths to purge for a single
 * document write, plus any route-route-map failures.
 *
 * The one framework-agnostic piece of the revalidation feature — pure, no I/O —
 * so a future TanStack adapter and a possible later server-side dispatch
 * inherit identical semantics.
 *
 * @param props - The write description and the project's route map.
 * @returns The deduped paths to purge, plus any mapper errors. Never throws —
 *   a route-map failure is captured in `errors`, not propagated, because a broken
 *   route map must never block a save.
 *
 * @example
 * ```ts
 * // Slug rename: "/about" -> "/company" — BOTH paths come back so the old
 * // URL never serves stale content.
 * resolveTargets({
 *   map,
 *   collection: "pages",
 *   operation: "update",
 *   before: { _id: "1", _creationTime: 0, slug: "about" },
 *   after: { _id: "1", _creationTime: 0, slug: "company" },
 * });
 * // → { paths: ["/about", "/company"], errors: [] }
 * ```
 */
export function resolveTargets(props: ResolveTargetsProps): ResolveTargetsResult {
  // An update maps BOTH states, so a route map-output change (a slug rename) also
  // purges the stale old path. Order is before-then-after, which the dedupe
  // below preserves.
  const docs: (Partial<VexDocument> | undefined)[] =
    props.operation === "create"
      ? [props.after]
      : props.operation === "delete"
        ? [props.before]
        : [props.before, props.after];

  const pool: string[] = [];
  const errors: unknown[] = [];

  for (const doc of docs) {
    if (doc === undefined) {
      continue;
    }
    try {
      pool.push(...props.map({ collection: props.collection, doc }));
    } catch (error) {
      // One failing call must not abort the others: a rename whose `after`
      // the map throws should still purge the `before` path.
      errors.push(error);
    }
  }

  // Insertion-ordered dedupe, not a sort — callers and tests rely on
  // before-then-after ordering.
  return { errors, paths: [...new Set(pool)] };
}
