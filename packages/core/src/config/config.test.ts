import { describe, it, expect } from "vitest";
import { defineConfig, defineCollection, text, upload } from "../";
import type { VexStorageAdapter, MediaCollectionConfig } from "../";
import { VexStorageConfigError } from "../media";

// ── Minimal inline mock adapter ──────────────────────────────────────────────
// Avoids importing @vexcms/file-storage-convex (circular dev dep).
// Only the fields that defineConfig and validateAndMergeStorageConfig read.

function makeMockMediaCollection(slug: string): MediaCollectionConfig {
  return {
    slug,
    fields: {
      alt: text({ required: true }),
      filename: text({ required: true }),
    },
    labels: { singular: slug, plural: slug },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

function makeMockAdapter(
  name = "convex",
  slugs = ["images"],
  softDelete = false,
): VexStorageAdapter {
  return {
    name,
    type: "presigned-url",
    mediaCollections: slugs.map(makeMockMediaCollection),
    admin: { softDelete },
    generateUploadUrl: async () => ({ url: "" }),
    createMediaDocument: async () => "",
    deleteMedia: async () => true,
    getUrl: async () => ({ url: "" }),
    uploadFile: async () => ({ storageId: "" }),
  } satisfies VexStorageAdapter;
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

// ── Storage adapters ──────────────────────────────────────────────────────────

describe("defineConfig with storage adapters", () => {
  it("works without storage adapters and without upload fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text() },
        }),
      ],
    });
    expect(config.storage?.adapters).toEqual([]);
    expect(config.mediaCollections).toEqual([]);
  });

  it("throws when upload fields exist without storage adapters", () => {
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

  it("merges media collections from storage adapters", () => {
    const adapter = makeMockAdapter("convex", ["images"]);

    const config = defineConfig({
      storage: { adapters: [adapter] },
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
    const adapter = makeMockAdapter("convex", ["images"]);

    expect(() =>
      defineConfig({
        storage: { adapters: [adapter] },
        collections: [
          defineCollection({
            slug: "images", // collision
            fields: { name: text() },
          }),
        ],
      }),
    ).toThrow(VexStorageConfigError);
  });

  it("throws on duplicate media collection slug across adapters", () => {
    const adapter1 = makeMockAdapter("convex", ["images"]);
    const adapter2 = makeMockAdapter("s3", ["images"]); // same slug, different adapter

    expect(() =>
      defineConfig({
        storage: { adapters: [adapter1, adapter2] },
      }),
    ).toThrow(VexStorageConfigError);
  });
});
