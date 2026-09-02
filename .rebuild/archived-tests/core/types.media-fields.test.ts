import { describe, it, expect } from "vitest";
import { defineMediaCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import type { VexAuthAdapter } from "../types/auth";

const minimalAuth: VexAuthAdapter = { name: "better-auth", collections: [] };

const mockStorageAdapter = {
  name: "test",
  storageIdValueType: "v.string()",
  getUrl: async () => "",
  getUploadUrl: async () => "",
  store: async () => "",
  deleteFile: async () => {},
};

describe("media collection field autocomplete in access", () => {
  it("resolveMediaCollection sets _isMedia marker", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
      media: {
        collections: [defineMediaCollection({ slug: "media" })],
        storageAdapter: mockStorageAdapter,
      },
    });
    expect(config.media!.collections[0]).toHaveProperty("_isMedia", true);
  });

  it("resolved media collection has default media fields in fields record", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
      media: {
        collections: [defineMediaCollection({ slug: "media" })],
        storageAdapter: mockStorageAdapter,
      },
    });
    const mediaCol = config.media!.collections[0];
    expect(mediaCol.fields).toHaveProperty("storageId");
    expect(mediaCol.fields).toHaveProperty("filename");
    expect(mediaCol.fields).toHaveProperty("mimeType");
    expect(mediaCol.fields).toHaveProperty("size");
    expect(mediaCol.fields).toHaveProperty("url");
    expect(mediaCol.fields).toHaveProperty("alt");
    expect(mediaCol.fields).toHaveProperty("width");
    expect(mediaCol.fields).toHaveProperty("height");
  });

  it("resolved media collection preserves user-defined fields", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
      media: {
        collections: [
          defineMediaCollection({
            slug: "media",
            fields: { caption: text({ label: "Caption" }) },
          }),
        ],
        storageAdapter: mockStorageAdapter,
      },
    });
    const mediaCol = config.media!.collections[0];
    expect(mediaCol.fields).toHaveProperty("caption");
    expect(mediaCol.fields).toHaveProperty("storageId");
  });
});
