import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import type { MediaCollectionConfig, VexAccessConfig, VexMediaDocument } from "@vexcms/core";

import { renderWithVexProviders } from "./harness/accessFixtures";
import { createFakeConvexClient, type ConvexTestInstance } from "./convex/bridge";
import schema, {
  readTable,
  seedMedia,
  testModules,
  type TestDoc,
  type TestMediaInput,
} from "./convex/schema";
import { FilePreview } from "../components/media/FilePreview";
import { MediaLibraryGrid } from "../components/media/MediaLibaryGrid";
import { MediaUploadDropzone } from "../components/media/MediaUploadDropzone";
import { StorageAdapterContextProvider } from "../context";
import { makeFile } from "../components/fields/upload/testFixture";

/** Member names {@link runMediaSuite}'s `only` option accepts (`MediaLibaryGrid` keeps the source file's existing typo — a rename is tracked separately). */
export type MediaSuiteMember = "FilePreview" | "MediaLibaryGrid" | "MediaUploadDropzone";

/** Options for {@link runMediaSuite}. */
export interface RunMediaSuiteOptions {
  /** Restrict the run to these members. Defaults to all three. */
  only?: MediaSuiteMember[];
  /**
   * RBAC matrix threaded to `renderWithVexProviders` for every render below,
   * for signature consistency with the other section suites. Currently
   * unexercised: none of `FilePreview`/`MediaLibraryGrid`/`MediaUploadDropzone`
   * read `usePermission` themselves.
   */
  access?: VexAccessConfig;
}

/**
 * Wires a fresh `convex-test` instance through the real `ConvexProvider` +
 * `ConvexQueryClient` + `QueryClient` stack.
 *
 * This suite deliberately uses **no module mocks**: `vi.mock` only intercepts
 * inside `packages/react`'s own vitest module graph, so a mock-backed suite is
 * silently inert when a consumer runs `runVexReactSuite({ sections: ["media"] })`
 * against the built `dist/testing` output — the dual-context failure class
 * ADR-009 exists to catch. `MediaLibraryGrid` therefore reads real seeded rows
 * from the kit's own `media` table, and `MediaUploadDropzone` runs its real
 * `generateUploadUrl` → adapter → `createMediaDocument` path, with the storage
 * adapter injected through the public `StorageAdapterContextProvider` prop.
 *
 * @param t - The `convexTest()` instance the components' queries/mutations hit.
 * @returns The connected `QueryClient` and the fake Convex client.
 */
function buildConvexStack(t: ConvexTestInstance): {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
} {
  const convexClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);
  return { queryClient, convexClient };
}

let mediaDocCounter = 0;

/**
 * Builds an in-memory `VexMediaDocument` for `FilePreview`, which takes its
 * document straight as a prop and issues no query of its own.
 *
 * @param overrides - Shallow overrides merged over the defaults.
 * @returns A `VexMediaDocument` usable as `FilePreview`'s `mediaDoc` prop.
 */
function makeMediaDoc(overrides: Partial<VexMediaDocument> = {}): VexMediaDocument {
  mediaDocCounter += 1;
  return {
    _id: `media_${mediaDocCounter}`,
    _creationTime: 0,
    alt: "",
    filename: `file-${mediaDocCounter}`,
    mimeType: "application/octet-stream",
    size: 1024,
    storageId: `storage_${mediaDocCounter}`,
    deleted: false,
    src: `https://example.com/file-${mediaDocCounter}`,
    ...overrides,
  };
}

/**
 * Minimal `MediaCollectionConfig` fixture — mirrors the inline mock already
 * proven in `media/MediaUploadForm.test.tsx`. `admin.useAsTitle` is `filename`
 * so the grid's search index name matches the kit schema's own
 * `search_filename` index.
 *
 * @returns A `MediaCollectionConfig` usable as `MediaLibraryGrid`'s `targetCollectionConfig` prop.
 */
function makeMockMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {},
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "filename", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

/**
 * Registers the `FilePreview` describe block.
 *
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeFilePreview() {
  describe("FilePreview", () => {
    it("renders a loading spinner icon when isPending is true, before any mime branch is reached", () => {
      const { container } = renderWithVexProviders(
        <FilePreview mediaDoc={makeMediaDoc({ mimeType: "image/png" })} isPending />,
      );
      expect(container.querySelector(".lucide-loader")).not.toBeNull();
      expect(container.querySelector("img")).toBeNull();
    });

    it("renders an <img> for a raster image mime type, using alt when present", () => {
      const mediaDoc = makeMediaDoc({
        mimeType: "image/jpeg",
        src: "https://example.com/photo.jpg",
        alt: "A mountain photo",
      });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("https://example.com/photo.jpg");
      expect(img?.getAttribute("alt")).toBe("A mountain photo");
    });

    it("falls back to filename as alt text when alt is empty", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/png", alt: "", filename: "cover.png" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      // `FilePreview.tsx` computes `alt = mediaDoc.alt ?? mediaDoc.filename`,
      // which only falls back on `null`/`undefined` — but `VexMediaDocument.alt`
      // is a required string, so a real "no alt text" media item always has
      // `alt: ""`, not `undefined`, and the fallback never actually fires.
      expect(container.querySelector("img")?.getAttribute("alt")).toBe("cover.png"); // Regression guard (MEDIA-2): FilePreview uses mediaDoc.alt || mediaDoc.filename to fall back on empty string.
    });

    it("swaps the <img> for the inline fallback SVG markup when the image fails to load (broken/404 src)", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/png", size: 2048, src: "https://example.com/404.png" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      const img = container.querySelector("img");
      expect(img).not.toBeNull();

      fireEvent.error(img as HTMLImageElement);

      expect(container.querySelector("img")).toBeNull();
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      // `IconWrapper`'s inline fallback markup sizes the replacement icon
      // from `mediaDoc.size * 0.3` — 2048 * 0.3 is exact in floating point.
      expect(svg?.getAttribute("width")).toBe("614.4");
    });

    it("shows a plain <img> (object-contain) for image/svg+xml, never the raster <img> path", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/svg+xml", src: "https://example.com/logo.svg" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img).toHaveClass("object-contain");
    });

    it("shows the file icon (no <img>) for an svg with no src yet", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/svg+xml", src: "" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector(".lucide-file")).not.toBeNull();
    });

    it("shows the video icon for a video mime type", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "video/mp4" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector(".lucide-video")).not.toBeNull();
      expect(container.querySelector("img")).toBeNull();
    });

    it("shows the waveform icon for an audio mime type", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "audio/mpeg" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector(".lucide-audio-waveform")).not.toBeNull();
    });

    it("falls back to the generic file icon for an unrecognised/document mime type", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "application/pdf" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector(".lucide-file")).not.toBeNull();
    });

    it("falls back to the generic file icon for an image mime type with no src yet, even before any load error", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/png", src: "" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector(".lucide-file")).not.toBeNull();
    });

    it("falls back to the generic file icon for an unknown/absent mime type (empty string)", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector(".lucide-file")).not.toBeNull();
    });

    it("applies a fixed pixel size and custom radius when size is provided", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "application/pdf" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} size={48} radius={8} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.style.width).toBe("48px");
      expect(wrapper.style.height).toBe("48px");
      expect(wrapper.style.borderRadius).toBe("8px");
    });
  });
}

/**
 * Registers the `MediaLibraryGrid` describe block, driven by real seeded rows
 * in the kit's own `media` table through the convex-test bridge.
 *
 * @param access - RBAC matrix threaded to every render; see {@link RunMediaSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeMediaLibraryGrid(access: VexAccessConfig | undefined) {
  describe("MediaLibaryGrid (MediaLibraryGrid)", () => {
    const targetCollectionConfig = makeMockMediaCollection();

    /**
     * Seeds `rows` and mounts the grid over the same convex-test instance.
     *
     * @param options - Seed rows plus the grid's own selection props.
     * @returns The render result.
     */
    async function renderGrid(options: {
      rows?: Array<Partial<TestMediaInput>>;
      multi?: boolean;
      onSelect?: (ids: string[]) => void;
      selectedIds?: string[];
    }): Promise<{ utils: RenderResult; ids: string[] }> {
      const t = convexTest(schema, testModules);
      const ids = await seedMedia(t as never, options.rows ?? []);
      const { queryClient, convexClient } = buildConvexStack(t);
      const utils = renderWithVexProviders(
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <MediaLibraryGrid
              targetCollectionConfig={targetCollectionConfig}
              multi={options.multi ?? false}
              onSelect={options.onSelect ?? (() => {})}
              selectedIds={options.selectedIds}
            />
          </QueryClientProvider>
        </ConvexProvider>,
        { access },
      );
      return { utils, ids };
    }

    it("shows the loading copy while the initial find query is pending", async () => {
      // Asserted synchronously after mount: the real query has not resolved on
      // the first render, which is exactly the state under test.
      await renderGrid({ rows: [{ filename: "eventual.png" }] });
      expect(screen.getByText("Loading...")).toBeInTheDocument();
      // Let the real query settle so the assertion above is a genuine
      // first-render observation, not a swallowed pending update.
      await waitFor(() => expect(screen.getByText("eventual.png")).toBeInTheDocument());
    });

    it("shows the empty-state copy once the find query resolves with no items", async () => {
      await renderGrid({ rows: [] });
      await waitFor(() => expect(screen.getByText("No media files yet")).toBeInTheDocument());
    });

    it("renders exactly one tile when the find query resolves with a single item", async () => {
      const { utils } = await renderGrid({
        rows: [{ filename: "solo.png", mimeType: "image/png", size: 512 }],
      });

      await waitFor(() => expect(screen.getByText("solo.png")).toBeInTheDocument());
      expect(screen.queryByText("No media files yet")).not.toBeInTheDocument();
      // Scoped to the results grid, not the whole container — the search
      // bar's own "Type" filter button is also a `<button>`.
      expect(utils.container.querySelector(".grid")?.querySelectorAll("button")).toHaveLength(1);
    });

    it("renders one tile per item with its filename and formatted mime/size metadata", async () => {
      await renderGrid({
        rows: [
          { filename: "cover.png", mimeType: "image/png", size: 1536 },
          { filename: "manual.pdf", mimeType: "application/pdf", size: 2_500_000 },
        ],
      });

      await waitFor(() => expect(screen.getByText("cover.png")).toBeInTheDocument());
      expect(screen.getByText("PNG · 1.5 KB")).toBeInTheDocument();
      expect(screen.getByText("manual.pdf")).toBeInTheDocument();
      expect(screen.getByText("PDF · 2.4 MB")).toBeInTheDocument();
    });

    it("renders a pathologically long filename in full (as text content), even though it is CSS-truncated visually", async () => {
      const longFilename = `${"a".repeat(40)}-${"b".repeat(40)}-${"c".repeat(40)}.png`;
      await renderGrid({ rows: [{ filename: longFilename }] });

      await waitFor(() => expect(screen.getByText(longFilename)).toBeInTheDocument());
    });

    it("renders a filename containing unicode/emoji and one containing markup characters as plain text, with no injection", async () => {
      const unicodeName = "日本語 café résumé 📸.png";
      const markupName = "<img src=x onerror=alert(1)>.png";
      const { utils } = await renderGrid({
        // No `src`: the markup-injection assertion below counts `<img>`
        // elements, and a real preview src would legitimately render one.
        rows: [
          { filename: unicodeName, src: undefined },
          { filename: markupName, src: undefined },
        ],
      });

      await waitFor(() => expect(screen.getByText(unicodeName)).toBeInTheDocument());
      expect(screen.getByText(markupName)).toBeInTheDocument();
      // React text nodes are never parsed as markup — no extra <img> got
      // injected into the DOM from the markup-bearing filename.
      expect(utils.container.querySelectorAll("img")).toHaveLength(0);
    });

    it("single-select mode replaces the selection with the clicked item's id", async () => {
      const onSelect = vi.fn();
      const { ids } = await renderGrid({
        rows: [{ filename: "a.png" }, { filename: "b.png" }],
        multi: false,
        onSelect,
      });
      await waitFor(() => expect(screen.getByText("b.png")).toBeInTheDocument());

      fireEvent.click(screen.getByText("b.png").closest("button") as HTMLButtonElement);

      expect(onSelect).toHaveBeenCalledWith([ids[1]]);
    });

    it("multi-select mode toggles a new item into the existing selection", async () => {
      const onSelect = vi.fn();
      const t = convexTest(schema, testModules);
      const ids = await seedMedia(t as never, [{ filename: "a.png" }, { filename: "b.png" }]);
      const { queryClient, convexClient } = buildConvexStack(t);
      renderWithVexProviders(
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <MediaLibraryGrid
              targetCollectionConfig={targetCollectionConfig}
              multi
              onSelect={onSelect}
              selectedIds={[ids[0]!]}
            />
          </QueryClientProvider>
        </ConvexProvider>,
        { access },
      );
      await waitFor(() => expect(screen.getByText("b.png")).toBeInTheDocument());

      fireEvent.click(screen.getByText("b.png").closest("button") as HTMLButtonElement);

      expect(onSelect).toHaveBeenCalledWith([ids[0], ids[1]]);
    });

    it("multi-select mode toggles an already-selected item back out", async () => {
      const onSelect = vi.fn();
      const t = convexTest(schema, testModules);
      const ids = await seedMedia(t as never, [{ filename: "a.png" }, { filename: "b.png" }]);
      const { queryClient, convexClient } = buildConvexStack(t);
      renderWithVexProviders(
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <MediaLibraryGrid
              targetCollectionConfig={targetCollectionConfig}
              multi
              onSelect={onSelect}
              selectedIds={[ids[0]!, ids[1]!]}
            />
          </QueryClientProvider>
        </ConvexProvider>,
        { access },
      );
      await waitFor(() => expect(screen.getByText("a.png")).toBeInTheDocument());

      fireEvent.click(screen.getByText("a.png").closest("button") as HTMLButtonElement);

      expect(onSelect).toHaveBeenCalledWith([ids[1]]);
    });
  });
}

/**
 * Registers the `MediaUploadDropzone` describe block. The component's real
 * upload path runs end to end: `generateUploadUrl` and `createMediaDocument`
 * resolve through the convex-test bridge, and the storage adapter is supplied
 * via the public `StorageAdapterContextProvider` prop — no module mocks, so the
 * same assertions hold in a consumer's process.
 *
 * @param access - RBAC matrix threaded to every render; see {@link RunMediaSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeMediaUploadDropzone(access: VexAccessConfig | undefined) {
  describe("MediaUploadDropzone", () => {
    /**
     * Mounts the dropzone over a fresh convex-test instance and a recording
     * storage adapter.
     *
     * @param onUploadComplete - The completion callback under assertion.
     * @returns The render result, the convex-test instance, and the adapter spy.
     */
    function renderDropzone(onUploadComplete: (mediaId: string) => void = vi.fn()) {
      const t = convexTest(schema, testModules);
      const { queryClient, convexClient } = buildConvexStack(t);
      const uploadFile = vi.fn(async () => ({ storageId: "storage_dropzone_1" }));
      const utils = renderWithVexProviders(
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <StorageAdapterContextProvider adapterClients={{ convex: uploadFile }}>
              <MediaUploadDropzone
                targetCollection="images"
                adapterName="convex"
                onUploadComplete={onUploadComplete}
              />
            </StorageAdapterContextProvider>
          </QueryClientProvider>
        </ConvexProvider>,
        { access },
      );
      return { utils, t, uploadFile };
    }

    /**
     * Reads back every media row the dropzone's real mutation wrote.
     *
     * @param t - The convex-test instance the dropzone wrote through.
     * @returns Every row in the `media` table.
     */
    function uploadedMedia(t: ConvexTestInstance): Promise<TestDoc<"media">[]> {
      return readTable(t as never, "media");
    }

    it("renders the idle copy", () => {
      renderDropzone();
      expect(screen.getByText("📁 Drop file here or click to upload")).toBeInTheDocument();
    });

    it("shows the drag-active copy on dragenter and reverts on dragleave", async () => {
      const { utils } = renderDropzone();
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;

      fireEvent.dragEnter(root, { dataTransfer: { files: [], types: ["Files"] } });
      // react-dropzone's `onDragEnterCb` resolves the dragged files via a
      // `Promise.resolve(...).then(...)` before dispatching `isDragActive`,
      // so the state flip lands a microtask after `fireEvent` returns.
      await waitFor(() => expect(screen.getByText("Drop the file here...")).toBeInTheDocument());

      fireEvent.dragLeave(root, { dataTransfer: { files: [], types: ["Files"] } });
      expect(screen.getByText("📁 Drop file here or click to upload")).toBeInTheDocument();
    });

    it("does not enter the drag-active visual state when the dragged item is not a file (e.g. dragged text)", () => {
      const { utils } = renderDropzone();
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;

      fireEvent.dragEnter(root, { dataTransfer: { files: [], types: ["text/plain"] } });

      expect(screen.queryByText("Drop the file here...")).not.toBeInTheDocument();
      expect(screen.getByText("📁 Drop file here or click to upload")).toBeInTheDocument();
    });

    it("does nothing, and does not crash, when zero files are dropped", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t, uploadFile } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;

      // The drop and the tick that follows it are wrapped together: react-dropzone
      // settles its own internal state asynchronously after the event, so flushing
      // outside `act` makes React log "An update to MediaUploadDropzone inside a
      // test was not wrapped in act(...)" on this negative path.
      await act(async () => {
        fireEvent.drop(root, { dataTransfer: { files: [], types: ["Files"] } });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      expect(uploadFile).not.toHaveBeenCalled();
      expect(onUploadComplete).not.toHaveBeenCalled();
      expect(await uploadedMedia(t)).toHaveLength(0);
    });

    it("uploads a legitimate image file", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t, uploadFile } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("cover.png", "image/png");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
      // The adapter receives the real dropped File plus the signed URL the
      // bridge's `generateUploadUrl` handler minted.
      expect(uploadFile).toHaveBeenCalledWith(file, "https://example.com/fake-upload-url");
      expect(await uploadedMedia(t)).toMatchObject([
        {
          adapter: "convex",
          collectionSlug: "images",
          storageId: "storage_dropzone_1",
          filename: "cover.png",
          mimeType: "image/png",
          size: file.size,
          alt: "cover.png",
        },
      ]);
    });

    it("uploads a legitimate document file (application/pdf)", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("manual.pdf", "application/pdf");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
      expect(await uploadedMedia(t)).toMatchObject([
        { filename: "manual.pdf", mimeType: "application/pdf", size: file.size },
      ]);
    });

    it("uploads a legitimate video file (video/mp4)", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("clip.mp4", "video/mp4");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
      expect(await uploadedMedia(t)).toMatchObject([
        { filename: "clip.mp4", mimeType: "video/mp4", size: file.size },
      ]);
    });

    it("uploads a zero-byte file (no minimum size is configured anywhere in the upload pipeline)", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const file = new File([], "empty.png", { type: "image/png" });
      expect(file.size).toBe(0);

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
      expect(await uploadedMedia(t)).toMatchObject([{ filename: "empty.png", size: 0 }]);
    });

    it("attempts to upload a file far larger than any typical size limit, since none is configured anywhere in the upload pipeline (no maxSize on useDropzone, no size cap in core)", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("huge.bin", "application/octet-stream");
      // Fakes a 5GB file without allocating real memory — only `.size` is
      // ever read by this component.
      Object.defineProperty(file, "size", { value: 5_000_000_000 });

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
      expect(await uploadedMedia(t)).toMatchObject([
        { filename: "huge.bin", size: 5_000_000_000 },
      ]);
    });

    it("uploads a file whose name contains unicode/emoji, preserving it verbatim", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("日本語 café 🎉.png", "image/png");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
      expect(await uploadedMedia(t)).toMatchObject([
        { filename: "日本語 café 🎉.png", alt: "日本語 café 🎉.png" },
      ]);
    });

    it("uploads a file whose name contains markup characters, preserving it verbatim with no sanitization", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("<img src=x onerror=alert(1)>.png", "image/png");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1));
      expect(await uploadedMedia(t)).toMatchObject([
        { filename: "<img src=x onerror=alert(1)>.png" },
      ]);
    });

    it("rejects a disallowed mime type instead of uploading it, honoring the target collection's accepted media types", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t, uploadFile } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("malware.exe", "application/x-msdownload");

      // No positive event to await on the rejection path — flush a tick
      // before asserting the negative, inside `act` so react-dropzone's own
      // post-event state settle is not reported as an unwrapped update.
      await act(async () => {
        fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(uploadFile).not.toHaveBeenCalled(); // Regression guard (MEDIA-1): MediaUploadDropzone filters by fixed safe-media accept allowlist.
      expect(await uploadedMedia(t)).toHaveLength(0);
      expect(onUploadComplete).not.toHaveBeenCalled();
    });

    it("keeps the first dropped file and uploads it when multiple files are dropped at once, instead of rejecting the whole batch", async () => {
      const onUploadComplete = vi.fn();
      const { utils, t } = renderDropzone(onUploadComplete);
      const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
      const fileA = makeFile("a.png", "image/png");
      const fileB = makeFile("b.pdf", "application/pdf");

      fireEvent.drop(root, { dataTransfer: { files: [fileA, fileB], types: ["Files"] } });

      // `fields/upload/EmptyInput.tsx`'s own single-select drop handler
      // truncates to `files.slice(0, 1)` rather than rejecting the whole
      // drop — that sibling is the established intent for "single file
      // only" in this codebase, so the first file should upload here too.
      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledTimes(1)); // Regression guard (MEDIA-1): MediaUploadDropzone truncates multi-file drop to first file.
      expect(await uploadedMedia(t)).toMatchObject([{ filename: "a.png" }]);
    });
  });
}

/**
 * Runs the media contract: `FilePreview`'s per-mime rendering branches,
 * `MediaLibraryGrid`'s loading/empty/populated states plus single-/
 * multi-select, and `MediaUploadDropzone`'s accept behavior, drag-active
 * visual state, and multi-file drop handling — all against real convex-test
 * data through the bridge, with no module mocks, so a consumer running
 * `runVexReactSuite({ sections: ["media"] })` exercises the same paths.
 *
 * Call once at the top level of a `*.test.tsx` file; it calls
 * `describe`/`it` itself.
 *
 * @param props - Options for the run.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
export function runMediaSuite(props: RunMediaSuiteOptions = {}): void {
  const members: MediaSuiteMember[] =
    props.only ?? ["FilePreview", "MediaLibaryGrid", "MediaUploadDropzone"];
  if (members.includes("FilePreview")) describeFilePreview();
  if (members.includes("MediaLibaryGrid")) describeMediaLibraryGrid(props.access);
  if (members.includes("MediaUploadDropzone")) describeMediaUploadDropzone(props.access);
}
