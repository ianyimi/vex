import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineConfig } from "@vexcms/core";
import type { MediaCollectionConfig, VexClientConfig } from "@vexcms/core";
import { VexConfigContext } from "../../config/VexConfigContext";
import { uploadFieldFixture } from "./testFixture";
import { UploadFilterInput } from "./FilterInput";

const { useVexDocQueryMock } = vi.hoisted(() => ({ useVexDocQueryMock: vi.fn() }));
vi.mock("../../hooks/useVexDocQuery", () => ({ useVexDocQuery: useVexDocQueryMock }));

const { useCollectionListMock, setFilterValueTitleMock } = vi.hoisted(() => ({
  useCollectionListMock: vi.fn(),
  setFilterValueTitleMock: vi.fn(),
}));
vi.mock("../../collections/listView/ListViewContext", () => ({
  useListViewContext: useCollectionListMock,
}));

vi.mock("./UploadFilterPicker", () => ({
  UploadFilterPicker: ({
    onSelect,
    onCancel,
  }: {
    onSelect: (id: string | undefined) => void;
    onCancel: () => void;
  }) => (
    <div role="dialog" aria-label="upload picker stub">
      <button type="button" onClick={() => onSelect("picked-media-id")}>
        confirm pick
      </button>
      <button type="button" onClick={onCancel}>
        dismiss picker
      </button>
    </div>
  ),
}));

function makeMockMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {},
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

const config: VexClientConfig = defineConfig({ mediaCollections: [makeMockMediaCollection()] });
const fieldDef = uploadFieldFixture.fieldDef;

function renderFilterInput(
  props: { value?: unknown; onChange?: (value: unknown) => void; disabled?: boolean } = {},
  filterValueTitles: Record<string, string | null> = {},
) {
  useCollectionListMock.mockReturnValue({ filterValueTitles, setFilterValueTitle: setFilterValueTitleMock });
  useVexDocQueryMock.mockReturnValue({ document: undefined, isPending: false });
  const onChange = props.onChange ?? vi.fn();
  render(
    <VexConfigContext.Provider value={config}>
      <UploadFilterInput field={fieldDef} value={props.value} op="eq" onChange={onChange} disabled={props.disabled} />
    </VexConfigContext.Provider>,
  );
  return { onChange };
}

describe("UploadFilterInput", () => {
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
    renderFilterInput({ value: "media1" }, { media1: "hero.png" });
    expect(screen.getByRole("button", { name: "Filter value: hero.png" })).toHaveTextContent("hero.png");
  });

  it("falls back to the raw id when no title is known yet", () => {
    renderFilterInput({ value: "media1" }, {});
    expect(screen.getByRole("button", { name: "Filter value: media1" })).toHaveTextContent("media1");
  });

  it("opens the picker on click and calls onChange with the picked id", async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilterInput({ value: undefined });
    await user.click(screen.getByRole("button", { name: /^Filter value/ }));
    expect(screen.getByRole("dialog", { name: "upload picker stub" })).toBeInTheDocument();
    await user.click(screen.getByText("confirm pick"));
    expect(onChange).toHaveBeenCalledWith("picked-media-id");
  });

  it("closes the picker on cancel without calling onChange", async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilterInput({ value: undefined });
    await user.click(screen.getByRole("button", { name: /^Filter value/ }));
    await user.click(screen.getByText("dismiss picker"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("resolves a cold value's title via useVexDocQuery, keyed by the field's `to`, not `collection.slug`", () => {
    useCollectionListMock.mockReturnValue({ filterValueTitles: {}, setFilterValueTitle: setFilterValueTitleMock });
    useVexDocQueryMock.mockReturnValue({ document: { _id: "media1" }, isPending: false });
    render(
      <VexConfigContext.Provider value={config}>
        <UploadFilterInput field={fieldDef} value="media1" op="eq" onChange={vi.fn()} />
      </VexConfigContext.Provider>,
    );
    expect(useVexDocQueryMock).toHaveBeenCalledWith(expect.objectContaining({ collection: "images" }));
    expect(setFilterValueTitleMock).toHaveBeenCalledWith("media1", "media1");
  });

  it("shows Unknown collection and a disabled trigger when the target media collection isn't registered", () => {
    useCollectionListMock.mockReturnValue({ filterValueTitles: {}, setFilterValueTitle: setFilterValueTitleMock });
    useVexDocQueryMock.mockReturnValue({ document: undefined, isPending: false });
    render(
      <VexConfigContext.Provider value={defineConfig({ mediaCollections: [] }) as VexClientConfig}>
        <UploadFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} />
      </VexConfigContext.Provider>,
    );
    const trigger = screen.getByRole("button", { name: "Filter value: Unknown collection" });
    expect(trigger).toHaveTextContent("Unknown collection");
    expect(trigger).toBeDisabled();
  });
});
