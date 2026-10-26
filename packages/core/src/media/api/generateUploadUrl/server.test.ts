import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it, vi } from "vitest";

import type { VexConfig } from "../../../config";
import { defineAccess } from "../../../access/config";
import { defineCollection, text } from "../../../index";
import type { VexStorageAdapter } from "../../types";
import { generateUploadUrl } from "./server";

const images = defineCollection({
  slug: "images",
  fields: { alt: text(), filename: text() },
});

/**
 * Minimal storage adapter satisfying {@link VexStorageAdapter}. Only the
 * mutation method under test carries a meaningful stub.
 */
function makeAdapter(): VexStorageAdapter {
  return {
    admin: { softDelete: false },
    createMediaDocument: vi.fn().mockResolvedValue("media_1"),
    deleteMedia: vi.fn().mockResolvedValue(true),
    generateUploadUrl: vi.fn().mockResolvedValue({ url: "https://upload.example/1" }),
    getUrl: vi.fn().mockResolvedValue({ url: "https://cdn.example/1" }),
    mediaCollections: [],
    name: "convex",
    type: "presigned-url",
    uploadFile: vi.fn().mockResolvedValue({ storageId: "s1" }),
  } satisfies VexStorageAdapter;
}

// `create` resolves to a field map that permits exactly the fields
// `createMediaDocument` writes — under the default `scope: "all"`, a call
// supplying neither `data` nor `changes` is denied outright regardless of
// what the map permits, which is the bug these two call sites had.
const access = defineAccess({
  permissions: {
    uploader: {
      images: {
        create: () => ({
          "*": false,
          adapterFields: true,
          alt: true,
          filename: true,
          mimeType: true,
          size: true,
        }),
      },
    },
  },
  resources: [images],
  roles: ["uploader"] as const,
  userCollectionSlug: "users",
  userRolesField: "roles",
});

const uploader = { _id: "u1", roles: "uploader" };

function makeConfig(adapter: VexStorageAdapter): VexConfig {
  return { access, storage: { adapters: [adapter] } } as unknown as VexConfig;
}

// Neither function reads `ctx` before forwarding it to the (stubbed) adapter.
const ctx = {} as unknown as GenericMutationCtx<GenericDataModel>;

describe("generateUploadUrl — quantified call site", () => {
  it("succeeds for a role whose create action resolves to a field map, since no document is written", async () => {
    const adapter = makeAdapter();

    const result = await generateUploadUrl({
      adapter: "convex",
      auth: { user: uploader },
      collection: "images",
      config: makeConfig(adapter),
      ctx,
    });

    expect(result).toEqual({ url: "https://upload.example/1" });
    expect(adapter.generateUploadUrl).toHaveBeenCalledOnce();
  });
});
