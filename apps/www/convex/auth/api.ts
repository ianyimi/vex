import { get } from "@vexcms/core/server";

import { type SessionID, TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS, type UserID } from "~/db/constants";

import { query } from "../_generated/server";

export const identifyCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return ctx.auth.getUserIdentity();
  },
});

export const getUserOrg = query({
  args: {},
  handler: async (ctx) => {
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
    return { user, organization: undefined };
  },
});
