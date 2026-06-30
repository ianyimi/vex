import { mediaMutationApi, mediaQueryApi } from "@vexcms/core";

import config from "~/vex.config";

import { mutation, query } from "../_generated/server";

export const { getUrl, listMedia, searchMedia } = mediaQueryApi(config, query);
export const { generateUploadUrl, createMediaDocument, deleteMedia } = mediaMutationApi(
  config,
  mutation,
);
