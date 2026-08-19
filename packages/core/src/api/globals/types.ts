import { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { VexConfig } from "../../config";
import { VexApiAuth } from "../types";

/**
 * Base server-side args shared by every globals **query** function
 * (`getGlobal`, `findGlobals`). Each concrete function extends this with its
 * own inputs (e.g. `slug`, `populate`, `depth`).
 *
 * The RBAC seam rides on `auth` + `config`: when `config.access` is set, the
 * function runs `hasPermission` for the global's slug using `auth.user` /
 * `auth.organization`. Resolved server-side by the `globalsApi` factory via
 * `resolveGetAuth(getAuth)` — never supplied by the client.
 *
 * @typeParam TDataModel - The project's generated Convex data model.
 */
export interface GenericGlobalsQueryServerArgs<TDataModel extends GenericDataModel> {
  /**
   * Resolved caller identity for permission checks — `{ user, organization? }`,
   * or omitted when access control is off. `user` may be `null` for an
   * unauthenticated caller (→ no roles → deny). Never a client argument;
   * the factory resolves it from `ctx.auth` per request.
   */
  auth?: VexApiAuth;
  /** Convex query context (read-only DB access). */
  ctx: GenericQueryCtx<TDataModel>;
  /**
   * The resolved `VexConfig`. Required — supplies `config.access` (the
   * permission matrix the guard enforces) and `config.globals` (used to
   * resolve the `GlobalConfig` for depth-populate and validation).
   */
  config: VexConfig;
}

/**
 * Base server-side args shared by every globals **mutation** function
 * (`upsertGlobal`). Mirrors {@link GenericGlobalsQueryServerArgs} but carries a
 * mutation context for writes.
 *
 * The RBAC seam is identical: when `config.access` is set, the function runs
 * `hasPermission` for the global's slug (write actions use `throwOnDenied`).
 *
 * @typeParam TDataModel - The project's generated Convex data model.
 */
export interface GenericGlobalsMutationServerArgs<TDataModel extends GenericDataModel> {
  /**
   * Resolved caller identity for permission checks — `{ user, organization? }`,
   * or omitted when access control is off. `user` may be `null` for an
   * unauthenticated caller (→ no roles → deny). Never a client argument;
   * the factory resolves it from `ctx.auth` per request.
   */
  auth?: VexApiAuth;
  /** Convex mutation context (read + write DB access). */
  ctx: GenericMutationCtx<TDataModel>;
  /**
   * The resolved `VexConfig`. Required — supplies `config.access` (the
   * permission matrix the guard enforces) and `config.globals` (used to
   * resolve the target `GlobalConfig` for input validation).
   */
  config: VexConfig;
}
