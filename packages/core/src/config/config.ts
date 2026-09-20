import { AccessResource } from "../access";
import { validateAccessConfig } from "../access/validateAccessConstraints";
import { mergeAuthCollections } from "../auth/mergeCollections";
import { VexAuthConfigError } from "../auth/types";
import { internalCollections } from "../collections/internal";
import { validateAndMergeStorageConfig, VexStorageConfigError } from "../media";
import { diffAuthCollections } from "./diffAuthCollections";
import { DEFAULT_LIVE_PREVIEW_BREAKPOINTS } from "../livePreview";
import {
  ClientUploadMap,
  VexClientConfig,
  VexClientConfigInput,
  VexConfig,
  VexServerConfigInput,
} from "./types";

/**
 * Resolves a raw client config input into a fully-populated `VexClientConfig`.
 *
 * Applies defaults for any omitted properties — an absent `collections`
 * array is replaced with an empty array so downstream consumers can always
 * iterate without null-checking. Pure: same input always produces a
 * deep-equal (not reference-equal) output, so evaluating this module twice
 * in one bundle graph (server + browser) is safe.
 *
 * `authCollections` — built by the project's auth package's client-safe builder (e.g.
 * `betterAuthCollections()` from `@vexcms/better-auth/client`), or omitted entirely for a
 * project with no auth — are merged with user-defined collections via
 * {@link mergeAuthCollections}, then `internalCollections` are appended. Protected auth
 * collections cannot be overridden, and locked fields are preserved.
 *
 * Also validates `config.access` against the resolved resources (collections, media
 * collections, globals) — auth collections are already merged in by the time this runs, so
 * access rules may target them.
 *
 * @param config - The raw client configuration supplied by the caller.
 * @returns The resolved `VexClientConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * // Basic config with user-defined collections only
 * defineConfig({
 *   collections: [
 *     defineCollection({ slug: "posts", fields: { title: text() } }),
 *   ],
 * });
 * ```
 *
 * @example
 * ```ts
 * // Config with auth collections built from a client-safe schema module
 * import { betterAuthCollections } from "@vexcms/better-auth/client";
 *
 * import { authSchema } from "./auth/schema";
 *
 * defineConfig({
 *   authCollections: betterAuthCollections(authSchema),
 *   collections: [posts, authors],
 * });
 * ```
 *
 * @throws {VexStorageConfigError} When an `upload()` field references a media
 *   collection slug not present in `mediaCollections`, or a media collection
 *   slug collides with a regular collection slug.
 * @throws {VexAccessConfigError} When `config.access` references an unknown
 *   resource, field, or index.
 * @throws Error when `schema.autoMigrate` is `true` — automatic migration is not
 *   implemented, and enabling it would silently migrate nothing.
 * @see {@link VexClientConfigInput} for the user-facing input type
 * @see {@link VexClientConfig} for the resolved return type
 * @see {@link mergeAuthCollections} for auth collection merge logic
 * @see {@link defineServerConfig} for the server layer built on top of this result
 */
export function defineConfig(config?: VexClientConfigInput): VexClientConfig {
  const userCollections = config?.collections ?? [];
  const authCollections = config?.authCollections ?? [];
  const collections = mergeAuthCollections({
    authCollections,
    userCollections,
  }).concat(internalCollections);
  const mediaCollections = config?.mediaCollections ?? [];

  validateAndMergeStorageConfig({ collections, mediaCollections });

  if (config?.access) {
    const allResources: AccessResource[] = (
      collections.concat(mediaCollections) as AccessResource[]
    ).concat(config?.globals ?? []);
    validateAccessConfig({
      ...config.access,
      resources: allResources,
    });
  }

  // `autoMigrate` is not declared on `SchemaConfigInput`, so a TypeScript caller cannot
  // set it — but a JS config, a spread, or a stale project can. The CLI reads it
  // (`generateSchema.ts`) and would run a full migration orchestration over a diff that
  // is always empty. Fail at module load rather than silently migrate nothing.
  const schemaInput = config?.schema as Record<string, unknown> | undefined;
  if (schemaInput?.autoMigrate === true) {
    throw new Error(
      "defineConfig: schema.autoMigrate is not implemented. Schema diffing and field " +
        "backfill are deferred past v0.1.0 — the diff is empty for every input, so enabling " +
        "this would silently migrate nothing. Remove the option and apply schema changes manually.",
    );
  }

  return {
    basePath: "/admin",
    ...config,
    access: config?.access,
    collections,
    globals: config?.globals ?? [],
    mediaCollections,
    authCollections,
    admin: {
      ...config?.admin,
      sidebar: {
        side: "left",
        collapsible: "offcanvas",
        ...config?.admin?.sidebar,
      },
    },
    storage: {
      clientUploads: (config?.storage?.clientUploads ?? {}) as ClientUploadMap,
    },
    schema: {
      outputPath: "/convex/vex.schema.ts",
      ...config?.schema,
    },
    types: {
      outputPath: "/src/vex.types.ts",
      ...config?.types,
    },
    routes: config?.routes,
    livePreview: {
      allowedOrigins: config?.livePreview?.allowedOrigins ?? [],
      breakpoints: config?.livePreview?.breakpoints ?? DEFAULT_LIVE_PREVIEW_BREAKPOINTS,
    },
  };
}

/**
 * Layers server-only settings onto an already-resolved `VexClientConfig`,
 * producing the full `VexConfig` every server-side and Convex reader
 * consumes.
 *
 * Validates that every `mediaCollection.meta.storageAdapter` resolves to a
 * registered adapter instance, and — when an auth adapter is registered —
 * that the auth collections the client config declares match the ones the
 * live adapter produces from the real auth options. The client config builds
 * its `authCollections` from a schema description it can safely import into
 * the browser; only this function holds the live adapter, so this is where a
 * mismatch becomes an error instead of an admin panel quietly missing a
 * column. Registering the adapter is optional: a project with no auth, or
 * one that prefers to skip the check, simply omits `server.auth`.
 *
 * @param props - `config` and the server-only settings to layer on.
 * @param props.config - The resolved `VexClientConfig`, typically the
 *   default export of `vex.config.ts`.
 * @param props.server - Server-only settings: the auth adapter and the storage
 *   adapter instances. Nothing else belongs here.
 * @returns The resolved `VexConfig`, structurally containing every field of `props.config`.
 * @throws {VexStorageConfigError} When a media collection names an unregistered storage adapter.
 * @throws {VexAuthConfigError} When `config.authCollections` disagrees with the
 *   registered auth adapter's collections.
 *
 * @example
 * ```ts
 * import config from "./vex.config";
 * import { betterAuthAdapter } from "@vexcms/better-auth";
 *
 * export default defineServerConfig({
 *   config,
 *   server: {
 *     auth: { adapter: betterAuthAdapter({ config: authOptions }) },
 *     storage: { adapters: [convexFileStorage()] },
 *   },
 * });
 * ```
 *
 * @see {@link VexServerConfigInput} for the user-facing server input type
 * @see {@link VexConfig} for the resolved return type
 * @see {@link diffAuthCollections} for the comparison
 */
export function defineServerConfig(props: {
  config: VexClientConfig;
  server?: VexServerConfigInput;
}): VexConfig {
  const { config, server } = props;

  const registeredNames = new Set((server?.storage?.adapters ?? []).map((adapter) => adapter.name));
  const unresolved = config.mediaCollections.filter(
    (mediaCollection) => !registeredNames.has(mediaCollection.meta.storageAdapter),
  );
  if (unresolved.length > 0) {
    const missing = unresolved
      .map(
        (mediaCollection) => `"${mediaCollection.slug}" → "${mediaCollection.meta.storageAdapter}"`,
      )
      .join(", ");
    throw new VexStorageConfigError(
      `Media collection(s) reference unregistered storage adapters: ${missing}. ` +
        `Registered storage adapters: ${[...registeredNames].join(", ") || "none"}.`,
    );
  }

  if (server?.auth) {
    const divergence = diffAuthCollections({
      declared: config.authCollections,
      live: server.auth.adapter.collections,
    });
    if (divergence !== null) {
      throw new VexAuthConfigError(
        `The auth collections declared in the client config disagree with the ` +
          `"${server.auth.adapter.name}" adapter: ${divergence}. Update the client config's ` +
          `authCollections call to match your auth options.`,
      );
    }
  }

  return {
    ...config,
    auth: server?.auth ? { adapter: server.auth.adapter } : undefined,
    storage: {
      clientUploads: config.storage.clientUploads,
      adapters: server?.storage?.adapters ?? [],
    },
  };
}
