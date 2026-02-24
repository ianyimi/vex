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
import type * as auth_plugins_index from "../auth/plugins/index.js";
import type * as auth_sessions from "../auth/sessions.js";
import type * as http from "../http.js";

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
  "auth/plugins/index": typeof auth_plugins_index;
  "auth/sessions": typeof auth_sessions;
  http: typeof http;
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
