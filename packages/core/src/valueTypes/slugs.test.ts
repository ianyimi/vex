import { describe, it, expect } from "vitest";
import { SlugRegistry, buildSlugRegistry } from "./slugs";
import { defineCollection, defineMediaCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import type { VexAuthAdapter } from "../";
import { VexSlugConflictError } from "../errors";

// Minimal auth adapter for tests that don't focus on auth
const minimalAuth: VexAuthAdapter = {
  name: "better-auth",
  collections: [],
};

describe("SlugRegistry", () => {
  it("registers unique slugs without throwing", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "posts",
      source: "user-collection",
      location: "collections/posts.ts",
    });
    registry.register({
      slug: "users",
      source: "user-collection",
      location: "collections/users.ts",
    });
    registry.register({
      slug: "account",
      source: "auth-table",
      location: "@vexcms/better-auth",
    });

    expect(registry.getAll()).toHaveLength(3);
  });

  it("allows auth table slug to overlap with user collection slug (merge)", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "user",
      source: "user-collection",
      location: "collections/user.ts",
    });

    // Auth table "user" overlapping with user collection "user" is expected
    // — this means the user wants to customize the auth table's admin UI
    expect(() =>
      registry.register({
        slug: "user",
        source: "auth-table",
        location: "@vexcms/better-auth",
      }),
    ).not.toThrow();

    // The user-collection registration should take precedence
    const all = registry.getAll();
    const userRegistrations = all.filter((r) => r.slug === "user");
    expect(userRegistrations).toHaveLength(1);
    expect(userRegistrations[0].source).toBe("user-collection");
  });

  it("throws VexSlugConflictError on non-auth/collection duplicate", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "data",
      source: "user-collection",
      location: "collections/data.ts",
    });

    // Two user collections with same slug: real conflict
    expect(() =>
      registry.register({
        slug: "data",
        source: "user-collection",
        location: "collections/data2.ts",
      }),
    ).toThrow(VexSlugConflictError);
  });

  it("includes both sources in error message for real conflicts", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "data",
      source: "user-global",
      location: "globals/data.ts",
    });

    try {
      registry.register({
        slug: "data",
        source: "auth-table",
        location: "@vexcms/better-auth",
      });
      expect.unreachable("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(VexSlugConflictError);
      const err = e as VexSlugConflictError;
      expect(err.slug).toBe("data");
      expect(err.existingSource).toBe("user-global");
      expect(err.newSource).toBe("auth-table");
      expect(err.message).toContain("Duplicate");
      expect(err.message).toContain("data");
    }
  });

  it("getAll() returns all successful registrations", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "posts",
      source: "user-collection",
      location: "collections/posts.ts",
    });
    registry.register({
      slug: "users",
      source: "user-collection",
      location: "collections/users.ts",
    });

    expect(registry.getAll()).toHaveLength(2);
  });

  it("getAll() returns empty array for empty registry", () => {
    const registry = new SlugRegistry();
    expect(registry.getAll()).toEqual([]);
  });
});

const users = defineCollection({ slug: "users",
  fields: { name: text() },
});

const mockStorageAdapter = {
  name: "test",
  storageIdValueType: "v.string()",
  getUploadUrl: async () => "",
  getUrl: async () => "",
  deleteFile: async () => {},
};

describe("media collection slugs", () => {
  it("registers media collection slugs", () => {
    const mediaImages = defineMediaCollection({ slug: "images",
      fields: { storageId: text() },
    });

    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
      media: {
        collections: [mediaImages],
        storageAdapter: mockStorageAdapter,
      },
    });

    const registry = buildSlugRegistry({ config });
    const slugs = registry.getAll().map((r) => r.slug);
    expect(slugs).toContain("images");
  });

  it("throws when media collection slug conflicts with user collection slug", () => {
    const userImages = defineCollection({ slug: "images",
      fields: { title: text() },
    });
    const mediaImages = defineMediaCollection({ slug: "images",
      fields: { storageId: text() },
    });

    const config = defineConfig({
      collections: [userImages, users],
      auth: minimalAuth,
      media: {
        collections: [mediaImages],
        storageAdapter: mockStorageAdapter,
      },
    });

    expect(() => buildSlugRegistry({ config })).toThrow(VexSlugConflictError);
  });

  it("throws when media collection slug conflicts with auth table slug", () => {
    const mediaSession = defineMediaCollection({ slug: "session",
      fields: { storageId: text() },
    });

    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      collections: [
        defineCollection({ slug: "session",
          fields: { token: text({ required: true, defaultValue: "" }) },
        }),
      ],
    };

    const config = defineConfig({
      collections: [users],
      auth: authAdapter,
      media: {
        collections: [mediaSession],
        storageAdapter: mockStorageAdapter,
      },
    });

    expect(() => buildSlugRegistry({ config })).toThrow(VexSlugConflictError);
  });

  it("allows media collections when no conflicts exist", () => {
    const mediaImages = defineMediaCollection({ slug: "images",
      fields: { storageId: text() },
    });
    const mediaDocuments = defineMediaCollection({ slug: "documents",
      fields: { storageId: text() },
    });

    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
      media: {
        collections: [mediaImages, mediaDocuments],
        storageAdapter: mockStorageAdapter,
      },
    });

    expect(() => buildSlugRegistry({ config })).not.toThrow();
  });
});
