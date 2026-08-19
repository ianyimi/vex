import { get } from "@vexcms/core/server";
import { v } from "convex/values";

import {
  type OrganizationID,
  type SessionID,
  TABLE_SLUG_ORGANIZATIONS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  type UserID,
} from "~/db/constants";

import { query } from "../_generated/server";

export const identifyCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return ctx.auth.getUserIdentity();
  },
});

export const getUserOrg = query({
  args: {
    noOrgs: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const empty = { user: null, organization: undefined };
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return empty;
    }
    const session = await get({
      ctx,
      id: identity.sessionId as SessionID,
      collection: TABLE_SLUG_SESSIONS,
    });
    if (!session) {
      return empty;
    }
    const user = await get({ ctx, id: identity.subject as UserID, collection: TABLE_SLUG_USERS });
    if (!user) {
      return empty;
    }
    if (!session.activeOrganizationId || args.noOrgs) {
      return { user, organization: undefined };
    }
    const organization = await get({
      ctx,
      id: session.activeOrganizationId as OrganizationID,
      collection: TABLE_SLUG_ORGANIZATIONS,
    });
    return { user, organization: organization ?? undefined };
  },
});
