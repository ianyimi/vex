import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";
import type { CollectionSlug, VexApiAuth } from "@vexcms/core";

/**
 * Builds the `getAuth` resolver for `collectionsApi` from better-auth's
 * conventions — no per-app auth plumbing.
 *
 * Resolution chain, all from the validated JWT the `convex()` better-auth
 * plugin mints: `identity.subject` (user doc id) → user document;
 * `identity.sessionId` (appended to every token by the plugin) → session
 * document → `session.activeOrganizationId` → organization document.
 * Documents are read fresh on every request, so role changes and
 * `identity.sessionId` (appended to every token by the plugin) → session
 * document → `session.activeOrganizationId` → organization document.
 * Documents are read fresh on every request, so role changes and
 * org switches apply immediately — claims are only used as ids, never
 * as authorization data.
 *
 * @returns { user, organization }, @see {@link VexApiAuth}
 *
 */
export function createGetAuth<TCollectionSlug extends CollectionSlug = CollectionSlug>(props: {
  userCollectionSlug: TCollectionSlug;
  orgCollectionSlug: TCollectionSlug;
  sessionCollectionSlug: TCollectionSlug;
  resolveOrgs?: boolean;
}) {
  return async <DataModel extends GenericDataModel>(
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ): Promise<VexApiAuth> => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return { user: null }; // unauthenticated → downstream deny (no roles)
    }

    const user = await ctx.db.get(
      props.userCollectionSlug,
      identity.subject as GenericId<TCollectionSlug>,
    );
    if (user === null) {
      return { user }; // token for a deleted user → deny
    }

    if (!props.resolveOrgs) {
      return { user };
    }
    const sessionId = identity.sessionId as GenericId<TCollectionSlug> | undefined;
    const session = sessionId ? await ctx.db.get(props.sessionCollectionSlug, sessionId) : null;
    const orgId = session?.activeOrganizationId as GenericId<TCollectionSlug> | undefined;
    const organization = orgId
      ? ((await ctx.db.get(props.orgCollectionSlug, orgId)) ?? undefined)
      : undefined;

    return { user, organization };
  };
}
