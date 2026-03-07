import type { AuthTableDefinition, VexAuthAdapter } from "@vexcms/core";
import type { BetterAuthOptions } from "better-auth";
import { extractAuthTables } from "./extract/tables";

interface VexBetterAuthOptions {
  config?: BetterAuthOptions;
}

// ---------------------------------------------------------------------------
// Known base fields per better-auth table (always present regardless of plugins)
// ---------------------------------------------------------------------------

type UserFields =
  | "name"
  | "email"
  | "emailVerified"
  | "image"
  | "createdAt"
  | "updatedAt";

type SessionFields =
  | "expiresAt"
  | "token"
  | "createdAt"
  | "updatedAt"
  | "ipAddress"
  | "userAgent"
  | "userId";

type AccountFields =
  | "accountId"
  | "providerId"
  | "userId"
  | "accessToken"
  | "refreshToken"
  | "accessTokenExpiresAt"
  | "refreshTokenExpiresAt"
  | "scope"
  | "password"
  | "createdAt"
  | "updatedAt";

type VerificationFields =
  | "identifier"
  | "value"
  | "expiresAt"
  | "createdAt"
  | "updatedAt";

// The typed tables tuple — slug + field keys are preserved as literals.
// Plugin-added fields don't get autocomplete but work at runtime.
type BetterAuthTables = [
  AuthTableDefinition<"user", UserFields>,
  AuthTableDefinition<"session", SessionFields>,
  AuthTableDefinition<"account", AccountFields>,
  AuthTableDefinition<"verification", VerificationFields>,
  ...AuthTableDefinition[],
];

/**
 * The typed adapter returned by `vexBetterAuth()`.
 * Table slugs and base field keys are preserved as string literals
 * for autocomplete in `defineCollection`.
 */
export type BetterAuthAdapter = VexAuthAdapter<BetterAuthTables>;

/**
 * Creates a VexAuthAdapter from a BetterAuthOptions config.
 *
 * Accepts the same config object you pass to betterAuth() on the server.
 * Only reads schema-affecting properties (modelNames, additionalFields, plugins).
 * Runtime options (database, secret, baseURL, etc.) are ignored.
 *
 * @example
 * ```ts
 * import { vexBetterAuth } from "@vexcms/better-auth";
 * import { admin } from "better-auth/plugins";
 *
 * export default defineConfig({
 *   auth: vexBetterAuth({
 *     user: { modelName: "users" },
 *     plugins: [admin()],
 *   }),
 *   // ...
 * });
 * ```
 */
export function vexBetterAuth(props?: VexBetterAuthOptions): BetterAuthAdapter {
  const tables = extractAuthTables(props?.config ?? {});

  return {
    name: "better-auth",
    tables,
  } as BetterAuthAdapter;
}
