import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import type { CollectionSlug, DocumentByCollectionSlug } from "../types/generated";
import type { BaseHookProps } from "../hooks";
import { CollectionConfig } from "./types";

/**
 * Arguments passed to a collection's `beforeChange` hook.
 */
export interface BeforeChangeProps<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
> extends BaseHookProps<TDataModel> {
  operation: "create" | "update";
  doc: DocumentByCollectionSlug<TCollectionSlug>;
  /** The resolved config of the collection this write is running on. */
  collection: CollectionConfig<{}, {}, TCollectionSlug>;
}

/**
 * Arguments passed to a collection's `beforeDelete` hook.
 */
export interface BeforeDeleteProps<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
> extends BaseHookProps<TDataModel> {
  id: GenericId<TCollectionSlug>;
  doc: DocumentByCollectionSlug<TCollectionSlug>;
  /** The resolved config of the collection this delete is running on. */
  collection: CollectionConfig<{}, {}, TCollectionSlug>;
}

/**
 * Arguments passed to a collection's `afterChange` hook.
 */
export interface AfterChangeProps<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
> extends BaseHookProps<TDataModel> {
  operation: "create" | "update";
  id: GenericId<TCollectionSlug>;
  oldDoc: DocumentByCollectionSlug<TCollectionSlug> | null;
  newDoc: DocumentByCollectionSlug<TCollectionSlug>;
  /** The resolved config of the collection this write ran on. */
  collection: CollectionConfig<{}, {}, TCollectionSlug>;
}

/**
 * Arguments passed to a collection's `afterDelete` hook.
 */
export interface AfterDeleteProps<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
> extends BaseHookProps<TDataModel> {
  id: GenericId<TCollectionSlug>;
  oldDoc: DocumentByCollectionSlug<TCollectionSlug>;
  /** The resolved config of the collection this delete ran on. */
  collection: CollectionConfig<{}, {}, TCollectionSlug>;
}

/**
 * Lifecycle hooks for a collection. `beforeChange`/`beforeDelete` run inline
 * in the write path and may reject a write by throwing. `afterChange`/
 * `afterDelete` run via `convex-helpers` triggers, after the write commits,
 * through the mutation builder returned by `createVexMutations` — they never
 * run for a write made through the raw `_generated/server` builder, the
 * Convex dashboard, or `npx convex import`.
 *
 * Each method is generic over `TDataModel` (not fixed to the interface's own
 * type params) so a dispatch call site — `collection.hooks.beforeChange({
 * ctx: realCtx, ... })` — infers `TDataModel` fresh from the real `ctx` it
 * passes in, with no cast: `GenericMutationCtx<ConcreteDataModel>` is
 * otherwise not assignable to `GenericMutationCtx<GenericDataModel>` at all
 * (Convex's index-query builder is invariant across `DataModel`
 * instantiations), the same reason `validateFields` is generic over
 * `TDataModel` rather than fixed. Author a hook inline (contextual
 * typing — `hooks: { beforeChange: async ({ doc, ctx }) => ... }`) or via
 * `beforeChangeHook`/`beforeDeleteHook`/`afterChangeHook`/`afterDeleteHook`;
 * an extracted, explicitly-`BeforeChangeProps<...>`-annotated function is the
 * one authoring style this does NOT accept (its own `ctx` type is pinned to
 * `GenericDataModel`, not generic per assignment).
 */
export interface CollectionHooksInput<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  beforeChange?<TDataModel extends GenericDataModel = GenericDataModel>(
    props: BeforeChangeProps<TCollectionSlug, TDataModel>,
  ): Promise<DocumentByCollectionSlug<TCollectionSlug>> | DocumentByCollectionSlug<TCollectionSlug>;
  beforeDelete?<TDataModel extends GenericDataModel = GenericDataModel>(
    props: BeforeDeleteProps<TCollectionSlug, TDataModel>,
  ): Promise<void> | void;
  afterChange?<TDataModel extends GenericDataModel = GenericDataModel>(
    props: AfterChangeProps<TCollectionSlug, TDataModel>,
  ): Promise<void> | void;
  afterDelete?<TDataModel extends GenericDataModel = GenericDataModel>(
    props: AfterDeleteProps<TCollectionSlug, TDataModel>,
  ): Promise<void> | void;
}

/**
 * Resolved lifecycle hooks for a collection, after defaults are applied.
 */
export type CollectionHooks<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  CollectionHooksInput<TCollectionSlug>;

/**
 * Types a collection's `beforeChange` hook against a real collection,
 * `DataModel`, and resolved `CollectionConfig`, without touching
 * `BeforeChangeProps` directly. `TCollectionSlug` is inferred from `slug`;
 * supply `TDataModel` explicitly for a typed `ctx`.
 *
 * @param slug - The collection slug `doc`/`collection` should be typed as —
 *   pass the same constant the collection itself is `defineCollection({ slug })`-ed
 *   with (e.g. `TABLE_SLUG_PAGES`), not a fresh string literal, so a rename
 *   of one renames the other.
 * @param fn - The hook function, checked against the real types.
 * @returns The same function, re-typed to the collection's loose public `hooks.beforeChange` signature.
 */
export function beforeChangeHook<
  TCollectionSlug extends CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TCollectionSlug,
  fn: (
    props: BeforeChangeProps<TCollectionSlug, TDataModel>,
  ) =>
    | Promise<DocumentByCollectionSlug<TCollectionSlug>>
    | DocumentByCollectionSlug<TCollectionSlug>,
): CollectionHooksInput<TCollectionSlug>["beforeChange"] {
  void slug;
  return fn as unknown as CollectionHooksInput<TCollectionSlug>["beforeChange"];
}

/**
 * Types a collection's `beforeDelete` hook against a real collection,
 * `DataModel`, and resolved `CollectionConfig`. @see {@link beforeChangeHook}
 *
 * @param slug - The collection slug `doc`/`collection` should be typed as.
 * @param fn - The hook function, checked against the real types.
 * @returns The same function, re-typed to the collection's loose public `hooks.beforeDelete` signature.
 */
export function beforeDeleteHook<
  TCollectionSlug extends CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TCollectionSlug,
  fn: (props: BeforeDeleteProps<TCollectionSlug, TDataModel>) => Promise<void> | void,
): CollectionHooksInput<TCollectionSlug>["beforeDelete"] {
  void slug;
  return fn as unknown as CollectionHooksInput<TCollectionSlug>["beforeDelete"];
}

/**
 * Types a collection's `afterChange` hook against a real collection,
 * `DataModel`, and resolved `CollectionConfig`. @see {@link beforeChangeHook}
 *
 * @param slug - The collection slug `doc`s/`collection` should be typed as.
 * @param fn - The hook function, checked against the real types.
 * @returns The same function, re-typed to the collection's loose public `hooks.afterChange` signature.
 */
export function afterChangeHook<
  TCollectionSlug extends CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TCollectionSlug,
  fn: (props: AfterChangeProps<TCollectionSlug, TDataModel>) => Promise<void> | void,
): CollectionHooksInput<TCollectionSlug>["afterChange"] {
  void slug;
  return fn as unknown as CollectionHooksInput<TCollectionSlug>["afterChange"];
}

/**
 * Types a collection's `afterDelete` hook against a real collection,
 * `DataModel`, and resolved `CollectionConfig`. @see {@link beforeChangeHook}
 *
 * @param slug - The collection slug `doc`/`collection` should be typed as.
 * @param fn - The hook function, checked against the real types.
 * @returns The same function, re-typed to the collection's loose public `hooks.afterDelete` signature.
 */
export function afterDeleteHook<
  TCollectionSlug extends CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TCollectionSlug,
  fn: (props: AfterDeleteProps<TCollectionSlug, TDataModel>) => Promise<void> | void,
): CollectionHooksInput<TCollectionSlug>["afterDelete"] {
  void slug;
  return fn as unknown as CollectionHooksInput<TCollectionSlug>["afterDelete"];
}
