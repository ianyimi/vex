import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineConfig, type RelationshipField, type VexClientConfig } from "@vexcms/core";
import { VexConfigContext } from "../../config/VexConfigContext";
import { relationshipFieldFixture, relationshipTargetCollection } from "./testFixture";
import { RelationshipFilterInput } from "./FilterInput";

const { useVexDocQueryMock } = vi.hoisted(() => ({ useVexDocQueryMock: vi.fn() }));
vi.mock("../../hooks/useVexDocQuery", () => ({ useVexDocQuery: useVexDocQueryMock }));

const { useCollectionListMock, setFilterValueTitleMock } = vi.hoisted(() => ({
  useCollectionListMock: vi.fn(),
  setFilterValueTitleMock: vi.fn(),
}));
vi.mock("../../collections/listView/ListViewContext", () => ({
  useListViewContext: useCollectionListMock,
}));

vi.mock("./RelationshipPicker", () => ({
  RelationshipPicker: ({
    onSelect,
    onCancel,
  }: {
    onSelect: (ids: string[]) => void;
    onCancel: () => void;
  }) => (
    <div role="dialog" aria-label="relationship picker stub">
      <button type="button" onClick={() => onSelect(["picked-id"])}>
        confirm pick
      </button>
      <button type="button" onClick={onCancel}>
        dismiss picker
      </button>
    </div>
  ),
}));

const config = defineConfig({ collections: [relationshipTargetCollection] }) as VexClientConfig;
const fieldDef = relationshipFieldFixture.fieldDef as RelationshipField;

function renderFilterInput(
  props: { value?: unknown; onChange?: (value: unknown) => void; disabled?: boolean } = {},
  filterValueTitles: Record<string, string | null> = {},
) {
  useCollectionListMock.mockReturnValue({ filterValueTitles, setFilterValueTitle: setFilterValueTitleMock });
  useVexDocQueryMock.mockReturnValue({ document: undefined, isPending: false });
  const onChange = props.onChange ?? vi.fn();
  render(
    <VexConfigContext.Provider value={config}>
      <RelationshipFilterInput
        field={fieldDef}
        value={props.value}
        op="eq"
        onChange={onChange}
        disabled={props.disabled}
      />
    </VexConfigContext.Provider>,
  );
  return { onChange };
}

describe("RelationshipFilterInput", () => {
  beforeEach(() => {
    setFilterValueTitleMock.mockClear();
  });

  it("shows Select… when no value is set", () => {
    renderFilterInput({ value: undefined });
    expect(screen.getByRole("button", { name: /^Filter value/ })).toHaveTextContent("Select…");
  });

  it("shows Select… for an empty string value too — ListViewFilterBuilder's emptyFilterValueForType default for a freshly-switched row, not undefined (regression)", () => {
    renderFilterInput({ value: "" });
    expect(screen.getByRole("button", { name: /^Filter value/ })).toHaveTextContent("Select…");
  });

  it("shows the resolved title from filterValueTitles when known", () => {
    renderFilterInput({ value: "doc1" }, { doc1: "Alpha" });
    expect(screen.getByRole("button", { name: "Filter value: Alpha" })).toHaveTextContent("Alpha");
  });

  it("falls back to the raw id when no title is known yet", () => {
    renderFilterInput({ value: "doc1" }, {});
    expect(screen.getByRole("button", { name: "Filter value: doc1" })).toHaveTextContent("doc1");
  });

  it("opens the picker on click and calls onChange with the picked id", async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilterInput({ value: undefined });
    await user.click(screen.getByRole("button", { name: /^Filter value/ }));
    expect(screen.getByRole("dialog", { name: "relationship picker stub" })).toBeInTheDocument();
    await user.click(screen.getByText("confirm pick"));
    expect(onChange).toHaveBeenCalledWith("picked-id");
  });

  it("closes the picker on cancel without calling onChange", async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilterInput({ value: undefined });
    await user.click(screen.getByRole("button", { name: /^Filter value/ }));
    await user.click(screen.getByText("dismiss picker"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("resolves a cold value's title via useVexDocQuery and records it via setFilterValueTitle", () => {
    useCollectionListMock.mockReturnValue({ filterValueTitles: {}, setFilterValueTitle: setFilterValueTitleMock });
    useVexDocQueryMock.mockReturnValue({ document: { _id: "doc1", title: "Cold Alpha" }, isPending: false });
    render(
      <VexConfigContext.Provider value={config}>
        <RelationshipFilterInput field={fieldDef} value="doc1" op="eq" onChange={vi.fn()} />
      </VexConfigContext.Provider>,
    );
    expect(setFilterValueTitleMock).toHaveBeenCalledWith("doc1", "Cold Alpha");
  });

  it("records null for a cold value that resolves to no document (not-found/denied)", () => {
    useCollectionListMock.mockReturnValue({ filterValueTitles: {}, setFilterValueTitle: setFilterValueTitleMock });
    useVexDocQueryMock.mockReturnValue({ document: null, isPending: false });
    render(
      <VexConfigContext.Provider value={config}>
        <RelationshipFilterInput field={fieldDef} value="missing" op="eq" onChange={vi.fn()} />
      </VexConfigContext.Provider>,
    );
    expect(setFilterValueTitleMock).toHaveBeenCalledWith("missing", null);
  });

  it("shows Unknown collection and a disabled trigger when the target collection isn't registered", () => {
    useCollectionListMock.mockReturnValue({ filterValueTitles: {}, setFilterValueTitle: setFilterValueTitleMock });
    useVexDocQueryMock.mockReturnValue({ document: undefined, isPending: false });
    render(
      <VexConfigContext.Provider value={defineConfig({ collections: [] }) as VexClientConfig}>
        <RelationshipFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} />
      </VexConfigContext.Provider>,
    );
    const trigger = screen.getByRole("button", { name: "Filter value: Unknown collection" });
    expect(trigger).toHaveTextContent("Unknown collection");
    expect(trigger).toBeDisabled();
  });
});
