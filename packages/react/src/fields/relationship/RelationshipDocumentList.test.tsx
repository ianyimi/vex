import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CollectionConfig, VexDocument } from "@vexcms/core";
import type * as HooksModule from "../../hooks";
import {
  relationshipFieldFixture,
  relationshipTargetCollection,
} from "./testFixture";
import { RelationshipDocumentList } from "./RelationshipDocumentList";

const { usePaginatedSearchMock } = vi.hoisted(() => ({
  usePaginatedSearchMock: vi.fn(),
}));

vi.mock("../../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof HooksModule>();
  return { ...actual, usePaginatedSearch: usePaginatedSearchMock };
});

function makeDoc(id: string, title: string): VexDocument {
  return { _id: id, _creationTime: 0, title } as unknown as VexDocument;
}

function baseResult(
  overrides: Partial<ReturnType<typeof usePaginatedSearchMock>> = {},
) {
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

const targetCollection = relationshipTargetCollection as CollectionConfig;

describe("RelationshipDocumentList", () => {
  it("renders skeleton rows while pending", () => {
    usePaginatedSearchMock.mockReturnValue(baseResult({ isPending: true }));
    const { container } = render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("renders an error message when the query fails", () => {
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ isError: true, error: new Error("boom") }),
    );
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("renders 'No documents found' for an empty result set", () => {
    usePaginatedSearchMock.mockReturnValue(baseResult());
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(screen.getByText("No documents found")).toBeInTheDocument();
  });

  it("hasMany: clicking an unselected row adds it to the selection", async () => {
    const user = userEvent.setup();
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ documents: [makeDoc("a", "Alpha"), makeDoc("b", "Bravo")] }),
    );
    const onSelectionChange = vi.fn();
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /alpha/i }));
    expect(onSelectionChange).toHaveBeenCalledWith(["a"]);
  });

  it("hasMany: clicking a selected row removes it from the selection", async () => {
    const user = userEvent.setup();
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ documents: [makeDoc("a", "Alpha"), makeDoc("b", "Bravo")] }),
    );
    const onSelectionChange = vi.fn();
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={["a"]}
        drafts={false}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /alpha/i }));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it("hasMany: disables unselected rows once at max", () => {
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ documents: [makeDoc("a", "Alpha"), makeDoc("b", "Bravo")] }),
    );
    const fieldDef = {
      ...relationshipFieldFixture.fieldDef,
      max: [1, "Too many"] as const,
    };
    render(
      <RelationshipDocumentList
        fieldDef={fieldDef}
        targetCollection={targetCollection}
        selectedIds={["a"]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /bravo/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /alpha/i })).toBeEnabled();
  });

  it("single-select: clicking a different row replaces the selection", async () => {
    const user = userEvent.setup();
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ documents: [makeDoc("a", "Alpha"), makeDoc("b", "Bravo")] }),
    );
    const onSelectionChange = vi.fn();
    const fieldDef = { ...relationshipFieldFixture.fieldDef, hasMany: false };
    render(
      <RelationshipDocumentList
        fieldDef={fieldDef}
        targetCollection={targetCollection}
        selectedIds={["a"]}
        drafts={false}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /bravo/i }));
    expect(onSelectionChange).toHaveBeenCalledWith(["b"]);
  });

  it("single-select: re-clicking the selected row clears it", async () => {
    const user = userEvent.setup();
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ documents: [makeDoc("a", "Alpha")] }),
    );
    const onSelectionChange = vi.fn();
    const fieldDef = { ...relationshipFieldFixture.fieldDef, hasMany: false };
    render(
      <RelationshipDocumentList
        fieldDef={fieldDef}
        targetCollection={targetCollection}
        selectedIds={["a"]}
        drafts={false}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /alpha/i }));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it("shows a Load more button when hasMore is true and calls loadMore on click", async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn();
    usePaginatedSearchMock.mockReturnValue(
      baseResult({
        documents: [makeDoc("a", "Alpha")],
        hasMore: true,
        loadMore,
      }),
    );
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });
});
