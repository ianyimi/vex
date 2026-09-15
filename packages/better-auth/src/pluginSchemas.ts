import type { DBFieldAttribute } from "better-auth";
// Type-only namespace import: erased entirely by the compiler, so deriving the
// plugin-name union below costs the client bundle nothing. A value import here
// would pull every plugin factory (~684 KB) into any graph that touches it.
import type * as BetterAuthPlugins from "better-auth/plugins";

import { PLUGIN_SCHEMAS } from "./pluginSchemas.generated";

/**
 * A Better Auth plugin's DB schema contribution — one entry per table it adds
 * or extends.
 *
 * Declared structurally rather than imported from `@better-auth/core/db`:
 * that package is a transitive dependency of `better-auth`, not one this
 * package declares, so naming it in a public type would be an undeclared
 * dependency on consumers' resolution.
 */
export type PluginDBSchema = Record<
  string,
  {
    fields: Record<string, DBFieldAttribute>;
    modelName?: string | undefined;
    disableMigration?: boolean | undefined;
  }
>;

/**
 * Every export of `better-auth/plugins` that is a plugin factory — derived
 * from the module's own types, so the union tracks upstream automatically:
 * a Better Auth release that adds a plugin adds a member here with no code
 * change, and {@link UnclassifiedPlugin} turns that into a compile error in
 * this package until the plugin is classified.
 */
export type BetterAuthPluginName = {
  [K in keyof typeof BetterAuthPlugins]: (typeof BetterAuthPlugins)[K] extends (
    ...args: never[]
  ) => {
    id: string;
  }
    ? K
    : never;
}[keyof typeof BetterAuthPlugins];

/**
 * Per-table overrides a plugin's own `schema` option accepts — renaming its
 * table or adding fields to it. Mirrors Better Auth's `schema` option shape so
 * the value can be authored once and passed to both the real plugin factory
 * and {@link betterAuthCollections}.
 */
export type PluginSchemaOverride = Record<
  string,
  {
    modelName?: string | undefined;
    /** Column renames, keyed by the plugin's own field name. */
    fields?: Record<string, string> | undefined;
    additionalFields?: Record<string, DBFieldAttribute> | undefined;
  }
>;

/**
 * Plugins whose DB schema this package models. `true` enables a plugin with
 * its default schema; an object supplies the SCHEMA-AFFECTING options only.
 *
 * Runtime options (`adminRoles`, `sendInvitationEmail`, OAuth secrets, …) are
 * deliberately absent: this descriptor is authored in a client-safe module and
 * accepting a plugin's full option type is how a server callback — and
 * whatever it closes over — would end up in the browser bundle. Options that
 * do not change the schema cannot change what the admin panel renders, so
 * nothing is lost by keeping them on the server's real plugin instances.
 */
export interface ModelledPluginDescriptors {
  /** Roles, bans, and impersonation fields on `user`/`session`. */
  admin?: true | { schema?: PluginSchemaOverride };
  /** `isAnonymous` on `user`. */
  anonymous?: true | { schema?: PluginSchemaOverride };
  /** The `apikey` table. */
  apiKey?: true | { schema?: PluginSchemaOverride };
  /** `userId` on `user`, plus the `jwks` table the Convex plugin's JWT half adds. */
  convex?: true | { schema?: PluginSchemaOverride };
  /** The `deviceCode` table. */
  deviceAuthorization?: true | { schema?: PluginSchemaOverride };
  /** The `jwks` table. */
  jwt?: true | { schema?: PluginSchemaOverride };
  /** The OAuth application/access-token/consent tables. */
  mcp?: true | { schema?: PluginSchemaOverride };
  /** The OAuth application/access-token/consent tables. */
  oidcProvider?: true | { schema?: PluginSchemaOverride };
  /**
   * Organizations, members, and invitations — plus `team`/`teamMember` when
   * `teams` is enabled, which is the one option that changes which tables exist.
   */
  organization?: true | { teams?: boolean; schema?: PluginSchemaOverride };
  /** `phoneNumber`/`phoneNumberVerified` on `user`. */
  phoneNumber?: true | { schema?: PluginSchemaOverride };
  /** The `walletAddress` table. */
  siwe?: true | { schema?: PluginSchemaOverride };
  /** The `twoFactor` table and `twoFactorEnabled` on `user`. */
  twoFactor?: true | { schema?: PluginSchemaOverride };
}

/** A plugin name this package models. */
export type ModelledPluginName = keyof ModelledPluginDescriptors;

/**
 * Plugins that exist upstream but contribute no tables, or whose schema this
 * package does not model. Passing one is a type error naming the escape hatch:
 * read its `schema` off your real plugin instance on the server and hand the
 * value to `betterAuthCollections`'s `extraSchema`.
 */
export type UnmodelledPluginDescriptor<TName extends string> = {
  readonly __unmodelled_plugin_pass_its_schema_via_extraSchema: TName;
};

/**
 * Plugin names neither modelled nor explicitly acknowledged as unmodelled.
 * Always `never`; {@link assertEveryPluginClassified} makes a non-`never`
 * value a compile error naming the plugin a Better Auth release just added.
 */
export type UnclassifiedPlugin = Exclude<
  BetterAuthPluginName,
  ModelledPluginName | UnmodelledPluginName
>;

/**
 * Upstream plugins knowingly left unmodelled. Enumerated rather than inferred
 * so adding a plugin upstream breaks this package's typecheck instead of
 * silently widening the accepted descriptor map.
 */
export type UnmodelledPluginName =
  | "backupCode2fa"
  | "bearer"
  | "captcha"
  | "customSession"
  | "emailOTP"
  | "genericOAuth"
  | "haveIBeenPwned"
  | "lastLoginMethod"
  | "magicLink"
  | "multiSession"
  | "oAuthProxy"
  | "oauthPopup"
  | "oneTap"
  | "oneTimeToken"
  | "openAPI"
  | "otp2fa"
  | "passkey"
  | "sso"
  | "testUtils"
  | "totp2fa"
  | "twoFactorClient"
  | "username";

/**
 * The `plugins` map `betterAuthCollections` accepts: modelled plugins carry a
 * descriptor, every other upstream plugin is rejected with a message pointing
 * at `extraSchema`.
 */
export type BetterAuthPluginDescriptors = ModelledPluginDescriptors & {
  [K in UnmodelledPluginName]?: UnmodelledPluginDescriptor<K>;
};

/**
 * Compile-time proof that every plugin `better-auth/plugins` exports is either
 * modelled or explicitly unmodelled.
 *
 * A Better Auth upgrade that adds a plugin fails this assignment with the new
 * plugin's name in the error — add it to {@link ModelledPluginDescriptors} (and
 * the probe table in `pluginSchemas.test.ts`) or to {@link UnmodelledPluginName}.
 */
const assertEveryPluginClassified: UnclassifiedPlugin extends never
  ? true
  : UnclassifiedPlugin = true;
void assertEveryPluginClassified;

/**
 * Resolves a descriptor map into the plain plugin stubs `getAuthTables` reads.
 *
 * Each enabled plugin contributes its generated schema snapshot with the
 * caller's `schema` overrides applied the same way the real plugin applies
 * them: `additionalFields` are spread into the table (plugins do this
 * themselves when building their schema, so the snapshot — generated with no
 * overrides — cannot already contain them), then Better Auth's own
 * the same field renames and `modelName` override Better Auth's `mergeSchema` applies.
 *
 * @param props.plugins - Descriptor map; omitted or `undefined` entries contribute nothing.
 * @param props.extraSchema - Schemas of plugins this package does not model, taken from a real plugin instance's `schema`.
 * @returns One `{ id, schema }` stub per contributing plugin, in descriptor-key order.
 * @throws {Error} When a descriptor names a plugin with no modelled schema.
 */
export function resolvePluginStubs(props: {
  plugins?: BetterAuthPluginDescriptors | undefined;
  extraSchema?: PluginDBSchema | PluginDBSchema[] | undefined;
}): { id: string; schema: PluginDBSchema }[] {
  const stubs: { id: string; schema: PluginDBSchema }[] = [];

  for (const [name, descriptor] of Object.entries(props.plugins ?? {})) {
    if (descriptor === undefined || descriptor === false) continue;
    const options = descriptor === true ? {} : (descriptor as Record<string, unknown>);
    const key =
      name === "organization" && options.teams === true ? "organization.teams" : name;
    const generated = PLUGIN_SCHEMAS[key];
    if (generated === undefined) {
      throw new Error(
        `betterAuthCollections: no schema is modelled for the "${name}" plugin. ` +
          `Read \`schema\` off your real plugin instance on the server and pass it as \`extraSchema\`.`,
      );
    }

    // Cloned because the override merge below rewrites `modelName`/`fieldName`
    // and PLUGIN_SCHEMAS is module-level state shared by every call.
    const schema = structuredClone(generated);
    for (const [table, tableOverride] of Object.entries(
      (options.schema ?? {}) as PluginSchemaOverride,
    )) {
      const target = schema[table];
      if (target === undefined || tableOverride === undefined) continue;
      // Plugins spread `additionalFields` into their own schema at build time,
      // so the snapshot — generated without overrides — never carries them.
      if (tableOverride.additionalFields !== undefined) {
        target.fields = { ...target.fields, ...tableOverride.additionalFields };
      }
      // Same semantics as Better Auth's `mergeSchema`, reimplemented rather
      // than imported: pulling it from `better-auth/db` defeats that barrel's
      // tree-shaking and costs the client bundle 77 KB gzipped instead of 1 KB.
      if (tableOverride.modelName !== undefined) {
        target.modelName = tableOverride.modelName;
      }
      for (const [field, fieldName] of Object.entries(tableOverride.fields ?? {})) {
        const attribute = target.fields[field];
        if (attribute !== undefined) attribute.fieldName = fieldName;
      }
    }

    stubs.push({ id: name, schema });
  }

  const extra = props.extraSchema;
  if (extra !== undefined) {
    for (const [index, schema] of (Array.isArray(extra) ? extra : [extra]).entries()) {
      stubs.push({ id: `extraSchema-${index}`, schema });
    }
  }

  return stubs;
}
