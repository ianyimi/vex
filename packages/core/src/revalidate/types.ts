import type { VexDocument } from "../api/convex";
import type { CollectionSlug } from "../types";

/**
 * Which `vexConvexApi` mutation produced a write, as it travels on the wire.
 *
 * These are **API method names**, not CRUD actions — that is the whole reason
 * this type exists separately from {@link CrudWriteAction}. `vexConvexApi`
 * exposes `remove` and `globals.upsert`, so a client reports `"remove"` and
 * `"upsert"`; the route maps them to the CRUD vocabulary (`"delete"`,
 * `"update"`) exactly once, before either the permission check or target
 * resolution.
 *
 * Declared here rather than in `@vexcms/react` because it is part of the wire
 * contract that `@vexcms/react` (the client) and `@vexcms/next` (the route)
 * must agree on, and `@vexcms/core` is the lowest package both depend on
 * (P-010).
 */
export type VexMutationOperation = "create" | "remove" | "update" | "upsert";

/**
 * Result of `resolveTargets` — the deduped paths to purge for a single
 * document write, plus any route-mapper failures encountered while computing
 * them.
 *
 * `errors` is never thrown — a broken mapper must never block a save. Callers
 * (the revalidation route, a future server-side dispatch) decide how to
 * surface it.
 */
export interface ResolveTargetsResult {
  /**
   * Errors thrown by `mapper`, one per failed invocation. Empty when every call
   * to `mapper` succeeded.
   */
  errors: unknown[];
  /** Deduped, order-stable public paths to pass to `revalidatePath`. */
  paths: string[];
}

/**
 * One document's before/after pair for a single change in a revalidation
 * request. The wire-level counterpart to one `resolveTargets` call —
 * `@vexcms/next`'s route request types and `@vexcms/react`'s
 * `useVexMutation`/`useVexRevalidate` all consume this same shape, so it is
 * declared once here rather than once per consumer (P-010): `@vexcms/react`
 * cannot depend on `@vexcms/next`, and both depend on `@vexcms/core`.
 */
export interface VexRevalidateChange {
  /** State after the write. Omitted for `"remove"`. */
  after?: Partial<VexDocument>;
  /** State before the write. Omitted for `"create"`. */
  before?: Partial<VexDocument>;
}

/**
 * A document-scoped purge, sent by `useVexMutation` after a successful admin
 * panel write and by `useVexRevalidate` for the open document.
 *
 * `changes` carries one entry per affected document — a single-document write
 * sends one, a list-view bulk delete sends one per selected row — because
 * {@link resolveTargets} resolves paths per document and the route pools every
 * entry's result into one deduped list.
 */
export interface VexRevalidateDocumentsRequest {
  /**
   * One entry per affected document. Capped at {@link VEX_REVALIDATE_BATCH_SIZE}
   * — a larger batch is rejected with `413` before any mapper work runs, so a
   * "select all" bulk delete cannot force an unbounded loop over
   * {@link resolveTargets}.
   */
  changes: VexRevalidateChange[];
  /** The collection the write occurred on — also the `hasPermission` resource. */
  collection: CollectionSlug;
  /** The write operation — mapped once to the `hasPermission`/`resolveTargets` action. */
  operation: VexMutationOperation;
}

/**
 * A collection-wide purge, sent by `useVexRevalidate` from the list view.
 *
 * The route resolves paths by listing the collection server-side and running
 * the route mapper over each document, so it needs no document payload from the
 * client — which also means a client cannot ask for paths it has not been
 * authorized to see.
 */
export interface VexRevalidateCollectionRequest {
  /** Discriminant selecting the collection-wide branch. */
  all: true;
  /** The collection to purge — also the `hasPermission` resource. */
  collection: CollectionSlug;
}

/**
 * Request body accepted by the revalidation route.
 *
 * Declared here rather than in `@vexcms/next` because both ends of the wire
 * consume it: the route that parses it (`createVexRevalidateRoute`,
 * `@vexcms/next`) and the two hooks that build it (`useVexMutation`,
 * `useVexRevalidate`, `@vexcms/react`). Neither of those packages depends on
 * the other, so the contract lives in the one below both (P-010).
 */
export type VexRevalidateRequest =
  | VexRevalidateCollectionRequest
  | VexRevalidateDocumentsRequest;

/**
 * Response body returned by the revalidation route. Always HTTP 200 once the
 * caller is authorized — a populated `errors` never changes the status.
 */
export interface VexRevalidateResponse {
  /**
   * Errors from a throwing route mapper (surfaced via {@link resolveTargets}),
   * an unwired collection-wide purge, or a failed individual purge.
   */
  errors: unknown[];
  /** Paths that were successfully purged. */
  revalidated: string[];
}
