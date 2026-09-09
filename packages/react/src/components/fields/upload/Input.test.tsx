import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { useForm } from "@tanstack/react-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminFieldToInputSchema, text } from "@vexcms/core";
import type {
  BaseFieldMeta,
  ClientVexConfig,
  InputComponentProps,
  MediaCollectionConfig,
  UploadField,
} from "@vexcms/core";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as HooksModule from "../../../hooks";

import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { uploadFieldFixture, makeFile } from "./testFixture";
import { AppForm } from "../../form/AppForm";
import { StorageAdapterContextProvider, VexConfigContext } from "../../../context";
import { UploadFieldInput } from "./Input";

// Mocked around the real modules (not replaced wholesale) so every OTHER test
// in this file that renders `UploadItemRow` (which calls `get()` -> the real
// `convexQuery`) keeps working unchanged. Only the two mutation hooks
// `MediaUploadForm.tsx` actually calls are swapped for controllable `vi.fn()`s.
const { generateUploadUrlMock, createMediaDocMock } = vi.hoisted(() => ({
  generateUploadUrlMock: vi.fn(),
  createMediaDocMock: vi.fn(),
}));

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return { ...actual, useConvexMutation: () => generateUploadUrlMock };
});

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof HooksModule>();
  return { ...actual, useVexMutation: () => ({ mutateAsync: createMediaDocMock }) };
});

// Minimal inline mock — mirrors the pattern in `media/MediaUploadForm.test.tsx`.
// Only the fields the upload field's render tree reads: `slug` (matches the
// fixture's `to`), `labels.plural` (the "Browse …" button text), and
// `meta.storageAdapter` (looked up by `MediaUploadForm`).
function makeMockMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {
      alt: text({ required: false }),
      filename: text({ required: false }),
    },
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

// Minimal client config — only `mediaCollections` is read on this path
// (`config.mediaCollections.find((mc) => mc.slug === fieldDef.to)` in both
// `Input.tsx` and `FilledInput.tsx`/`MediaPicker.tsx`).
const stubClientConfig = {
  mediaCollections: [makeMockMediaCollection()],
} as unknown as ClientVexConfig;

/**
 * Wraps `UploadFieldInput` with every context it reads outside `<AppForm>`:
 * `VexConfigContext` (media-collection lookup), a nuqs testing adapter (the
 * picker modal's URL-driven open state), a stub `StorageAdapterContextProvider`,
 * and the Convex/TanStack Query providers `MediaUploadForm`/`UploadItemRow`
 * need to mount without throwing — the same combination already proven in
 * `media/MediaUploadForm.test.tsx`. Passed as `runFieldInputContractSuite`'s
 * `Component` in place of the bare `UploadFieldInput`.
 */
function TestUploadFieldInput({
  name,
  fieldDef,
  readOnly,
  collection,
  index,
}: InputComponentProps<BaseFieldMeta, UploadField> & { field?: unknown }) {
  // No assertion in this file ever reads a resolved media doc or Browse-tab
  // search result — every `useQuery` reachable from this tree (`UploadItemRow`,
  // `Cell`, `MediaLibaryGrid`) only needs to render its pending/Skeleton state.
  // A `queryFn` that never resolves keeps that state deterministic: without one,
  // React Query logs "No queryFn was passed" on every render, and whatever
  // eventually settles the query updates state after the test's synchronous
  // assertions finish, outside `act(...)`.
  // ES2022 lib target (packages/tsconfig/react-library.json) has no
  // Promise.withResolvers, so this stays executor-form.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
  });
  const convexClient = new ConvexReactClient("https://example.convex.cloud");
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter>
          <VexConfigContext.Provider value={stubClientConfig}>
            <StorageAdapterContextProvider
              adapterClients={{ convex: async () => ({ storageId: "stub-id" }) }}
            >
              <UploadFieldInput
                name={name}
                fieldDef={fieldDef}
                readOnly={readOnly}
                collection={collection}
                index={index}
              />
            </StorageAdapterContextProvider>
          </VexConfigContext.Provider>
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </ConvexProvider>
  );
}

/** Mounts `TestUploadFieldInput` behind a real `useForm` + `<AppForm>`, per the shared harness's mounting mechanism. */
function Harness({
  fieldDef,
  readOnly,
  initialValue,
}: {
  fieldDef: UploadField;
  readOnly: boolean;
  initialValue: string[] | undefined;
}) {
  const form = useForm({ defaultValues: { testField: initialValue } });
  return (
    <AppForm form={form}>
      <TestUploadFieldInput
        name="testField"
        fieldDef={fieldDef}
        collection={testCollection}
        readOnly={readOnly}
      />
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: uploadFieldFixture,
  Component: TestUploadFieldInput,
  extra: ({ fixture }) => {
    beforeEach(() => {
      generateUploadUrlMock.mockReset();
      createMediaDocMock.mockReset();
      vi.unstubAllGlobals();
    });

    describe("upload field: empty vs. filled render branches", () => {
      it("renders the empty-state dropzone when there is no value, and the filled-state item list when there is", () => {
        const empty = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        expect(empty.getByText("Drop files here or click to browse")).toBeInTheDocument();
        expect(empty.container.querySelectorAll('button[title="Remove"]')).toHaveLength(0);

        // `render()`'s queries default-bind to `document.body`, not the returned
        // `container` — without an explicit `cleanup()` between mounts, `empty`'s
        // dropzone would still be in the document when `filled` asserts its absence.
        cleanup();

        const filled = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.valid} />,
        );
        expect(filled.queryByText("Drop files here or click to browse")).not.toBeInTheDocument();
        expect(filled.container.querySelectorAll('button[title="Remove"]')).toHaveLength(2);
      });

      it("[finding] shows a static '—' placeholder for a read-only field with no files, instead of the interactive dropzone", () => {
        // `Input.tsx` builds this exact JSX for `readOnly && value.length === 0`
        // — `<div className="text-sm text-muted-foreground">—</div>` — inside an
        // `if (readOnly) { <>...</>; }` block that never `return`s it. Execution
        // falls through to the interactive (but prop-disabled) dropzone below
        // instead. This asserts the code's own evident intent.
        render(<Harness fieldDef={fixture.fieldDef} readOnly={true} initialValue={fixture.empty} />);
        expect(screen.getByText("—")).toBeInTheDocument();
      });

      it("throws the config guard's exact message when fieldDef.to doesn't match any configured media collection", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const orphanFieldDef = { ...fixture.fieldDef, to: "does-not-exist" } as unknown as UploadField;
        try {
          expect(() =>
            render(
              <Harness fieldDef={orphanFieldDef} readOnly={false} initialValue={fixture.empty} />,
            ),
          ).toThrow('Media collection "does-not-exist" not found in config.');
        } finally {
          consoleError.mockRestore();
        }
      });
    });

    describe("upload field: dropzone accept/reject + file count", () => {
      it("declares the configured accept type on the dropzone", () => {
        const editable = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const editableInput = editable.container.querySelector('input[type="file"]');
        expect(editableInput).toHaveAttribute("accept", fixture.fieldDef.accept);
        expect(editableInput).not.toBeDisabled();

        // A read-only + empty field renders no dropzone at all (UI-7 — the
        // adjacent "[finding] shows a static '—' placeholder" test above
        // covers this state exactly), so there's nothing here to declare an
        // `accept` type on or disable — read-only rejects interaction more
        // completely than a disabled-but-present input would.
      });

      it("stages a selected file as a pending upload, without submitting it", async () => {
        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(fileInput, { target: { files: [makeFile("cover.png")] } });

        // The picker opens on the "upload" tab with the file staged in
        // MediaUploadForm's accordion — the button still reads "Create &
        // select (1)", not "Uploading…", so nothing has been submitted yet.
        expect(await screen.findByText("cover.png")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Create & select (1)" })).toBeTruthy();
      });

      it("[finding] stages a dropped file whose type doesn't match the configured accept, instead of rejecting it", async () => {
        // `accept` on an `<input type="file">` only filters the OS file-picker
        // dialog — it has NEVER filtered drag-and-drop, in any browser. A
        // dropzone that advertises `accept: "image/*"` should therefore filter
        // drops itself; `UploadEmpty`'s `handleDrop` never checks `file.type`
        // at all, so a mismatched drop is staged exactly like a match.
        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const dropzone = fileInput.parentElement as HTMLElement;
        const mismatchedFile = makeFile("document.pdf", "application/pdf");

        fireEvent.drop(dropzone, { dataTransfer: { files: [mismatchedFile] } });
        // Flush the async `openPicker()` (a nuqs `setActiveField` call) one tick
        // either way, since there's no positive event to await for a rejection.
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(screen.queryByText("document.pdf")).not.toBeInTheDocument();
      });

      it("[finding] stages every selected file even when hasMany is false", async () => {
        // `EmptyInput`'s file input is hardcoded `multiple` regardless of
        // `fieldDef.hasMany`, and `handleFilesSelected` keeps the whole
        // FileList — a single-select field should stage only the first file.
        const singleFieldDef = { ...fixture.fieldDef, hasMany: false, max: 1 };
        render(<Harness fieldDef={singleFieldDef} readOnly={false} initialValue={undefined} />);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(fileInput, {
          target: { files: [makeFile("first.png"), makeFile("second.png")] },
        });

        expect(await screen.findByText("first.png")).toBeInTheDocument();
        expect(screen.queryByText("second.png")).not.toBeInTheDocument();
      });
    });

    describe("upload field: filled-state file management", () => {
      it("disables 'Edit …' once mediaIds.length reaches fieldDef.max, and shows the exact n/max count", () => {
        const belowLimit = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.valid} />,
        );
        expect(belowLimit.getByRole("button", { name: "Edit Images" })).not.toBeDisabled();
        expect(belowLimit.getByText("2/3")).toBeInTheDocument();

        // See the cleanup() note above — same stale-DOM hazard across mounts.
        cleanup();

        const atLimit = render(
          <Harness
            fieldDef={fixture.fieldDef}
            readOnly={false}
            initialValue={["images_1", "images_2", "images_3"]}
          />,
        );
        expect(atLimit.getByRole("button", { name: "Edit Images" })).toBeDisabled();
        expect(atLimit.getByText("3/3")).toBeInTheDocument();
      });

      it("removes a single already-uploaded file via its row's Remove button, keeping the rest", () => {
        const { container } = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.valid} />,
        );
        expect(screen.getByText("2/3")).toBeInTheDocument();
        const removeButtons = container.querySelectorAll('button[title="Remove"]');
        expect(removeButtons).toHaveLength(2);

        fireEvent.click(removeButtons[0]);

        expect(screen.getByText("1/3")).toBeInTheDocument();
        expect(container.querySelectorAll('button[title="Remove"]')).toHaveLength(1);
      });

      it("clears every file via the multi-mode 'Clear' button, and the empty-state dropzone reappears", () => {
        // `Clear` calls `fieldApi.setValue([])` directly — it never goes through
        // `Input.tsx`'s own `handleRemove(undefined)` "remove all" branch, which
        // is unreachable dead code as a result (nothing else calls `onRemove()`
        // with no id).
        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.valid} />,
        );
        expect(screen.queryByText("Drop files here or click to browse")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Clear" }));

        expect(screen.getByText("Drop files here or click to browse")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Browse Images" })).toBeInTheDocument();
      });
    });

    describe("upload field: required-field schema behavior", () => {
      it("[finding] a required field's schema still accepts an empty array", () => {
        // `uploadFieldToInputSchema` wraps `z.array(z.string())` with no
        // `.min(1)` — `applyBaseInputSchemaMeta` only ever adds `.optional()`
        // for non-required fields, never a non-empty check for required ones.
        // A required upload field should reject "no files", the same way a
        // required text field rejects an empty string.
        expect(fixture.fieldDef.required).toBe(true);
        const schema = adminFieldToInputSchema({ field: fixture.fieldDef });
        const result = schema.safeParse([]);
        expect(result.success).toBe(false);
      });
    });

    describe("upload field: full upload flow via a mocked storage adapter", () => {
      it("round-trips a resolved media id through the picker's upload flow — the field ends up holding a string[] and the modal closes", async () => {
        generateUploadUrlMock.mockResolvedValue({ url: "https://storage.example/put/1" });
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({ ok: true, json: async () => ({ storageId: "stub-storage-id" }) }),
        );
        createMediaDocMock.mockResolvedValue("new-media-id");

        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [makeFile("cover.png")] } });

        const submitButton = await screen.findByRole("button", { name: "Create & select (1)" });
        fireEvent.click(submitButton);

        // `onComplete` -> `MediaPicker.handleUploadComplete` -> `onSelect` ->
        // `Input.tsx`'s `handleSelect` -> `field.handleChange(mediaIds)` +
        // `closePicker()` — the modal unmounts and the filled state (hasMany
        // controls) takes over.
        await waitFor(() =>
          expect(screen.queryByRole("button", { name: "Create & select (1)" })).not.toBeInTheDocument(),
        );
        expect(screen.getByRole("button", { name: "Edit Images" })).toBeInTheDocument();

        // TanStack Query v5's `Mutation.execute()` always invokes `mutationFn(variables,
        // mutationFnContext)` — a real `{ client, meta, mutationKey }` second argument
        // `MediaUploadForm.tsx` never controls — so the exact-args match only pins down
        // the business-relevant first argument, per `toHaveBeenCalledWith`'s all-args contract.
        expect(generateUploadUrlMock).toHaveBeenCalledWith(
          { adapter: "convex", collection: "images" },
          expect.anything(),
        );
        expect(createMediaDocMock).toHaveBeenCalledWith({
          adapter: "convex",
          collectionSlug: "images",
          storageId: "stub-storage-id",
          filename: "cover.png",
          mimeType: "image/png",
          size: expect.any(Number), // byte length of testFixture's incidental stub payload
          alt: "",
        });
      });

      // TODO: Un-skip once MediaUploadForm.tsx's onSubmit catch block gets a
      // real accessible error indicator (its own `// TODO: Show error toast`)
      // instead of `console.error` only — needs a UI component, not a
      // one-line fix, tracked separately from this spec's 24 defects.
      it.skip("[finding] recovers from a failed storage upload — the button un-sticks and the staged file survives for a retry, but nothing tells the user it failed", async () => {
        generateUploadUrlMock.mockResolvedValue({ url: "https://storage.example/put/1" });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));

        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [makeFile("cover.png")] } });

        const submitButton = await screen.findByRole("button", { name: "Create & select (1)" });
        fireEvent.click(submitButton);

        // Genuinely correct behavior today: `MediaUploadForm.tsx`'s `onSubmit`
        // catches the `!uploadResponse.ok` throw, so `form.state.isSubmitting`
        // still settles back to false and `form.reset()` is skipped — the
        // button un-sticks from "Uploading…" and the staged file isn't dropped.
        expect(await screen.findByRole("button", { name: "Create & select (1)" })).not.toBeDisabled();
        expect(screen.getByText("cover.png")).toBeInTheDocument();
        expect(createMediaDocMock).not.toHaveBeenCalled();

        // The catch block's only action is `console.error("Upload failed:", error)`
        // — see its own `// TODO: Show error toast` — so there is no accessible
        // indicator a user could notice. This asserts the reasonably-expected
        // outcome (some accessible error indicator exists) and documents the gap.
        expect(screen.queryByRole("alert")).not.toBeNull();
      });
    });
  },
});
