import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, MutationCallActionFor, VexApiAuth } from "../../db/types";

/**
 * Base server-side args shared by every versions **mutation** function scoped
 * to a collection slug — currently just `publish` (`unpublish` to follow).
 * `saveDraft` no longer uses this base: it accepts EITHER a collection
 * (`{ collection, id }`) or a global (`{ global }`) target, so its own args
 * type (`versions/saveDraft.server.ts`) is declared standalone. Mirrors
 * `GenericGlobalsMutationServerArgs` (`api/globals/types.ts`) but scoped to a
 * collection slug, with one deliberate difference: `config` is optional
 * here, matching `GenericQueryServerParams`'s convention (`api/types.ts`)
 * rather than `GenericMutationServerParams`'s required one. A caller that
 * omits it still fails safely: every operation below resolves `collection`
 * via `args.config?.collections.find(...)`, so a missing `config` surfaces
 * through the exact same "no collection registered" `ConvexError` every
 * operation already throws for an unknown slug, rather than opening a second,
 * differently-worded failure mode.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface GenericVersionsMutationServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<MutationCallActionFor<TCollectionSlug>>;
  /**
   * Resolved caller identity for permission checks — `{ user, organization? }`,
   * or omitted when access control is off. Never a client argument; the
   * `versionsApi` factory (Step 9) resolves it from `ctx.auth` per request.
   */
  auth?: VexApiAuth;
  /** Discriminator: server args MUST supply a Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /**
   * The resolved `VexConfig`. Optional at the type level — see this interface's
   * docstring for why omitting it is never a silent no-op.
   */
  config?: VexConfig;
  /** The versioned collection slug this call targets. */
  collection: TCollectionSlug;
  /**
   * Reserved for a future multi-environment spec (see this spec's decision log).
   * Accepted and ignored by every versions operation today.
   */
  environmentId?: string;
}

/**
 * The `data` payload for `publish` — a partial patch against the target
 * collection's document shape, `_id`/`_creationTime` excluded. Identical in
 * shape to `UpdateServerArgs["data"]` (`api/update/server.ts`): publish is
 * "patch a document," never a distinct payload shape. `saveDraft` declares
 * its own plain `Record<string, unknown>` `data` instead, since it accepts
 * either a collection or a global target.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type VersionsDataInput<DataModel extends GenericDataModel> = Partial<
  Expand<
    BetterOmit<DocumentByName<DataModel, TableNamesInDataModel<DataModel>>, "_creationTime" | "_id">
  >
>;

/** Args for `api.vex.versions.saveDraft`. */
export type VexSaveDraftArgs = {
  [key: string]: unknown;
  auth?: VexApiAuth;
  data: Record<string, unknown>;
  restoredFrom?: number;
  environmentId?: string;
} & (
  | { collection: CollectionSlug; id: string }
  | {
      global: string;
    }
);

/** Args for `api.vex.versions.publish`. */
export type VexPublishArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      data?: Record<string, unknown>;
      version?: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      data?: Record<string, unknown>;
      version?: number;
      environmentId?: string;
    };

/** Args for `api.vex.versions.unpublish`. */
export type VexUnpublishArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      environmentId?: string;
    };

/** Args for `api.vex.versions.listVersions`. */
export type VexListVersionsArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      limit?: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      limit?: number;
      environmentId?: string;
    };

/** Args for `api.vex.versions.getVersionSnapshot`. */
export type VexGetVersionSnapshotArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      version: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      version: number;
      environmentId?: string;
    };

/** Args for `api.vex.versions.deleteVersion`. */
export type VexDeleteVersionArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      version: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      version: number;
      environmentId?: string;
    };
