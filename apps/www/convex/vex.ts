import { createGetAuth } from "@vexcms/better-auth";
import { collectionsApi } from "@vexcms/core/server";

import { TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants";
import config from "~/vex.config";

import { mutation, query } from "./_generated/server";

export const { find, get, search, create, update, remove } = collectionsApi({
  config,
  query,
  mutation,
  getAuth: createGetAuth({
    userCollectionSlug: TABLE_SLUG_USERS,
    sessionCollectionSlug: TABLE_SLUG_SESSIONS,
    resolveOrgs: false,
  }),
});
