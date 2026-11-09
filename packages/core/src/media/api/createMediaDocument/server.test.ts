import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it, vi } from "vitest";

import type { VexConfig } from "../../../config";
import { defineAccess } from "../../../access/config";
import { VexAccessError } from "../../../access/types";
import { defineCollection, text } from "../../../index";
import type { VexStorageAdapter } from "../../types";
import { createMediaDocument } from "./server";

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
          width: true,
          height: true,
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
    // Permits every field EXCEPT width/height — proves an omitted (not
    // `undefined`-valued) width/height never trips `deniedFieldIn` for a
    // role whose map simply never mentions them.
    noDimensions: {
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
  roles: ["uploader", "altDenied", "noDimensions"] as const,
  userCollectionSlug: "users",
  userRolesField: "roles",
});

const uploader = { _id: "u1", roles: "uploader" };
const altDeniedCaller = { _id: "u2", roles: "altDenied" };
const noDimensionsCaller = { _id: "u3", roles: "noDimensions" };

function makeConfig(adapter: VexStorageAdapter): VexConfig {
  return { access, storage: { adapters: [adapter] } } as unknown as VexConfig;
}

// Neither function reads `ctx` before forwarding it to the (stubbed) adapter.
const ctx = {} as unknown as GenericMutationCtx<GenericDataModel>;

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

  it("passes width/height through to the adapter when provided", async () => {
    const adapter = makeAdapter();

    await createMediaDocument({
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
      width: 1920,
      height: 1080,
    });

    expect(adapter.createMediaDocument).toHaveBeenCalledWith(ctx, {
      adapterFields: undefined,
      alt: "A photo",
      collectionSlug: "images",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      size: 1024,
      storageId: "storage_1",
      width: 1920,
      height: 1080,
    });
  });

  it("omits width/height from the adapter call (not as undefined keys) when not provided, so a field map that never lists them still permits the write", async () => {
    const adapter = makeAdapter();

    // `noDimensions`'s own map permits adapterFields/alt/filename/mimeType/size
    // but never mentions width/height — this must still succeed, proving an
    // unmeasured width/height is never checked against the field map.
    await createMediaDocument({
      adapter: "convex",
      alt: "A manual",
      auth: { user: noDimensionsCaller },
      collection: "images",
      config: makeConfig(adapter),
      ctx,
      filename: "manual.pdf",
      mimeType: "application/pdf",
      size: 2048,
      storageId: "storage_2",
    });

    const call = vi.mocked(adapter.createMediaDocument).mock.calls[0];
    expect(call?.[1]).not.toHaveProperty("width");
    expect(call?.[1]).not.toHaveProperty("height");
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
