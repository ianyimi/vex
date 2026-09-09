import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { TDocument, VexMediaDocument } from "@vexcms/core";
import { get } from "@vexcms/core/client";
import type { GenericId } from "convex/values";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
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
      it('shows "Loading..." before the referenced media document resolves', () => {
        const queryClient = new QueryClient({
          defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
        });
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
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
        );
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });

      it("shows the resolved filename and a +N badge once the media document is cached", () => {
        const mediaDoc = makeMediaDoc();
        // A never-settling default `queryFn`, same as the "Loading..." case above:
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
        );
        expect(screen.getByText(mediaDoc.filename)).toBeInTheDocument();
        expect(screen.getByText("+1")).toBeInTheDocument();
      });
    });
  },
});
