/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_api from "../auth/api.js";
import type * as auth_db from "../auth/db.js";
import type * as auth_index from "../auth/index.js";
import type * as auth_options from "../auth/options.js";
import type * as auth_plugins_index from "../auth/plugins/index.js";
import type * as auth_sessions from "../auth/sessions.js";
import type * as http from "../http.js";
import type * as vex from "../vex.js";
import type * as vex_firstUser from "../vex/firstUser.js";
import type * as vex_globals from "../vex/globals.js";
import type * as vex_media from "../vex/media.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/api": typeof auth_api;
  "auth/db": typeof auth_db;
  "auth/index": typeof auth_index;
  "auth/options": typeof auth_options;
  "auth/plugins/index": typeof auth_plugins_index;
  "auth/sessions": typeof auth_sessions;
  http: typeof http;
  vex: typeof vex;
  "vex/firstUser": typeof vex_firstUser;
  "vex/globals": typeof vex_globals;
  "vex/media": typeof vex_media;
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
