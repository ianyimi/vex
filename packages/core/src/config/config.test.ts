import { describe, it, expect } from "vitest";
import { defineConfig, defineServerConfig, defineCollection, text, upload } from "../";
import type {
  MediaCollectionConfig,
  VexAuthAdapter,
  VexRouteMapper,
  VexStorageAdapter,
} from "../";
import { VexStorageConfigError } from "../media";
import { VexAuthConfigError } from "../auth/types";

// ── Minimal inline mocks ─────────────────────────────────────────────────────
// Avoids importing @vexcms/file-storage-convex (circular dev dep).
// Only the fields that defineConfig / defineServerConfig read.

function makeMockMediaCollection(slug: string, storageAdapter = "convex"): MediaCollectionConfig {
  return {
    slug,
    fields: {
      alt: text({ required: true }),
      filename: text({ required: true }),
    },
    labels: { singular: slug, plural: slug },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter },
  } as unknown as MediaCollectionConfig;
}

function makeMockStorageAdapter(name = "convex"): VexStorageAdapter {
  return {
    name,
    type: "presigned-url",
    admin: { softDelete: false },
    generateUploadUrl: async () => ({ url: "" }),
    createMediaDocument: async () => "",
    deleteMedia: async () => true,
    getUrl: async () => ({ url: "" }),
    uploadFile: async () => ({ storageId: "" }),
  } as unknown as VexStorageAdapter;
}

function makeMockAuthAdapter(collections: VexAuthAdapter["collections"] = []): VexAuthAdapter {
  return {
    name: "mock-auth",
    collections,
    userCollection: "users",
  } as unknown as VexAuthAdapter;
}

// ── Schema defaults ───────────────────────────────────────────────────────────

describe("defineConfig — schema defaults", () => {
  it("applies all schema defaults when schema is omitted", () => {
    const config = defineConfig();
    expect(config.schema.outputPath).toBe("/convex/vex.schema.ts");
    expect(config.types.outputPath).toBe("/src/vex.types.ts");
  });

  it("merges partial schema overrides", () => {
    const config = defineConfig({
      schema: { outputPath: "/backend/vex.schema.ts" },
    });
    expect(config.schema.outputPath).toBe("/backend/vex.schema.ts");
    expect(config.types.outputPath).toBe("/src/vex.types.ts");
  });
});

// ── Media collections ─────────────────────────────────────────────────────────

describe("defineConfig with media collections", () => {
  it("works without media collections and without upload fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text() },
        }),
      ],
    });
    expect(config.storage.clientUploads).toEqual({});
    expect(config.mediaCollections).toEqual([]);
  });

  it("throws when upload fields reference a media collection that is not declared", () => {
    expect(() =>
      defineConfig({
        collections: [
          defineCollection({
            slug: "posts",
            fields: {
              image: upload({ to: "images" }),
            },
          }),
        ],
      }),
    ).toThrow(VexStorageConfigError);
  });

  it("accepts upload fields whose target is declared in mediaCollections", () => {
    const config = defineConfig({
      mediaCollections: [makeMockMediaCollection("images")],
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            image: upload({ to: "images" }),
          },
        }),
      ],
    });

    expect(config.mediaCollections.length).toBe(1);
    expect(config.mediaCollections[0].slug).toBe("images");
    expect(config.mediaCollections[0].meta?.storageAdapter).toBe("convex");
  });

  it("throws on slug collision between collection and media collection", () => {
    expect(() =>
      defineConfig({
        mediaCollections: [makeMockMediaCollection("images")],
        collections: [
          defineCollection({
            slug: "images", // collision
            fields: { name: text() },
          }),
        ],
      }),
    ).toThrow(VexStorageConfigError);
  });
});

// ── Revalidate defaults ────────────────────────────────────────────────────

describe("defineConfig — revalidate defaults", () => {
  it("leaves revalidate undefined when omitted", () => {
    const config = defineConfig();
    expect(config.routes).toBeUndefined();
  });

  it("passes a supplied routes config through untouched", () => {
    const map: VexRouteMapper = () => [];
    const config = defineConfig({ routes: { map } });
    expect(config.routes).toEqual({ map });
  });

  it("leaves routes undefined when the project never configured it", () => {
    expect(defineConfig({}).routes).toBeUndefined();
  });
});

// ── Purity ──────────────────────────────────────────────────────────────────

describe("defineConfig — purity", () => {
  it("produces deep-equal, reference-unequal output across two calls with the same input", () => {
    const input = {
      collections: [defineCollection({ slug: "posts", fields: { title: text() } })],
      mediaCollections: [makeMockMediaCollection("images")],
    };
    const first = defineConfig(input);
    const second = defineConfig(input);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.collections).not.toBe(second.collections);
  });
});

// ── Collection merge order ───────────────────────────────────────────────────

// `mergeAuthCollections` appends unmatched auth collections AFTER user
// collections per its own documented contract, so the merged order is user
// collections first.
describe("defineConfig — collection merge order", () => {
  it("merges user collections, then unmatched authCollections, then internalCollections in that order", () => {
    const authCollection = defineCollection({
      slug: "users",
      fields: { email: text() },
    });
    const userCollection = defineCollection({
      slug: "posts",
      fields: { title: text() },
    });
    const config = defineConfig({
      authCollections: [authCollection] as never,
      collections: [userCollection],
    });
    const slugs = config.collections.map((c) => c.slug);
    expect(slugs.slice(0, 2)).toEqual(["posts", "users"]);
    expect(config.authCollections).toEqual([authCollection]);
  });
});

// ── defineServerConfig ────────────────────────────────────────────────────────

describe("defineServerConfig", () => {
  it("throws when a media collection names an unregistered adapter", () => {
    const client = defineConfig({
      mediaCollections: [makeMockMediaCollection("images", "convex")],
    });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { storage: { adapters: [makeMockStorageAdapter("s3")] } },
      }),
    ).toThrow(VexStorageConfigError);
  });

  it("accepts a media collection whose adapter is registered", () => {
    const client = defineConfig({
      mediaCollections: [makeMockMediaCollection("images", "convex")],
    });
    const server = defineServerConfig({
      config: client,
      server: { storage: { adapters: [makeMockStorageAdapter("convex")] } },
    });
    expect(server.storage.adapters.map((a) => a.name)).toEqual(["convex"]);
    expect(server.mediaCollections).toBe(client.mediaCollections);
  });

  it("throws naming the missing field when the declaration lags the live adapter", () => {
    const declaredCollection = defineCollection({
      slug: "users",
      fields: { email: text() },
    });
    const liveCollection = defineCollection({
      slug: "users",
      fields: { email: text(), phone: text() },
    });
    const client = defineConfig({ authCollections: [declaredCollection] as never });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([liveCollection] as never) } },
      }),
    ).toThrow(VexAuthConfigError);
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([liveCollection] as never) } },
      }),
    ).toThrow(/"users" is missing field\(s\) "phone"/);
  });

  it("throws naming the missing collection when the adapter gained one", () => {
    const users = defineCollection({ slug: "users", fields: { email: text() } });
    const sessions = defineCollection({ slug: "sessions", fields: { token: text() } });
    const client = defineConfig({ authCollections: [users] as never });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([users, sessions] as never) } },
      }),
    ).toThrow(/missing collection\(s\) "sessions"/);
  });

  it("accepts declared auth collections when no adapter is registered to verify them", () => {
    const collection = defineCollection({ slug: "users", fields: { email: text() } });
    const client = defineConfig({ authCollections: [collection] as never });
    const server = defineServerConfig({ config: client });
    expect(server.auth).toBeUndefined();
    expect(server.collections.map((c) => c.slug)).toContain("users");
  });

  it("does not throw when the declaration matches the live adapter", () => {
    const collection = defineCollection({ slug: "users", fields: { email: text() } });
    const client = defineConfig({ authCollections: [collection] as never });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([collection] as never) } },
      }),
    ).not.toThrow();
  });

  it("spreads every client field onto the resolved server config", () => {
    const postCollection = defineCollection({ slug: "posts", fields: { title: text() } });
    const client = defineConfig({ collections: [postCollection], basePath: "/cms" });
    const server = defineServerConfig({ config: client });
    expect(server.basePath).toBe("/cms");
    expect(server.collections.map((c) => c.slug)).toContain("posts");
    expect(server.admin).toEqual(client.admin);
  });

  it("carries the client config's codegen settings through to VexConfig unchanged", () => {
    const client = defineConfig({ schema: { outputPath: "/convex/custom.schema.ts" } });
    const server = defineServerConfig({ config: client });
    expect(server.schema).toEqual(client.schema);
    expect(server.types).toEqual(client.types);
  });

  it("leaves auth undefined when no adapter is registered", () => {
    const server = defineServerConfig({ config: defineConfig() });
    expect(server.auth).toBeUndefined();
  });

  it("carries the registered adapter through on the resolved auth group", () => {
    const adapter = makeMockAuthAdapter([]);
    const server = defineServerConfig({
      config: defineConfig(),
      server: { auth: { adapter } },
    });
    expect(server.auth).toEqual({ adapter });
  });
});
