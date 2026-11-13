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

function renderFilled(mediaIds: string[], readOnly = false) {
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
            readOnly={readOnly}
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

describe("UploadItemRow thumbnail box (layout stability)", () => {
  it("renders the pending thumbnail through the exact same FilePreview wrapper (class + inline size/radius) the settled thumbnail uses, so resolving the doc never resizes the box", async () => {
    // A mimeType outside `isImage`/`isSvg`/`isVideo`/`isAudio` takes
    // `FilePreview`'s fallback `IconWrapper` branch in BOTH states — the one
    // difference being `Icon name` ("Loader" vs "File") and the spin
    // animation, never the wrapper's own classes or `size`/`radius`-derived
    // inline style. Asserting against that literal wrapper selector is a
    // stronger guarantee than re-deriving expected pixel values by hand.
    const wrapperSelector = ".flex.items-center.justify-center.p-2.bg-muted";

    const { container: pendingContainer } = renderFilled(["fake-media-id"]);
    const pendingThumb = pendingContainer.querySelector(wrapperSelector) as HTMLElement | null;
    expect(pendingThumb).not.toBeNull();
    expect(pendingThumb!.querySelector("svg.animate-spin")).not.toBeNull();

    const actualClient = await vi.importActual<typeof clientModule>("../../client");
    vi.mocked(clientModule.get).mockReturnValue({
      queryKey: ["upload-settled-pdf-test"],
      queryFn: () =>
        Promise.resolve({
          _id: "fake-media-id",
          filename: "report.pdf",
          mimeType: "application/pdf",
          size: 2048,
          alt: "",
          src: "",
        }),
    } as never);
    try {
      const { container: settledContainer, findByText } = renderFilled(["fake-media-id"]);
      await findByText("report.pdf");
      const settledThumb = settledContainer.querySelector(wrapperSelector) as HTMLElement | null;
      expect(settledThumb).not.toBeNull();
      expect(settledThumb!.querySelector("svg.animate-spin")).toBeNull();

      // Same wrapper class string, same inline size/radius style — the box
      // itself (what causes CLS) never changes between the two states.
      expect(settledThumb!.className).toBe(pendingThumb!.className);
      expect(settledThumb!.getAttribute("style")).toBe(pendingThumb!.getAttribute("style"));
      expect(pendingThumb!.style.width).toBe("44px");
      expect(pendingThumb!.style.height).toBe("44px");
      expect(pendingThumb!.style.borderRadius).toBe("3px");
    } finally {
      vi.mocked(clientModule.get).mockImplementation(actualClient.get as never);
    }
  });
});

describe("UploadItemRow readOnly muting", () => {
  it("mutes filename and alt text when readOnly, leaving the thumbnail unmuted", async () => {
    const actualClient = await vi.importActual<typeof clientModule>("../../client");
    vi.mocked(clientModule.get).mockReturnValue({
      queryKey: ["upload-readonly-muting-test"],
      queryFn: () =>
        Promise.resolve({
          _id: "fake-media-id",
          filename: "report.pdf",
          mimeType: "application/pdf",
          size: 2048,
          alt: "A nice report",
          src: "",
        }),
    } as never);
    try {
      const { findByText, findByTitle } = renderFilled(["fake-media-id"], true);
      const filename = await findByTitle("report.pdf");
      expect(filename.className).toContain("opacity-50");
      const alt = await findByText("A nice report");
      expect(alt.className).toContain("opacity-50");
    } finally {
      vi.mocked(clientModule.get).mockImplementation(actualClient.get as never);
    }
  });

  it("does not mute filename and alt text when not readOnly", async () => {
    const actualClient = await vi.importActual<typeof clientModule>("../../client");
    vi.mocked(clientModule.get).mockReturnValue({
      queryKey: ["upload-not-readonly-muting-test"],
      queryFn: () =>
        Promise.resolve({
          _id: "fake-media-id",
          filename: "report.pdf",
          mimeType: "application/pdf",
          size: 2048,
          alt: "A nice report",
          src: "",
        }),
    } as never);
    try {
      const { findByText, findByTitle } = renderFilled(["fake-media-id"], false);
      const filename = await findByTitle("report.pdf");
      expect(filename.className).not.toContain("opacity-50");
      const alt = await findByText("A nice report");
      expect(alt.className).not.toContain("opacity-50");
    } finally {
      vi.mocked(clientModule.get).mockImplementation(actualClient.get as never);
    }
  });
});
