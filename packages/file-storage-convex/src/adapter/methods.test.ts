import { describe, it, expect, vi } from "vitest";
import { generateUploadUrl, createMediaDocument, deleteMedia, getUrl } from "./methods";

describe("generateUploadUrl", () => {
  it("calls ctx.storage.generateUploadUrl", async () => {
    const mockCtx = {
      storage: {
        generateUploadUrl: vi.fn().mockResolvedValue("https://upload.example.com/url"),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    const result = await generateUploadUrl(mockCtx);
    expect(result).toEqual({ url: "https://upload.example.com/url" });
    expect(mockCtx.storage.generateUploadUrl).toHaveBeenCalledOnce();
  });
});

describe("createMediaDocument", () => {
  it("inserts a media document and returns its id", async () => {
    const mockCtx = {
      storage: {
        getUrl: vi.fn().mockResolvedValue("https://example.com/file.jpg"),
      },
      db: {
        insert: vi.fn().mockResolvedValue("doc_123"),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    const result = await createMediaDocument(mockCtx, {
      collectionSlug: "images",
      storageId: "storage_123",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      size: 1024000,
      alt: "A mountain view",
    });

    expect(result).toBe("doc_123");
    expect(mockCtx.db.insert).toHaveBeenCalledWith("images", {
      src: "https://example.com/file.jpg",
      storageId: "storage_123",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      size: 1024000,
      alt: "A mountain view",
      deleted: false,
    });
  });

  it("defaults alt to filename when not provided", async () => {
    const mockCtx = {
      storage: {
        getUrl: vi.fn().mockResolvedValue("https://example.com/file.jpg"),
      },
      db: {
        insert: vi.fn().mockResolvedValue("doc_456"),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    await createMediaDocument(mockCtx, {
      collectionSlug: "images",
      storageId: "storage_456",
      filename: "untitled.png",
      mimeType: "image/png",
      size: 512000,
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith("images", {
      src: "https://example.com/file.jpg",
      storageId: "storage_456",
      filename: "untitled.png",
      mimeType: "image/png",
      size: 512000,
      alt: "untitled.png",
      deleted: false,
    });
  });
});

describe("deleteMedia", () => {
  it("returns false when media document does not exist", async () => {
    const mockCtx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    const result = await deleteMedia(mockCtx, {
      collectionSlug: "images",
      mediaId: "nonexistent",
    });

    expect(result).toBe(false);
  });

  it("soft deletes when softDelete is true", async () => {
    const mockCtx = {
      db: {
        get: vi.fn().mockResolvedValue({ _id: "doc_123", storageId: "storage_123" }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    const result = await deleteMedia(mockCtx, {
      collectionSlug: "images",
      mediaId: "doc_123",
      softDelete: true,
    });

    expect(result).toBe(true);
    expect(mockCtx.db.patch).toHaveBeenCalledWith("doc_123", { deleted: true });
  });

  it("hard deletes when softDelete is false", async () => {
    const mockCtx = {
      db: {
        get: vi.fn().mockResolvedValue({ _id: "doc_456", storageId: "storage_456" }),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      storage: {
        delete: vi.fn().mockResolvedValue(undefined),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    const result = await deleteMedia(mockCtx, {
      collectionSlug: "images",
      mediaId: "doc_456",
      softDelete: false,
    });

    expect(result).toBe(true);
    expect(mockCtx.storage.delete).toHaveBeenCalledWith("storage_456");
    expect(mockCtx.db.delete).toHaveBeenCalledWith("doc_456");
  });
});

describe("getUrl", () => {
  it("returns error when media document does not exist", async () => {
    const mockCtx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    const result = await getUrl(mockCtx, {
      collectionSlug: "images",
      mediaId: "nonexistent",
    });

    expect(result).toEqual({ error: "Media Document NotFound" });
  });

  it("returns error when file URL is not found", async () => {
    const mockCtx = {
      db: {
        get: vi.fn().mockResolvedValue({ _id: "doc_123", storageId: "storage_123" }),
      },
      storage: {
        getUrl: vi.fn().mockResolvedValue(null),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    const result = await getUrl(mockCtx, {
      collectionSlug: "images",
      mediaId: "doc_123",
    });

    expect(result).toEqual({ error: "File Url NotFound" });
  });

  it("returns url when media document and file exist", async () => {
    const mockCtx = {
      db: {
        get: vi.fn().mockResolvedValue({ _id: "doc_789", storageId: "storage_789" }),
      },
      storage: {
        getUrl: vi.fn().mockResolvedValue("https://example.com/file.jpg"),
      },
    };

    // @ts-expect-error mocking mutationCtx for file upload operations
    const result = await getUrl(mockCtx, {
      collectionSlug: "images",
      mediaId: "doc_789",
    });

    expect(result).toEqual({ url: "https://example.com/file.jpg" });
  });
});
