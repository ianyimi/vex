/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_adapter_index from "../auth/adapter/index.js";
import type * as auth_adapter_utils from "../auth/adapter/utils.js";
import type * as auth_api from "../auth/api.js";
import type * as auth_config from "../auth/config.js";
import type * as auth_db from "../auth/db.js";
import type * as auth_index from "../auth/index.js";
import type * as auth_options from "../auth/options.js";
import type * as auth_plugins_index from "../auth/plugins/index.js";
import type * as auth_sessions from "../auth/sessions.js";
import type * as http from "../http.js";
import type * as vex_collections from "../vex/collections.js";
import type * as vex_impersonation from "../vex/impersonation.js";
import type * as vex_media from "../vex/media.js";
import type * as vex_migrate from "../vex/migrate.js";
import type * as vex_model_collections from "../vex/model/collections.js";
import type * as vex_model_media from "../vex/model/media.js";
import type * as vex_model_versions from "../vex/model/versions.js";
import type * as vex_previewSnapshot from "../vex/previewSnapshot.js";
import type * as vex_versions from "../vex/versions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/adapter/index": typeof auth_adapter_index;
  "auth/adapter/utils": typeof auth_adapter_utils;
  "auth/api": typeof auth_api;
  "auth/config": typeof auth_config;
  "auth/db": typeof auth_db;
  "auth/index": typeof auth_index;
  "auth/options": typeof auth_options;
  "auth/plugins/index": typeof auth_plugins_index;
  "auth/sessions": typeof auth_sessions;
  http: typeof http;
  "vex/collections": typeof vex_collections;
  "vex/impersonation": typeof vex_impersonation;
  "vex/media": typeof vex_media;
  "vex/migrate": typeof vex_migrate;
  "vex/model/collections": typeof vex_model_collections;
  "vex/model/media": typeof vex_model_media;
  "vex/model/versions": typeof vex_model_versions;
  "vex/previewSnapshot": typeof vex_previewSnapshot;
  "vex/versions": typeof vex_versions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
