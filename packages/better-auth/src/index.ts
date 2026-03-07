import type { VexAuthAdapter } from "@vexcms/core";
import type { BetterAuthOptions } from "better-auth";
import { extractAuthCollections } from "./extract/collections";

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

/**
 * Type-level map from collection slug to field key union.
 * Base fields are always present; plugin-added fields work at runtime
 * but don't get autocomplete.
 */
type BetterAuthFieldKeyMap = {
  user: UserFields;
  session: SessionFields;
  account: AccountFields;
  verification: VerificationFields;
};

/**
 * The typed adapter returned by `vexBetterAuth()`.
 * Base field keys are preserved as string literals
 * for autocomplete in `defineCollection`.
 */
export type BetterAuthAdapter = VexAuthAdapter<BetterAuthFieldKeyMap>;

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
  const collections = extractAuthCollections(props?.config ?? {});

  return {
    name: "better-auth",
    collections,
  } as BetterAuthAdapter;
}
