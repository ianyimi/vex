import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { TDocument, VexMediaDocument } from "@vexcms/core";
import { get } from "../../client";
import type { GenericId } from "convex/values";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { assertHydratesWithoutMismatch } from "../../testing/ssrHydration";
import { testCollection } from "../../testing/harness/accessFixtures";
import { UploadFieldCell } from "./Cell";
import { uploadFieldFixture } from "./testFixture";

/**
 * Minimal media document `FilePreview`/`UploadFieldCell` read.
 *
 * @param overrides - Fields to override on the default media document.
 * @returns A `VexMediaDocument` carrying every field this cell reads.
 */
function makeMediaDoc(overrides: Partial<VexMediaDocument> = {}): VexMediaDocument {
  return {
    _id: "images_1",
    _creationTime: 1,
    alt: "",
    filename: "cover-photo.png",
    mimeType: "image/png",
    size: 1024,
    storageId: "storage_1",
    deleted: false,
    src: "https://example.com/cover-photo.png",
    ...overrides,
  };
}

runFieldCellContractSuite({
  fixture: uploadFieldFixture,
  Component: UploadFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("upload: own rendering", () => {
      it("renders a full-width skeleton (not Loading...) before an unpopulated fallback row's media document resolves", () => {
        const queryClient = new QueryClient({
          defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
        });
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          withCellConfig(
            <QueryClientProvider client={queryClient}>
              <UploadFieldCell
                value={options.fixture.valid}
                row={row}
                fieldDef={options.fixture.fieldDef}
                fieldKey="field"
                isTitleField={false}
                collection={collection}
              />
            </QueryClientProvider>,
          ),
        );
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
      });

      it("renders the filename and a +N badge straight from populated row data — no query fired", () => {
        const mediaDoc = makeMediaDoc();
        // No queryFn at all: a populated row must render from row data alone,
        // never issue a query — this queryClient would throw/log if one fired.
        const queryClient = new QueryClient({
          defaultOptions: { queries: { enabled: false } },
        });
        const value = [mediaDoc, makeMediaDoc({ _id: "images_2" })];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        render(
          withCellConfig(
            <QueryClientProvider client={queryClient}>
              <UploadFieldCell
                value={value as never}
                row={row}
                fieldDef={options.fixture.fieldDef}
                fieldKey="field"
                isTitleField={false}
                collection={collection}
              />
            </QueryClientProvider>,
          ),
        );
        expect(screen.getByText(mediaDoc.filename)).toBeInTheDocument();
        expect(screen.getByText("+1")).toBeInTheDocument();
      });

      it("shows the resolved filename and a +N badge once an unpopulated fallback row's media document is cached", () => {
        const mediaDoc = makeMediaDoc();
        // A never-settling default `queryFn`, same as the skeleton case above:
        // the seeded cache entry is what this test asserts on, but an enabled query
        // with no `queryFn` at all makes React Query log "No queryFn was passed as
        // an option, and no default queryFn was found" to stderr on every run.
        const queryClient = new QueryClient({
          defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
        });
        queryClient.setQueryData(
          get({ id: mediaDoc._id as GenericId<"images">, collection: "images" }).queryKey,
          mediaDoc,
        );
        const value = ["images_1", "images_2"];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        render(
          withCellConfig(
            <QueryClientProvider client={queryClient}>
              <UploadFieldCell
                value={value}
                row={row}
                fieldDef={options.fixture.fieldDef}
                fieldKey="field"
                isTitleField={false}
                collection={collection}
              />
            </QueryClientProvider>,
          ),
        );
        expect(screen.getByText(mediaDoc.filename)).toBeInTheDocument();
        expect(screen.getByText("+1")).toBeInTheDocument();
      });
    });

    // No per-cell `useQuery` fetch for a populated row (the N+1 this fix
    // removes), and no isMounted-style gate either: server markup must
    // hydrate cleanly client-side for both the populated and empty branches
    // — no recoverable hydration error, no "hydrat..." console warning.
    describe("upload: SSR parity (no hydration gate)", () => {
      function elementFor(value: unknown) {
        const queryClient = new QueryClient({
          defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
        });
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        return withCellConfig(
          <QueryClientProvider client={queryClient}>
            <UploadFieldCell
              value={value as never}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />
          </QueryClientProvider>,
        );
      }

      it("empty value hydrates cleanly", async () => {
        await assertHydratesWithoutMismatch(elementFor([]) as ReactElement);
      });

      it("a populated doc hydrates cleanly, no skeleton or query involved", async () => {
        const mediaDoc = makeMediaDoc();
        await assertHydratesWithoutMismatch(elementFor([mediaDoc]) as ReactElement);
      });

      it("multiple populated docs hydrate cleanly", async () => {
        await assertHydratesWithoutMismatch(
          elementFor([makeMediaDoc(), makeMediaDoc({ _id: "images_2" })]) as ReactElement,
        );
      });
    });
  },
});
