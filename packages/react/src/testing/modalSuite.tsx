import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import type { MediaCollectionConfig, VexAccessConfig } from "@vexcms/core";

import { renderWithVexProviders, testCollection } from "./harness/accessFixtures";
import { createFakeConvexClient, type ConvexTestInstance } from "./convex/bridge";
import schema, { readTable, testModules, type TestDoc } from "./convex/schema";
import { Modal } from "../components/modals/BaseModal";
import { CreateDocumentModal } from "../components/modals/CreateDocumentModal";
import { CreateMediaModal } from "../components/modals/CreateMediaModal";
import { MODALS } from "../components/modals/constants";
import { StorageAdapterContextProvider } from "../context";
import { DialogContent, DialogHeader } from "../components/ui";
import { makeFile } from "../components/fields/upload/testFixture";

/** Member names {@link runModalSuite}'s `only` option accepts. */
export type ModalSuiteMember = "BaseModal" | "CreateDocumentModal" | "CreateMediaModal";

/** Options for {@link runModalSuite}. */
export interface RunModalSuiteOptions {
  /** Restrict the run to these members. Defaults to all three. */
  only?: ModalSuiteMember[];
  /**
   * RBAC matrix threaded to `renderWithVexProviders` for every render below,
   * for signature consistency with the other section suites. Currently
   * unexercised: none of `Modal`/`CreateDocumentModal`/`CreateMediaModal`
   * read `usePermission` themselves — the collection list view that opens
   * them is where `canCreate` gating happens (covered by `runViewSuite`).
   */
  access?: VexAccessConfig;
}

/**
 * Wires a fresh `convex-test` instance through the real `ConvexProvider` +
 * `ConvexQueryClient` + `QueryClient` stack, so a modal's own write path
 * (`useVexMutation` → `useConvexMutation` → `client.mutation`) runs for real
 * against convex-test data.
 *
 * This suite deliberately uses **no module mocks**: `vi.mock` only intercepts
 * inside `packages/react`'s own vitest module graph, so a mock-backed suite is
 * silently inert when a consumer runs `runVexReactSuite({ sections: ["modals"] })`
 * against the built `dist/testing` output — the exact dual-context failure class
 * ADR-009 exists to catch. Every assertion below therefore reads real state:
 * documents written into convex-test, or props the component itself called.
 *
 * @param t - The `convexTest()` instance the modal's queries/mutations hit.
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

/**
 * Minimal `MediaCollectionConfig` fixture — mirrors the inline mock already
 * proven in `media/MediaUploadForm.test.tsx` and `fields/upload/Input.test.tsx`.
 * Only the fields `CreateMediaModal` itself reads: `slug`, `labels.singular`,
 * `meta.storageAdapter`.
 *
 * @param overrides - Shallow overrides merged over the defaults.
 * @returns A `MediaCollectionConfig` usable as `CreateMediaModal`'s `collection` prop.
 */
function makeMockMediaCollection(overrides: Partial<MediaCollectionConfig> = {}): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {},
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
    ...overrides,
  } as unknown as MediaCollectionConfig;
}

/**
 * Registers the `Modal` (BaseModal) describe block.
 *
 * @param access - RBAC matrix threaded to every render; see {@link RunModalSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeBaseModal(access: VexAccessConfig | undefined) {
  describe("Modal (BaseModal)", () => {
    function buildModalTree(options: {
      searchParams?: string;
      onUrlUpdate?: (event: UrlUpdateEvent) => void;
    }) {
      return (
        <NuqsTestingAdapter searchParams={options.searchParams} onUrlUpdate={options.onUrlUpdate}>
          <button type="button">Outside trigger</button>
          <Modal urlParam="testModal">
            <DialogContent>
              <DialogHeader>Test modal</DialogHeader>
              <button type="button">First</button>
              <button type="button">Second</button>
            </DialogContent>
          </Modal>
        </NuqsTestingAdapter>
      );
    }

    function renderModal(
      options: { searchParams?: string; onUrlUpdate?: (event: UrlUpdateEvent) => void } = {},
    ) {
      return renderWithVexProviders(buildModalTree(options), { access });
    }

    it("stays closed when the url param is absent", () => {
      renderModal();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it('opens when the url param is "true"', async () => {
      renderModal({ searchParams: "?testModal=true" });
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("clears the url param and closes on Escape", async () => {
      const onUrlUpdate = vi.fn();
      const user = userEvent.setup();
      renderModal({ searchParams: "?testModal=true", onUrlUpdate });
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      const lastUpdate = onUrlUpdate.mock.calls.at(-1)?.[0] as UrlUpdateEvent;
      expect(lastUpdate.searchParams.has("testModal")).toBe(false);
    });

    it("clears the url param and closes on a backdrop click", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: "?testModal=true" });
      await screen.findByRole("dialog");
      const overlay = document.body.querySelector('[data-slot="dialog-overlay"]');
      if (!overlay) throw new Error("dialog overlay not found in document.body");

      await user.click(overlay);

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("traps focus: repeated Tab presses never move focus outside the dialog content", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: "?testModal=true" });
      const dialog = await screen.findByRole("dialog");

      for (let i = 0; i < 8; i += 1) {
        await user.tab();
        // The floating-focus-manager's guard-element redirect is deferred to
        // a `requestAnimationFrame` (see `enqueueFocus`), so the corrected
        // focus target isn't necessarily committed the instant `tab()`
        // resolves — `waitFor` polls until it lands, matching what a real
        // browser settles on well within human reaction time.
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      }
    });

    it("reopens cleanly the second time: closing via Escape and re-driving the url param back to true re-mounts the dialog with a fresh, un-trapped-by-the-old-instance focus trap", async () => {
      const user = userEvent.setup();
      const { rerender } = renderModal({ searchParams: "?testModal=true" });
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      rerender(buildModalTree({ searchParams: "?testModal=true" }));

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeInTheDocument();
      // Focus trapping still works on the second mount, not just the first.
      await user.tab();
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    });
  });
}

/**
 * Registers the `CreateDocumentModal` describe block. Every write assertion
 * reads the `documents` table back out of convex-test rather than spying on a
 * mocked mutation, so the same assertions hold inside a consumer's process.
 *
 * @param access - RBAC matrix threaded to every render; see {@link RunModalSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeCreateDocumentModal(access: VexAccessConfig | undefined) {
  describe("CreateDocumentModal", () => {
    /**
     * Mounts the modal over a fresh convex-test instance.
     *
     * @param options - URL state to drive the modal with.
     * @returns The render result plus the convex-test instance to assert writes against.
     */
    function renderModal(
      options: { searchParams?: string; onUrlUpdate?: (event: UrlUpdateEvent) => void } = {},
    ): { utils: RenderResult; t: ConvexTestInstance } {
      const t = convexTest(schema, testModules);
      const { queryClient, convexClient } = buildConvexStack(t);
      const utils = renderWithVexProviders(
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <NuqsTestingAdapter
              searchParams={options.searchParams}
              onUrlUpdate={options.onUrlUpdate}
            >
              <CreateDocumentModal collection={testCollection} />
            </NuqsTestingAdapter>
          </QueryClientProvider>
        </ConvexProvider>,
        { access },
      );
      return { utils, t };
    }

    /**
     * Reads the seeded `documents` rows back out of convex-test.
     *
     * @param t - The instance the modal wrote through.
     * @returns Every row currently in the `documents` table.
     */
    function createdDocuments(t: ConvexTestInstance): Promise<TestDoc<"documents">[]> {
      return readTable(t as never, "documents");
    }

    it(`renders nothing when ?${MODALS.createDocument.urlParam} is absent`, () => {
      renderModal();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens a create form with a control per collection field", async () => {
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      // Regression guard (CORE-LABEL-1): `testCollection`'s slug is "posts", and
      // `defineCollection` (`collections/config.ts`) singularizes a slug before
      // title-casing it for the derived `labels.singular` — matching its own JSDoc
      // example, `"posts"` -> `singular: "Post"`.
      expect(await screen.findByText("Create Post")).toBeInTheDocument();
      expect(document.body.querySelector("#status")).not.toBeNull();
      expect(screen.getByRole("button", { name: MODALS.createDocument.label })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("submits the typed field values through the real create mutation and closes", async () => {
      const user = userEvent.setup();
      const { t } = renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");

      const statusInput = document.body.querySelector("#status") as HTMLInputElement;
      await user.type(statusInput, "published");
      await user.click(screen.getByRole("button", { name: MODALS.createDocument.label }));

      // The write is asserted against the real row convex-test stored, not a
      // spy's arguments — the convex-test schema's `documents` table models
      // `title`, so `status` lands as an extra field on the inserted row.
      await waitFor(async () => {
        const rows = await createdDocuments(t);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ status: "published" });
      });
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("Cancel closes without writing a document", async () => {
      const user = userEvent.setup();
      const { t } = renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(await createdDocuments(t)).toHaveLength(0);
    });

    it("closes on Escape without writing a document", async () => {
      const user = userEvent.setup();
      const { t } = renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(await createdDocuments(t)).toHaveLength(0);
    });

    it("closes on a backdrop click", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");
      const overlay = document.body.querySelector('[data-slot="dialog-overlay"]');
      if (!overlay) throw new Error("dialog overlay not found in document.body");

      await user.click(overlay);

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("traps focus inside the dialog content", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      const dialog = await screen.findByRole("dialog");

      for (let i = 0; i < 8; i += 1) {
        await user.tab();
        // See BaseModal's "traps focus" test for why this is `waitFor`, not
        // a synchronous `expect`.
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      }
    });

    it("dismissal is not gated on the in-flight create: Escape pressed immediately after submit closes the dialog, and the write still lands", async () => {
      const { t } = renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");
      const statusInput = document.body.querySelector("#status") as HTMLInputElement;
      fireEvent.change(statusInput, { target: { value: "published" } });

      // No await between submit and Escape: the mutation is still in flight
      // when the dismissal arrives. Nothing in either concrete modal gates
      // Escape/backdrop dismissal on pending state.
      fireEvent.click(screen.getByRole("button", { name: MODALS.createDocument.label }));
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(async () => expect(await createdDocuments(t)).toHaveLength(1));
    });

    it("submitting the form twice in rapid succession creates the document only once", async () => {
      const { t } = renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");
      const statusInput = document.body.querySelector("#status") as HTMLInputElement;
      fireEvent.change(statusInput, { target: { value: "published" } });
      const submitButton = screen.getByRole("button", { name: MODALS.createDocument.label });

      // Two clicks with no await between them, simulating a rapid
      // double-click before React has re-rendered the button as disabled.
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(async () => expect((await createdDocuments(t)).length).toBeGreaterThan(0));
      // Awaiting the close is what the create's own success path does last
      // (`setOpen(null)`), so it is a real assertion — and it lets Base UI's
      // dialog teardown (portal, backdrop, popup, floating root) settle inside
      // `waitFor`'s act scope instead of after the test body has returned,
      // where React reports every one of those updates as unwrapped.
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      // Regression guard (MODAL-1): the synchronous in-flight flag rejects the
      // second submit before TanStack Form's async validation resolves, so a
      // rapid double-click creates exactly one document.
      expect(await createdDocuments(t)).toHaveLength(1);
    });
  });
}

/**
 * Registers the `CreateMediaModal` describe block. The real
 * `MediaUploadDropzone` renders inside the modal — the only injected
 * collaborator is the storage adapter's upload function, which is a public
 * `StorageAdapterContextProvider` prop, not a module mock.
 *
 * @param access - RBAC matrix threaded to every render; see {@link RunModalSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeCreateMediaModal(access: VexAccessConfig | undefined) {
  describe("CreateMediaModal", () => {
    /**
     * Mounts the modal with a real Convex stack and a recording storage adapter.
     *
     * @param options - URL state and an optional collection override.
     * @returns The render result, the convex-test instance, and the adapter spy.
     */
    function renderModal(
      options: {
        searchParams?: string;
        onUrlUpdate?: (event: UrlUpdateEvent) => void;
        collection?: MediaCollectionConfig;
      } = {},
    ) {
      const t = convexTest(schema, testModules);
      const { queryClient, convexClient } = buildConvexStack(t);
      const uploadFile = vi.fn(async () => ({ storageId: "storage_modal_1" }));
      const utils = renderWithVexProviders(
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <StorageAdapterContextProvider adapterClients={{ convex: uploadFile }}>
              <NuqsTestingAdapter
                searchParams={options.searchParams}
                onUrlUpdate={options.onUrlUpdate}
              >
                <CreateMediaModal collection={options.collection ?? makeMockMediaCollection()} />
              </NuqsTestingAdapter>
            </StorageAdapterContextProvider>
          </QueryClientProvider>
        </ConvexProvider>,
        { access },
      );
      return { utils, t, uploadFile };
    }

    /**
     * Drops one file on the modal's dropzone.
     *
     * @param filename - Name of the dropped file.
     * @returns Nothing; the drop is dispatched synchronously.
     */
    async function dropFile(filename: string): Promise<void> {
      const root = (await screen.findByRole("dialog")).querySelector(
        '[role="presentation"]',
      ) as HTMLElement;
      fireEvent.drop(root, {
        dataTransfer: { files: [makeFile(filename, "image/png")], types: ["Files"] },
      });
    }

    it(`renders nothing when ?${MODALS.uploadMedia.urlParam} is absent`, () => {
      renderModal();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens with the real dropzone mounted and titled from the collection's singular label", async () => {
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      expect(await screen.findByText("Upload Image")).toBeInTheDocument();
      expect(screen.getByText("📁 Drop file here or click to upload")).toBeInTheDocument();
    });

    it("wires the dropzone to the collection slug and its resolved storage adapter", async () => {
      const { t, uploadFile } = renderModal({
        searchParams: `?${MODALS.uploadMedia.urlParam}=true`,
      });

      await dropFile("via-modal.png");

      // Adapter identity and collection slug are proven by what the write
      // actually recorded, not by a stub's rendered label.
      await waitFor(async () => {
        const rows = await readTable(t as never, "media");
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
          adapter: "convex",
          collectionSlug: "images",
          filename: "via-modal.png",
        });
      });
      expect(uploadFile).toHaveBeenCalledTimes(1);
    });

    it('falls back to the "convex" adapter when meta.storageAdapter is unset', async () => {
      // Deliberately omits `storageAdapter` (required on `MediaCollectionMeta`) to
      // exercise the component's own "no adapter configured" fallback.
      const collectionWithoutAdapter = makeMockMediaCollection({
        meta: {} as MediaCollectionConfig["meta"],
      });
      const { t, uploadFile } = renderModal({
        searchParams: `?${MODALS.uploadMedia.urlParam}=true`,
        collection: collectionWithoutAdapter,
      });

      await dropFile("no-adapter-configured.png");

      // The only adapter registered in context is "convex": reaching it at all
      // proves the component defaulted to that slug rather than passing through
      // `undefined` (which would throw "Storage adapter ... not found").
      await waitFor(() => expect(uploadFile).toHaveBeenCalledTimes(1));
      await waitFor(async () =>
        expect(await readTable(t as never, "media")).toMatchObject([{ adapter: "convex" }]),
      );
    });

    it("closes the modal once the upload completes", async () => {
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });

      await dropFile("closes-modal.png");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it('the footer "Done" button closes without requiring an upload', async () => {
      const user = userEvent.setup();
      const { t } = renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.click(screen.getByRole("button", { name: "Done" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(await readTable(t as never, "media")).toHaveLength(0);
    });

    it("closes on Escape", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("closes on a backdrop click", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      await screen.findByRole("dialog");
      const overlay = document.body.querySelector('[data-slot="dialog-overlay"]');
      if (!overlay) throw new Error("dialog overlay not found in document.body");

      await user.click(overlay);

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("traps focus inside the dialog content", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      const dialog = await screen.findByRole("dialog");

      for (let i = 0; i < 8; i += 1) {
        await user.tab();
        // See BaseModal's "traps focus" test for why this is `waitFor`, not
        // a synchronous `expect`.
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      }
    });
  });
}

/**
 * Runs the shared modal contract — open/close driven by the `nuqs` url
 * param, Escape dismissal, backdrop-click dismissal, and focus trapping —
 * against `BaseModal`'s generic `<Modal>` wrapper plus the two concrete
 * modals built on it, and each concrete modal's own submit wiring.
 *
 * Uses no module mocks, so every section runs identically inside this package
 * and inside a consumer's own process (`runVexReactSuite({ sections: ["modals"] })`).
 *
 * Call once at the top level of a `*.test.tsx` file; it calls
 * `describe`/`it` itself.
 *
 * @param props - Options for the run.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
export function runModalSuite(props: RunModalSuiteOptions = {}): void {
  const members: ModalSuiteMember[] =
    props.only ?? ["BaseModal", "CreateDocumentModal", "CreateMediaModal"];
  if (members.includes("BaseModal")) describeBaseModal(props.access);
  if (members.includes("CreateDocumentModal")) describeCreateDocumentModal(props.access);
  if (members.includes("CreateMediaModal")) describeCreateMediaModal(props.access);
}
