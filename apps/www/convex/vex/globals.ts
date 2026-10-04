import { globalsApi } from "@vexcms/core/server";

import config from "~/vex.config.server";

import { query } from "../_generated/server";
import { getAuth, vexMutation as mutation } from "../vex";

export const { get, find, upsert } = globalsApi({
  config,
  query,
  mutation,
  getAuth,
});
