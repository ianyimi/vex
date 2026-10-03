import type { GenericDataModel } from "convex/server";
import type { DocumentByGlobalSlug, GlobalSlug } from "../types/generated";
import type { BaseHookProps } from "../hooks";
import type { GlobalConfig } from "./types";

/** Arguments passed to a global's `beforeChange` hook. */
export interface GlobalBeforeChangeProps<
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
> extends BaseHookProps<TDataModel> {
  /** `"create"` on the global's first-ever save, `"update"` afterwards. */
  operation: "create" | "update";
  /** The merged user fields about to be validated and written. Return the (possibly transformed) document. */
  doc: DocumentByGlobalSlug<TGlobalSlug>;
  /** The resolved config of the global this write is running on. */
  global: GlobalConfig<{}, {}, TGlobalSlug>;
}

/**
 * Arguments passed to a global's `afterChange` hook.
 *
 * Fires for EVERY `vex_globals` row write of this global, draft rows
 * included — `newDoc.vex_status` (present when the global declares
 * `versions.drafts: true`) tells a draft save from a publish. `operation`
 * describes the ROW: the first Save Draft after a publish inserts a new
 * draft row, so it arrives as `"create"` even though the global existed.
 */
export interface GlobalAfterChangeProps<
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
> extends BaseHookProps<TDataModel> {
  operation: "create" | "update";
  /** The written `vex_globals` row's `_id`. */
  id: string;
  /** Flat document before the write (`flattenGlobalRow`), or `null` on insert. */
  oldDoc: DocumentByGlobalSlug<TGlobalSlug> | null;
  /** Flat document after the write (`flattenGlobalRow`). */
  newDoc: DocumentByGlobalSlug<TGlobalSlug>;
  /** The resolved config of the global this write ran on. */
  global: GlobalConfig<{}, {}, TGlobalSlug>;
}

/**
 * Lifecycle hooks for a global. `beforeChange` runs inline in the write
 * path (`prepareEdit`) and may reject by throwing. `afterChange` runs via
 * `convex-helpers` triggers after the write commits, through the builder
 * returned by `createVexMutations` — never for writes made through the raw
 * `_generated/server` builder, the dashboard, or `npx convex import`.
 */
export interface GlobalHooksInput<TGlobalSlug extends GlobalSlug = GlobalSlug> {
  beforeChange?<TDataModel extends GenericDataModel = GenericDataModel>(
    props: GlobalBeforeChangeProps<TGlobalSlug, TDataModel>,
  ): Promise<DocumentByGlobalSlug<TGlobalSlug>> | DocumentByGlobalSlug<TGlobalSlug>;
  afterChange?<TDataModel extends GenericDataModel = GenericDataModel>(
    props: GlobalAfterChangeProps<TGlobalSlug, TDataModel>,
  ): Promise<void> | void;
}

/** Resolved lifecycle hooks for a global, after defaults are applied. */
export type GlobalHooks<TGlobalSlug extends GlobalSlug = GlobalSlug> = GlobalHooksInput<TGlobalSlug>;

/**
 * Types a global's `beforeChange` hook against a real global and
 * `DataModel`. Mirrors `beforeChangeHook` (`collections/hooks.ts`).
 *
 * @param slug - The global slug constant (e.g. `GLOBAL_SLUG_SITE_SETTINGS`).
 * @param fn - The hook function, checked against the real types.
 * @returns The same function, re-typed to the global's `hooks.beforeChange` signature.
 */
export function globalBeforeChangeHook<
  TGlobalSlug extends GlobalSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TGlobalSlug,
  fn: (
    props: GlobalBeforeChangeProps<TGlobalSlug, TDataModel>,
  ) => Promise<DocumentByGlobalSlug<TGlobalSlug>> | DocumentByGlobalSlug<TGlobalSlug>,
): GlobalHooksInput<TGlobalSlug>["beforeChange"] {
  void slug;
  return fn as unknown as GlobalHooksInput<TGlobalSlug>["beforeChange"];
}

/**
 * Types a global's `afterChange` hook against a real global and
 * `DataModel`. Mirrors `afterChangeHook` (`collections/hooks.ts`).
 *
 * @param slug - The global slug constant.
 * @param fn - The hook function, checked against the real types.
 * @returns The same function, re-typed to the global's `hooks.afterChange` signature.
 */
export function globalAfterChangeHook<
  TGlobalSlug extends GlobalSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TGlobalSlug,
  fn: (props: GlobalAfterChangeProps<TGlobalSlug, TDataModel>) => Promise<void> | void,
): GlobalHooksInput<TGlobalSlug>["afterChange"] {
  void slug;
  return fn as unknown as GlobalHooksInput<TGlobalSlug>["afterChange"];
}
