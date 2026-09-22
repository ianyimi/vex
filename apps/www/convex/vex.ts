import { createGetAuth } from "@vexcms/better-auth";
import { collectionsApi, createVexMutations } from "@vexcms/core/server";

import { TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants";
import config from "~/vex.config.server";

import { internalMutation, mutation, query } from "./_generated/server";

/**
 * Trigger-wrapped `mutation`/`internalMutation` builders — every write made
 * through them fires the written collection's `afterChange`/`afterDelete`
 * hooks (`@vexcms/core`'s `createVexMutations`). Used, not exported: this
 * file's own `create`/`update`/`remove` (below) and `globals.ts`/`media.ts`
 * build their mutations on `vexMutation`, never the raw builder above.
 */
export const { mutation: vexMutation, internalMutation: vexInternalMutation } = createVexMutations({
  config,
  mutation,
  internalMutation,
});

export const { find, get, search, create, update, remove, livePreviewUrl } = collectionsApi({
  config,
  query,
  mutation: vexMutation,
  getAuth: createGetAuth({
    userCollectionSlug: TABLE_SLUG_USERS,
    sessionCollectionSlug: TABLE_SLUG_SESSIONS,
    resolveOrgs: false,
  }),
});
