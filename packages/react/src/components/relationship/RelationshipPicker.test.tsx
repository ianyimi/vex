import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CollectionConfig } from "@vexcms/core";
import {
  relationshipFieldFixture,
  relationshipTargetCollection,
} from "../fields/relationship/testFixture";
import { RelationshipPicker } from "./RelationshipPicker";

vi.mock("./RelationshipDocumentList", () => ({
  RelationshipDocumentList: ({
    selectedIds,
    onSelectionChange,
  }: {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  }) => (
    <div>
      <p>document list ({selectedIds.length} selected)</p>
      <button
        type="button"
        onClick={() => onSelectionChange([...selectedIds, "doc-new"])}
      >
        pick doc-new
      </button>
    </div>
  ),
}));

vi.mock("../modals/CreateDocumentForm", () => ({
  CreateDocumentForm: ({
    onCreated,
    onCancel,
    onSubmittingChange,
  }: {
    onCreated: (id: string) => void;
    onCancel: () => void;
    onSubmittingChange?: (isSubmitting: boolean) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onCreated("doc-created")}>
        finish create
      </button>
      <button type="button" onClick={onCancel}>
        cancel create
      </button>
      <button type="button" onClick={() => onSubmittingChange?.(true)}>
        start submit
      </button>
      <button type="button" onClick={() => onSubmittingChange?.(false)}>
        end submit
      </button>
    </div>
  ),
}));

const targetCollection = relationshipTargetCollection as CollectionConfig;

describe("RelationshipPicker", () => {
  it("opens on the Select tab by default and lists the document picker", () => {
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("document list (0 selected)")).toBeInTheDocument();
  });

  it('opens directly on the Create tab when defaultTab is "create"', () => {
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        defaultTab="create"
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "finish create" }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the current selection when Select is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={["doc-1"]}
        drafts={false}
        onSelect={onSelect}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "pick doc-new" }));
    await user.click(screen.getByRole("button", { name: "Select 2" }));

    expect(onSelect).toHaveBeenCalledWith(["doc-1", "doc-new"]);
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelect={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("hasMany: creating a document auto-selects it and returns to the Select tab instead of closing", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        defaultTab="create"
        onSelect={onSelect}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "finish create" }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(
      await screen.findByText("document list (1 selected)"),
    ).toBeInTheDocument();
  });

  it("single-select: creating a document calls onSelect immediately instead of returning to Select", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const singleFieldDef = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
    };
    render(
      <RelationshipPicker
        fieldDef={singleFieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        defaultTab="create"
        onSelect={onSelect}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "finish create" }));
    expect(onSelect).toHaveBeenCalledWith(["doc-created"]);
  });

  it("blocks dismissal while CreateDocumentForm reports an in-flight submit", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        defaultTab="create"
        onSelect={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "start submit" }));
    await user.keyboard("{Escape}");
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "end submit" }));
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
