import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it, vi } from "vitest";

import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access/types";
import { defineCollection, text } from "../../index";
import type { VexStorageAdapter } from "../types";
import { createMediaDocument, generateUploadUrl } from "./mutations";

const images = defineCollection({
  slug: "images",
  fields: { alt: text(), filename: text() },
});

/**
 * Minimal storage adapter satisfying {@link VexStorageAdapter}. Only the two
 * mutation methods under test carry meaningful stubs.
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
    // Permits every field `createMediaDocument` writes EXCEPT `alt`, so the
    // write must be rejected naming that field. The mirror of `uploader`:
    // without it the suite would only prove the permitting direction, and a
    // regression that dropped `changes` from the call would still pass.
    altDenied: {
      images: {
        create: () => ({
          "*": false,
          adapterFields: true,
          filename: true,
          mimeType: true,
          size: true,
        }),
      },
    },
  },
  resources: [images],
  roles: ["uploader", "altDenied"] as const,
  userCollectionSlug: "users",
  userRolesField: "roles",
});

const uploader = { _id: "u1", roles: "uploader" };
const altDeniedCaller = { _id: "u2", roles: "altDenied" };

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

describe("createMediaDocument — quantified call site", () => {
  it("succeeds for a role whose create action resolves to a field map that permits every written field", async () => {
    const adapter = makeAdapter();

    const id = await createMediaDocument({
      adapter: "convex",
      alt: "A photo",
      auth: { user: uploader },
      collection: "images",
      config: makeConfig(adapter),
      ctx,
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      size: 1024,
      storageId: "storage_1",
    });

    expect(id).toBe("media_1");
    expect(adapter.createMediaDocument).toHaveBeenCalledWith(ctx, {
      adapterFields: undefined,
      alt: "A photo",
      collectionSlug: "images",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      size: 1024,
      storageId: "storage_1",
    });
  });

  it("rejects the write when the map denies a field it writes, and writes nothing", async () => {
    const adapter = makeAdapter();
    let caught: unknown;

    try {
      await createMediaDocument({
        adapter: "convex",
        alt: "A photo",
        auth: { user: altDeniedCaller },
        collection: "images",
        config: makeConfig(adapter),
        ctx,
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        storageId: "storage_1",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).field).toBe("alt");
    // No partial write: the denial must land before the adapter is reached.
    expect(adapter.createMediaDocument).not.toHaveBeenCalled();
  });
});
