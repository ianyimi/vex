import { createGetAuth } from "@vexcms/better-auth";
import { mediaApi } from "@vexcms/core";

import { TABLE_SLUG_ORGANIZATIONS, TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants";
import config from "~/vex.config";

import { mutation, query } from "../_generated/server";

export const { getUrl, generateUploadUrl, createMediaDocument, deleteMedia } = mediaApi({
  config,
  query,
  mutation,
  getAuth: createGetAuth({
    orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
    userCollectionSlug: TABLE_SLUG_USERS,
    sessionCollectionSlug: TABLE_SLUG_SESSIONS,
    resolveOrgs: true,
  }),
});
