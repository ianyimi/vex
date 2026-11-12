import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { describe, expect, it, vi } from "vitest";
import { ConvexError } from "convex/values";
import { defineConfig, text, VexAccessError } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";

import { uploadFieldFixture } from "./testFixture";
import { UploadFilledState } from "./FilledInput";
import { VexConfigContext } from "../../config";
import * as clientModule from "../../client";

// Mocked around the real module (not replaced wholesale) so any OTHER test
// rendering `UploadItemRow` through this module keeps the real `get()` ->
// `convexQuery` behavior. Only the tests below override its return value.
vi.mock("../../client", async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return { ...actual, get: vi.fn(actual.get) };
});

const stubFieldApi = { setValue: vi.fn() } as unknown as AnyFieldApi;

const stubClientConfig = defineConfig({
  mediaCollections: [
    {
      slug: "images",
      fields: { alt: text({ required: false }), filename: text({ required: false }) },
      labels: { singular: "Image", plural: "Images" },
      admin: { useAsTitle: "_id", components: {} },
      meta: { storageAdapter: "convex" },
    } as never,
  ],
});

function renderFilled(mediaIds: string[]) {
  const convexClient = new ConvexReactClient("https://example.convex.cloud");
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <VexConfigContext.Provider value={stubClientConfig}>
          <UploadFilledState
            collection={stubClientConfig.mediaCollections[0]!}
            mediaIds={mediaIds}
            fieldDef={uploadFieldFixture.fieldDef}
            fieldApi={stubFieldApi}
            readOnly={false}
            onRemove={vi.fn()}
            openPicker={vi.fn(async () => {})}
          />
        </VexConfigContext.Provider>
      </QueryClientProvider>
    </ConvexProvider>,
  );
}

describe("UploadItemRow access errors", () => {
  it("shows the locked 'Hidden' row (no raw message) for a VexAccessError, with the denied permission in its tooltip trigger", async () => {
    const actualClient = await vi.importActual<typeof clientModule>("../../client");
    vi.mocked(clientModule.get).mockReturnValue({
      queryKey: ["upload-access-denied-test"],
      queryFn: () =>
        Promise.reject(
          new VexAccessError({ resource: "media", action: "read", message: "You cannot read this" }),
        ),
    } as never);
    try {
      renderFilled(["fake-media-id"]);
      const label = stubClientConfig.mediaCollections[0]!.labels.singular;
      expect(await screen.findByText(`Hidden ${label}`)).toBeInTheDocument();
      expect(label).not.toBe("file");
      expect(screen.queryByText("You cannot read this")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Requires media/read" })).toBeInTheDocument();
    } finally {
      vi.mocked(clientModule.get).mockImplementation(actualClient.get as never);
    }
  });

  it("keeps showing a non-access error's raw message", async () => {
    const actualClient = await vi.importActual<typeof clientModule>("../../client");
    vi.mocked(clientModule.get).mockReturnValue({
      queryKey: ["upload-generic-error-test"],
      queryFn: () => Promise.reject(new ConvexError({ code: "NOT_FOUND", message: "Document not found" })),
    } as never);
    try {
      renderFilled(["fake-media-id"]);
      expect(await screen.findByText("Document not found")).toBeInTheDocument();
    } finally {
      vi.mocked(clientModule.get).mockImplementation(actualClient.get as never);
    }
  });
});
