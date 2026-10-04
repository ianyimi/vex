import { mediaApi } from "@vexcms/core";

import config from "~/vex.config.server";

import { query } from "../_generated/server";
import { getAuth, vexMutation as mutation } from "../vex";

export const { getUrl, generateUploadUrl, createMediaDocument, deleteMedia } = mediaApi({
  config,
  query,
  mutation,
  getAuth,
});
