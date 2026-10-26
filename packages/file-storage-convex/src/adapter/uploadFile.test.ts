import { describe, it, expect, vi } from "vitest";
import { uploadFile } from "./uploadFile";

describe("uploadFile", () => {
  it("posts the file to the upload url and returns the storageId", async () => {
    const file = new File(["contents"], "photo.jpg", { type: "image/jpeg" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ storageId: "storage_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadFile(file, "https://upload.example.com/url");

    expect(fetchMock).toHaveBeenCalledWith("https://upload.example.com/url", {
      method: "POST",
      body: file,
    });
    expect(result).toEqual({ storageId: "storage_123" });

    vi.unstubAllGlobals();
  });

  it("throws when the response is not ok", async () => {
    const file = new File(["contents"], "photo.jpg", { type: "image/jpeg" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      statusText: "Payload Too Large",
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadFile(file, "https://upload.example.com/url")).rejects.toThrow(
      "Upload failed: 413 Payload Too Large",
    );

    vi.unstubAllGlobals();
  });

  it("throws when the response body cannot be parsed as JSON", async () => {
    const file = new File(["contents"], "photo.jpg", { type: "image/jpeg" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected end of JSON input")),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadFile(file, "https://upload.example.com/url")).rejects.toThrow(
      "Unexpected end of JSON input",
    );

    vi.unstubAllGlobals();
  });
});
