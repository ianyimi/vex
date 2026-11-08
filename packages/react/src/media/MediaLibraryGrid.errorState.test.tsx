import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MediaCollectionConfig, VexMediaDocument } from "@vexcms/core";
import type * as HooksModule from "../hooks";
import type { UsePaginatedSearchReturn } from "../hooks/usePaginatedSearch";
import { MediaLibraryGrid } from "./MediaLibraryGrid";

const { usePaginatedSearchMock } = vi.hoisted(() => ({
  usePaginatedSearchMock: vi.fn(),
}));

vi.mock("../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof HooksModule>();
  return { ...actual, usePaginatedSearch: usePaginatedSearchMock };
});

function baseResult(
  overrides: Partial<UsePaginatedSearchReturn<VexMediaDocument>> = {},
): UsePaginatedSearchReturn<VexMediaDocument> {
  return {
    documents: [],
    isPending: false,
    isError: false,
    error: undefined,
    hasMore: false,
    isLoadingMore: false,
    loadMore: vi.fn(),
    ...overrides,
  };
}

const targetCollectionConfig = {
  slug: "images",
  labels: { singular: "Image", plural: "Images" },
} as unknown as MediaCollectionConfig;

describe("MediaLibraryGrid — error state (mocked usePaginatedSearch)", () => {
  it("shows the query's error message, not the empty-state copy, when the find query fails", () => {
    usePaginatedSearchMock.mockReturnValue(baseResult({ isError: true, error: new Error("boom") }));
    render(
      <MediaLibraryGrid
        targetCollectionConfig={targetCollectionConfig}
        multi={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByText("boom").length).toBeGreaterThan(0);
    expect(screen.queryByText("No media files yet")).not.toBeInTheDocument();
  });

  it("announces the error in the sr-only status region", () => {
    usePaginatedSearchMock.mockReturnValue(baseResult({ isError: true, error: new Error("boom") }));
    render(
      <MediaLibraryGrid
        targetCollectionConfig={targetCollectionConfig}
        multi={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("boom");
  });
});
