"server only";

import { type DataModel } from "@convex/_generated/dataModel";
import { createGetAuth } from "@vexcms/better-auth";
import { vexServerApi } from "@vexcms/core/server";

import { TABLE_SLUG_ORGANIZATIONS, TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants";
import config from "~/vex.config";

export const { get, find, search, create, remove, update, globals } = vexServerApi<DataModel>({
  config,
  getAuth: createGetAuth({
    orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
    userCollectionSlug: TABLE_SLUG_USERS,
    sessionCollectionSlug: TABLE_SLUG_SESSIONS,
    resolveOrgs: true,
  }),
});
