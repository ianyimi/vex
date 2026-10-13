import { versionsApi } from "@vexcms/core/server";

import config from "~/vex.config.server";

import { query } from "../_generated/server";
import { getAuth, vexMutation as mutation } from "../vex";

export const { saveDraft, publish, unpublish, listVersions, getVersionSnapshot, deleteVersion } =
  versionsApi({
    config,
    query,
    mutation,
    getAuth,
  });
