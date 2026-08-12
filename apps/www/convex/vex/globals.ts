import { globalsApi } from "@vexcms/core/server";

import config from "~/vex.config";

import { mutation, query } from "../_generated/server";

export const { get, find, upsert } = globalsApi(config, query, mutation);
