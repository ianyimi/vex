import { DRAFT_ACTIONS, CRUD_ACTIONS, PERMISSION_SCOPES } from "./constants";
import { hasPermission } from "./hasPermission";
import { resolveAccessCall } from "./resolveAccessCall";
import type { VexAccessConfig } from "./types";
import type { AccessCallOptions, VexApiAuth } from "../db/types";
import type { VexConfig } from "../config";

/**
 * Resolves a collection READ call (`find`/`get`/`search`) that may ask for
 * drafts, applying the draft fallback every read shares.
 *
 * `drafts: true` only takes effect for a caller who may read drafts at all
 * (`readDrafts` at any scope — per-document draft rules still run in each
 * read's own per-row check). Anyone else silently gets the published-only
 * read, resolved under `read`, rather than an error or an empty result — the
 * same fallback `getGlobal` uses. That is what lets the admin views and
 * `NextAdminPage`'s prefetches always send `drafts: true` for a versioned
 * collection without knowing who is asking.
 *
 * @param props.config - The resolved `VexConfig`.
 * @param props.access - Per-call access overrides.
 * @param props.auth - The caller.
 * @param props.collection - The collection being read (the permission resource).
 * @param props.drafts - The caller's `drafts` arg.
 * @returns `resolveAccessCall`'s result for the action that applies, plus
 *   `wantsDrafts` — the EFFECTIVE drafts flag every downstream step must use
 *   instead of the raw `drafts` arg.
 */
export function resolveReadCall(props: {
  config?: VexConfig;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  collection: string;
  drafts?: boolean;
}): { access: VexAccessConfig | undefined; action: string; resource: string; wantsDrafts: boolean } {
  if (props.drafts === true) {
    const draftsCall = resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: DRAFT_ACTIONS.readDrafts as string,
      resource: props.collection,
    });
    // Bypass/unconfigured access resolves `access` to `undefined`: no RBAC, drafts allowed.
    const mayReadDrafts =
      draftsCall.access === undefined ||
      hasPermission({
        access: draftsCall.access,
        user: props.auth?.user ?? null,
        organization: props.auth?.organization,
        resource: draftsCall.resource,
        action: draftsCall.action,
        scope: PERMISSION_SCOPES.any,
      });
    if (mayReadDrafts) return { ...draftsCall, wantsDrafts: true };
  }
  return {
    ...resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: CRUD_ACTIONS.read as string,
      resource: props.collection,
    }),
    wantsDrafts: false,
  };
}
