import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { apiKey } from "@better-auth/api-key";
import { convex } from "@convex-dev/better-auth/plugins";
import { describe, expect, it } from "vitest";
import {
  admin,
  anonymous,
  deviceAuthorization,
  jwt,
  mcp,
  oidcProvider,
  organization,
  phoneNumber,
  siwe,
  twoFactor,
} from "better-auth/plugins";

import { betterAuthAdapter } from "./adapter";
import { betterAuthCollections } from "./collections";
import type { PluginDBSchema } from "./pluginSchemas";
import { PLUGIN_SCHEMAS } from "./pluginSchemas.generated";

/**
 * Minimal `AuthConfig` the Convex plugin needs to initialize. Only
 * `applicationID: "convex"` is load-bearing — `parseAuthConfig` throws without
 * it — and none of these values reach the schema it contributes.
 */
const PROBE_AUTH_CONFIG = {
  providers: [
    {
      type: "customJwt" as const,
      applicationID: "convex",
      issuer: "https://probe.convex.site",
      jwks: "https://probe.convex.site/.well-known/jwks.json",
      algorithm: "RS256" as const,
    },
  ],
};

/**
 * Every plugin whose DB schema `@vexcms/better-auth` models, instantiated with
 * the minimum options its factory requires.
 *
 * Lives in this test file rather than in `src/`: instantiating real plugin
 * factories pulls ~684 KB (154 KB gzip) of plugin code — the entire reason the
 * generated snapshot exists — and a dev-only module under `src/` would ship its
 * type declarations in `dist/`.
 *
 * Keys are descriptor keys, not plugin names: a plugin whose schema depends on
 * its options contributes one entry per schema-distinct variant, suffixed with
 * the option that selects it (`organization` vs `organization.teams`).
 *
 * `siwe`/`oidcProvider`/`mcp` take required options that do not affect their
 * schema; the values here are inert placeholders.
 */
const PLUGIN_PROBES: Record<string, () => { schema?: PluginDBSchema | undefined }> = {
  admin: () => admin(),
  anonymous: () => anonymous(),
  apiKey: () => apiKey(),
  convex: () => convex({ authConfig: PROBE_AUTH_CONFIG }),
  deviceAuthorization: () => deviceAuthorization(),
  jwt: () => jwt(),
  mcp: () => mcp({ loginPage: "/sign-in" }),
  oidcProvider: () => oidcProvider({ loginPage: "/sign-in" }),
  organization: () => organization(),
  "organization.teams": () => organization({ teams: { enabled: true } }),
  phoneNumber: () => phoneNumber(),
  siwe: () =>
    siwe({
      domain: "probe.example.com",
      getNonce: async () => "probe-nonce",
      verifyMessage: async () => true,
    }),
  twoFactor: () => twoFactor(),
};

/** Descriptor key of every probed plugin variant. */
type PluginProbeKey = keyof typeof PLUGIN_PROBES;

/**
 * Instantiates every probe and collects its declared DB schema.
 *
 * @returns Schema per probe key, in key order; probes that declare no tables map to `{}`.
 */
function computePluginSchemas(): Record<PluginProbeKey, PluginDBSchema> {
  const out = {} as Record<PluginProbeKey, PluginDBSchema>;
  for (const key of Object.keys(PLUGIN_PROBES).sort() as PluginProbeKey[]) {
    out[key] = PLUGIN_PROBES[key]().schema ?? {};
  }
  return out;
}

const GENERATED_PATH = resolve(import.meta.dirname, "pluginSchemas.generated.ts");

/**
 * Renders the generated module for the schemas the installed Better Auth
 * currently produces.
 *
 * @param schemas - Freshly computed schemas, keyed by descriptor key.
 * @returns The full file contents.
 */
function renderGenerated(schemas: Record<string, unknown>): string {
  return [
    "// ⚠️ AUTO-GENERATED — DO NOT EDIT ⚠️",
    "// Snapshot of every modelled Better Auth plugin's DB schema, harvested from",
    "// the real plugin factories by `pluginSchemas.test.ts`. Regenerate after a",
    "// Better Auth upgrade with `pnpm --filter @vexcms/better-auth gen:auth-schemas`;",
    "// the same test fails when this file and the installed version disagree.",
    "//",
    "// It exists so `betterAuthCollections()` can run in a browser bundle: reading",
    "// these schemas costs ~1 KB, instantiating the plugins that declare them costs",
    "// ~154 KB gzipped.",
    "",
    'import type { PluginDBSchema } from "./pluginSchemas";',
    "",
    "/** Declared DB schema per plugin descriptor key. */",
    `export const PLUGIN_SCHEMAS: Record<string, PluginDBSchema> = ${JSON.stringify(schemas, null, 2)};`,
    "",
  ].join("\n");
}

describe("PLUGIN_SCHEMAS", () => {
  it("matches the schemas the installed Better Auth plugins declare", () => {
    const fresh = computePluginSchemas();
    if (process.env.UPDATE_AUTH_SCHEMAS === "1") {
      writeFileSync(GENERATED_PATH, renderGenerated(fresh), "utf-8");
      return;
    }
    expect(JSON.parse(JSON.stringify(PLUGIN_SCHEMAS))).toEqual(
      JSON.parse(JSON.stringify(fresh)),
    );
  });

  it("is the only file that needs regenerating — the committed snapshot is complete", () => {
    expect(Object.keys(PLUGIN_SCHEMAS).sort()).toEqual(Object.keys(PLUGIN_PROBES).sort());
  });
});

describe("betterAuthCollections parity with betterAuthAdapter", () => {
  const keys = Object.keys(PLUGIN_PROBES) as PluginProbeKey[];

  for (const key of keys) {
    it(`produces the live adapter's collections for "${key}"`, () => {
      const isTeams = key === "organization.teams";
      const name = isTeams ? "organization" : key;
      const descriptor = isTeams ? { teams: true } : true;

      const viaDescriptors = betterAuthCollections({
        user: { modelName: "user" },
        plugins: { [name]: descriptor } as never,
      });
      const viaRealPlugin = betterAuthAdapter({
        config: { user: { modelName: "user" }, plugins: [PLUGIN_PROBES[key]()] as never },
      }).collections;

      expect(viaDescriptors).toEqual(viaRealPlugin);
    });
  }

  it("matches the live adapter for a full multi-plugin setup with overrides", () => {
    const schema = {
      user: {
        modelName: "user",
        additionalFields: {
          roles: { type: "string[]" as const, defaultValue: ["user"], required: true },
        },
      },
      session: { modelName: "session" },
      account: { modelName: "account" },
      verification: { modelName: "verification" },
    };
    const orgOverride = {
      invitation: {
        additionalFields: {
          roles: { type: "string[]" as const, input: true, required: true },
        },
      },
    };

    const viaDescriptors = betterAuthCollections({
      ...schema,
      plugins: {
        admin: true,
        anonymous: true,
        organization: { teams: true, schema: orgOverride },
        apiKey: true,
        convex: true,
      },
    });
    const viaRealPlugins = betterAuthAdapter({
      config: {
        ...schema,
        plugins: [
          PLUGIN_PROBES.admin(),
          PLUGIN_PROBES.anonymous(),
          PLUGIN_PROBES["organization.teams"](),
          PLUGIN_PROBES.apiKey(),
          PLUGIN_PROBES.convex(),
        ] as never,
      },
    }).collections;

    expect(viaDescriptors.map((c) => c.slug).sort()).toEqual(
      viaRealPlugins.map((c) => c.slug).sort(),
    );
    expect(viaDescriptors.find((c) => c.slug === "invitation")?.fields).toHaveProperty("roles");
  });

  it("throws a message naming extraSchema when a plugin is not modelled", () => {
    expect(() =>
      betterAuthCollections({ plugins: { passkey: true } as never }),
    ).toThrow(/extraSchema/);
  });

  it("registers tables supplied through extraSchema", () => {
    const collections = betterAuthCollections({
      extraSchema: { passkey: { fields: { credentialID: { type: "string", required: true } } } },
    });
    expect(collections.map((c) => c.slug)).toContain("passkey");
  });
});

describe("generated module hygiene", () => {
  it("carries the do-not-edit banner", () => {
    expect(readFileSync(GENERATED_PATH, "utf-8")).toContain("AUTO-GENERATED");
  });
});
